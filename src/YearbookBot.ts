import * as Discord from 'discord.js';
import * as Canvas from 'canvas';
import { Command, Module } from './Module';
import { ProcessorBot } from './ProcessorBot';
import { PROCESS } from './ProcessMessage';
import * as Crypto from 'crypto';

// @to-do NAME GET

export class YearbookBot implements Module {
    name: string = "Yearbook Bot";
    keys: Map<string, { to: Discord.User, from: Discord.User, callback:() => void }>;
    requestsfor: Map<string, string[]>;
    db: FirebaseFirestore.Firestore;
    client: Discord.Client;
    commands:Command[];

    signatureCache: Map<string, {LINK:string, USERID:string}[]>;

    constructor(db: FirebaseFirestore.Firestore, client: Discord.Client) {
        this.db = db;
        this.keys = new Map();
        this.requestsfor = new Map();
        this.client = client;
        this.signatureCache = new Map();
    }

    async onConstruct(): Promise<void> {
        let data = await this.db.collection("Yearbook").get();
        for(const doc of data.docs) {
            this.requestsfor.set(doc.id, []);
            this.signatureCache.set(doc.id, doc.data().SIGNATURES);
        }

        console.log(this.signatureCache);
        
        this.commands = [
            {
                name: 'CreateUser',
                description: 'Creates a user for the Yearbook Signing Bot (in development)',
                available: () => true,
                parameters: [],
                regularCallback: async (message) => {
                    if (!this.userExists(message.author.id)) {
                        await this.createUser(message.author);
                        message.channel.send({
                            embed: {
                                color: 1111111,
                                description: `User created! <:chomp:788142366015881236>`
                            }
                        })
                    } else {
                        message.channel.send({
                            embed: {
                                color: 1111111,
                                description: `Your account already exists!`
                            }
                        })
                    }
                },
                slashCallback: async (invoke, channel, user) => {
                    if (!this.userExists(user.id)) {
                        await this.createUser(user);
                        invoke({
                            embed: {
                                color: 1111111,
                                description: `User created! <:chomp:788142366015881236>`
                            }
                        })
                    } else {
                        invoke({
                            embed: {
                                color: 1111111,
                                description: `Your account already exists!`
                            }
                        })
                    }
                }
            },
            {
                name: "RequestSignature",
                description: "Requests a signature from a person",
                parameters: [{
                    name: "Mention",
                    description: "Must be a Discord mention of the signer.",
                    type: "string",
                    required: true
                }],
                available: () => true,
                regularCallback: async (message,mention) => {
                    let user = await this.parseMention(mention);
                    if (user) {

                        if (!this.userExists(user.id)) {
                            message.channel.send({
                                embed: {
                                    color: 1111111,
                                    description: `<@!${user.id}> has not signed up yet! They must run --create or /create first, before accepting requests. (Also, /request and /sign implicitly create accounts for the user.)`
                                }
                            })
                            return;
                        }

                        if (!this.userExists(message.author.id)) {
                            // implicitly create
                            await this.createUser(message.author);
                        }


                        if (this.requestsfor.get(user.id).includes(message.author.id)) {
                            message.channel.send({
                                embed: {
                                    color: 1111111,
                                    description: `You've already requested ${user}'s presence!`
                                }
                            })
                            return;
                        }
                        this.requestsign(message.author, user);

                        message.channel.send({
                            content: `<@!${user.id}>`,
                            embed: {
                                color: 1111111,
                                description: `${user}, your presence has been requested by ${message.author}! Type --sign or /sign to begin signing!`
                            }
                        })

                    } else {
                        message.channel.send({
                            embed: {
                                color: 1111111,
                                description: `Invalid mention! The parameter to request-signature must be a Discord ping to a specific person.`
                            }
                        })
                    }
                },
                slashCallback: async(invoke, channel, user ,mention) => {
                    let requested = await this.parseMention(mention);
                    if (requested) {

                        if (!this.userExists(requested.id)) {
                            invoke({
                                embed: {
                                    color: 1111111,
                                    description: `<@!${requested.id}> has not signed up yet! They must run --create or /create first, before accepting requests. (Also, /request and /sign implicitly create accounts for the user.)`
                                }
                            })
                            return;
                        }

                        if (!this.userExists(user.id)) {
                            // implicitly create
                            await this.createUser(user);
                        }


                        if (this.requestsfor.get(requested.id).includes(user.id)) {
                            invoke({
                                embed: {
                                    color: 1111111,
                                    description: `You've already requested ${requested}'s presence!`
                                }
                            })
                            return;
                        }
                        this.requestsign(user, requested);

                        await invoke({
                            embed: {
                                color: 1111111,
                                description: `Your presence has been requested by ${requested}! Type --sign or /sign to begin signing!`
                            }
                        })
                        channel.send(`<@!${requested.id}>`);

                    } else {
                        invoke({
                            embed: {
                                color: 1111111,
                                description: `Invalid mention! The parameter to request-signature must be a Discord ping to a specific person.`
                            }
                        })
                    }
                }
            },
            {
                name: "Sign",
                description: "Starts a signing session to sign others' yearbooks.",
                parameters: [],
                available: () => true,
                regularCallback: async (message) => {
                    this.sign(message.author);
                    message.channel.send({
                        embed: {
                            description: `Started!`,
                            color: 111111
                        }
                    })
                },
                slashCallback: async (invoke, channel, user) => {
                    this.sign(user);
                    invoke({
                        embed: {
                            description: `Started!`,
                            color: 111111
                        }
                    })
                }
            }
        ]

        // await this.deleteSignatureByIndex('473635602630311938', 1);
    }

    async createUser(user: Discord.User) {
        if (this.userExists(user.id)) throw "Uh oh!";
        await this.db.collection("Yearbook").doc(user.id).set({
            TAG: user.username,
            DISCRIMINATOR: user.discriminator,
            SIGNATURES: [],
            NAME: user.tag + '#' + user.discriminator
        })
        this.requestsfor.set(user.id, []);
        this.signatureCache.set(user.id, []);
    }

    getSignatures(userID: string) {
        return this.signatureCache.get(userID);
    }

    setSigatures(userID: string, signatures: {LINK: string, USERID: string}[]) {
        this.signatureCache.set(userID, signatures);
    }

    async deleteSignatureByIndex(userID:string, index: number) {
        this.setSigatures(userID, this.getSignatures(userID).filter((_,i) => i!==index));
        await this.pushSignature(userID);
    }

    async swapSignatures(userID:string,index1:number, index2:number) {
        let signatures = this.getSignatures(userID);
        ;[signatures[index1], signatures[index2]] = [signatures[index2], signatures[index1]];
        await this.pushSignature(userID);
    }

    private async pushSignature(userID:string) {
        await this.db.collection("Yearbook").doc(userID).update({
            SIGNATURES: this.getSignatures(userID)
        })
    }

    requestsign(requester: Discord.User, requested: Discord.User) {
        if( this.requestsfor.has(requested.id) && !this.requestsfor.get(requested.id).includes(requester.id) ) {
            this.requestsfor.set(requested.id, [...this.requestsfor.get(requested.id), requester.id])
        } else {
            console.log("Uh oh!");
        }
    }

    userExists(userID: string) {
        return this.requestsfor.has(userID);
    }

    generateToken() {
        return Crypto.randomBytes(16).toString('hex');
    }

    generateLink(from: Discord.User, to: Discord.User, token: string) {
        this.keys.set(token, {
            to,
            from,
            callback: () => {
            }
        });

        let fromthing = [...(from.username + from.discriminator)].filter(a => 'abcdefghijklmnopqrstuvwxyz0123456789 '.includes(a.toLowerCase())).join('');
        let tothing = [...(to.username + to.discriminator)].filter(a => 'abcdefghijklmnopqrstuvwxyz0123456789 '.includes(a.toLowerCase())).join('');
        let link = `https://bubbybabur.github.io/sign?S=${encodeURI(fromthing)}&R=${encodeURI(tothing)}&KEY=${encodeURI(token)}`;
        return link;
    }

    async parseMention(mention:string): Promise<false|Discord.User> {
        mention = mention.replace(/ /g, '');
        if(!(mention.length === 22 && mention.startsWith('<@!') && mention.endsWith('>') && [...mention.slice(3,-1)].every(char => '0123456789'.includes(char)))) {
            return false;
        }
        let id = mention.slice(3,-1);
        let user = await this.client.users.fetch(id);

        if(user) {
            return user;
        } else {
            return false;
        }
    }

    async onMessage(message: Discord.Message): Promise<void> {
        let result = PROCESS(message);
        if(result) {

            if(result.command === "brrr") {

                let size = 600;
                let rows = 4;
                let blockwidth = size/rows;
                const canvas = Canvas.createCanvas(size, size);
                const ctx = canvas.getContext('2d');

                // const background = await Canvas.loadImage('./testing/DOG.jpg');
                // ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

                // const applyText = (text:string, d?:number ) => {
                //     const ctx = canvas.getContext('2d');

                //     // Declare a base size of the font
                //     let fontSize = d || 200;

                //     do {
                //         // Assign the font to the context and decrement it so it can be measured again
                //         ctx.font = `${fontSize -= 10}px sans-serif`;
                //         // Compare pixel width of the text to the canvas minus the approximate avatar size
                //     } while (ctx.measureText(text).width > canvas.width-100);

                //     // Return the result to use in the actual canvas
                //     return fontSize;
                // };

                let positions: number[][] = [];
                for (let i = 0; i < rows; i++) {
                    if(i%2 === 1){
                        for (let j = 0; j < rows-1; j++) {
                            positions.push([j * blockwidth + blockwidth/2, i * blockwidth]);
                        }
                    } else {
                        for (let j = 0; j < rows; j++) {
                            positions.push([j * blockwidth, i * blockwidth]);
                        }
                    }
                }

                ctx.fillStyle = "white";
                ctx.fillRect(0,0,canvas.width, canvas.height);

                let signatures = this.getSignatures("473635602630311938");
                for (let i = 0; i < Math.min(positions.length, signatures.length) ; i++) {
                    const img = await Canvas.loadImage(signatures[i].LINK);
                    ctx.drawImage(img, positions[i][0], positions[i][1], blockwidth, blockwidth);
                }

                ctx.strokeStyle = "blue";
                for(let p of positions) {
                    // ctx.strokeRect(p[0], p[1], blockwidth, blockwidth);
                }

                
                // pdf merge

                const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'test.png');

                message.channel.send(attachment);
            }
        }

        // WEBHOOK
        if (message.channel.id === '839207825535795210') {
            // console.log(message);
            if(message.webhookID) {
                let KEY = message.content;
                if(message.attachments.size > 0 && this.keys.has(KEY)){
                    let url = message.attachments.first().url;
                    const {from, to, callback} = this.keys.get(KEY);
                    this.keys.delete(KEY);

                    let { SIGNATURES } = (await this.db.collection("Yearbook").doc(to.id).get()).data();
                    SIGNATURES.push({
                        LINK: url,
                        USERID: from.id
                    })

                    await this.db.collection("Yearbook").doc(to.id).update({
                        SIGNATURES
                    })

                    this.signatureCache.get(to.id).push({
                        LINK: url,
                        USERID: from.id
                    })

                    callback();
                }
                
                
            }
        }
    }
    
    async sign(signerUser: Discord.User){
        if (this.parent.DMSessions.has(signerUser.id)) {
            signerUser.send({
                embed: {
                    description: `The module ${this.parent.DMSessions.get(signerUser.id)} is already using this DM-Channel. Resolve that interaction first by continuining with the process or by sending "end".`,
                    color: 1111111
                }
            })
            return;
        }

        if (!this.userExists(signerUser.id)) {
            await this.createUser(signerUser);
        }

        this.parent.DMSessions.set(signerUser.id, this.name);

        let requestees = () => {
            return this.requestsfor.get(signerUser.id);
        }

        let sendHelp = async () => {
            await signerUser.send({
                embed: {
                    title: 'Signing Yearbook!',
                    description: `To sign someone's yearbook, they first need to request it via --request or /request.\n` +
                        `${requestees().length > 0 ? `These people have requested your signature: \n${requestees().map((id, i) => `${i + 1}: <@!${id}>`).join('\n')}\n\nIn this channel, type the number of the person you want to sign, or type "end" to end the session.` : `Sad! It seems like no one has requested your signature.`}`,
                    
                    color: 1111111,

                    fields: requestees().length > 0 ? [
                        {
                            name: "Commands", 
                            value: `# - Type in any number to sign that person's yearbook\n` +
                                `help - Resend this message\n` + 
                                `end - End the session`
                        }
                    ] : []
                }
            })
        }

        if(requestees().length === 0) {
            await sendHelp();
        }

        while (requestees().length > 0) {
            await sendHelp();

            let a: Discord.Collection<string, Discord.Message>;
            try {
                a = await signerUser.dmChannel.awaitMessages((m: Discord.Message) => {
                    return !m.author.bot;
                }, { max: 1, time: 1000 * 60 * 10, errors: ['time'] });
            } catch (err) {
                await signerUser.send({
                    embed: {
                        description: "The signing session timed out. To restart it, run /sign or --sign in a server.",
                        color: 1111111
                    }
                })
                break;
            }

            let m = a.first();
            if (!isNaN(parseInt(m.content))) {
                let num = parseInt(m.content) - 1;
                if (!(num >= 0 && num < requestees().length)) {
                    await signerUser.send({
                        embed: {
                            description: `Invalid requester number! Please send a number between 1 and ${requestees().length}.`,
                            color: 1111111
                        }
                    })
                } else {
                    let userBeingSignedID = requestees()[num];
                    // SIGNING HERE

                    let token = this.generateToken();
                    await signerUser.send({
                        embed: {
                            title: `Signing Yearbook`,
                            description: `Signing <@!${userBeingSignedID}>'s yearbook! \n***Use this link to sign:*** ${this.generateLink(signerUser, await this.client.users.fetch(userBeingSignedID), token)} \n(I promise its not a virus)\n\n` +
                                `To abort, type "end".`,
                            color: 1111111
                        }
                    });

                    let returnpromise = new Promise((res, rej) => {

                        let resolved = false;
                        // Resolve if done
                        this.keys.get(token).callback = () => {
                            resolved = true;
                            res(true);
                        }

                        // Also resolve if message is end
                        // lmao this code please kill me
                        (async () => {

                            while (!resolved) {
                                let b: Discord.Collection<string, Discord.Message>;
                                try {
                                    b = await signerUser.dmChannel.awaitMessages((m: Discord.Message) => {
                                        return !m.author.bot;
                                    }, { max: 1, time: 1000 * 30*60, errors: ['time'] }); // * 60 in production
                                } catch (err) {

                                    if (!resolved) {
                                        await signerUser.send({
                                            embed: {
                                                description: `The signature timed out. To restart it, retype the number or type "help" if you're confused.`,
                                                color: 1111111
                                            }
                                        })
                                        resolved = true;
                                        res(false);
                                    }

                                }

                                if (!resolved) {
                                    if (b.first().content.toLowerCase() === "end") {
                                        await signerUser.send({
                                            embed: {
                                                description: `Aborted!`,
                                                color: 1111111
                                            }
                                        })
                                        resolved = true;
                                        res(false);
                                    }
                                }
                            }

                        })();

                    })

                    let resolved = await returnpromise;

                    if (resolved) {
                        // console.log(this.signatureCache)
                        await signerUser.send({
                            embed: {
                                description: `🥳 Successfully Signed Yearbook for <@!${userBeingSignedID}>!`,
                                color: 1111111,
                                image: {
                                    url: this.signatureCache.get(userBeingSignedID).find((d) => d.USERID === signerUser.id).LINK
                                }
                            }
                        });

                        this.requestsfor.set(signerUser.id, this.requestsfor.get(signerUser.id).filter(c => c !== userBeingSignedID));
                    }

                }
            } else if (m.content.toLowerCase() === "end") {
                await signerUser.send({
                    embed: {
                        description: "Session ended! To restart it, run /sign or --sign in a server.",
                        color: 1111111
                    }
                })
                break;
            } else if (m.content.toLowerCase() === "help")  {
                sendHelp();
            } else {
                await signerUser.send({
                    embed: {
                        description: `Uh oh, that's not a command I recognize. Type in the number of the person who you want to sign, or type "help" for help.`,
                        color: 1111111
                    }
                })
            }

            if (requestees().length === 0) {

                await signerUser.send({
                    embed: {
                        description: "Session ended! There are no more requested yearbooks to sign.",
                        color: 1111111
                    }
                })
            }
        }


        this.parent.DMSessions.delete(signerUser.id);

    }

    available(guild?: Discord.Guild): boolean {
        return true;
    }

    // helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };
    parent: ProcessorBot;

}
