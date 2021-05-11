import * as Discord from 'discord.js';
import * as Canvas from 'canvas';
import { Command, Module } from './Module';
import { ProcessorBot } from './ProcessorBot';
import { PROCESS } from './ProcessMessage';
import * as Crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';

// @to-do change to ctx.addPage

// @to-do NAME GET

type YearbookUserObj = {
    NAME: string;
    TAG: string;
    DISCRIMINATOR:string;
    FPBG:boolean;
    SIGNATURES: { 
        LINK: string, 
        USERID: string 
    }[];
}

export class YearbookBot implements Module {
    name: string = "Yearbook Bot";
    keys: Map<string, { to: Discord.User, from: Discord.User, callback:() => void }>;
    requestsfor: Map<string, string[]>;
    db: FirebaseFirestore.Firestore;
    client: Discord.Client;
    commands:Command[];
    fpbg: Discord.Guild;
    private readonly perPage = 8;
    private readonly size = 750;
    private FPBGMessageBuffer: Buffer;

    usersCache: Map<string, YearbookUserObj>;

    constructor(db: FirebaseFirestore.Firestore, client: Discord.Client) {
        this.db = db;
        this.keys = new Map();
        this.requestsfor = new Map();
        this.client = client;
        this.usersCache = new Map();
    }

    async onConstruct(): Promise<void> {
        let data = await this.db.collection("Yearbook").get();
        for(const doc of data.docs) {
            this.requestsfor.set(doc.id, []);
            // @ts-ignore
            this.usersCache.set(doc.id, doc.data());
        }

        this.fpbg = await this.client.guilds.fetch('748669830244073533');
        
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
                                description: `${user}, your presence has been requested by ${requested}! Type --sign or /sign to begin signing!`
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
            },
            {
                name: "ManageYearbook",
                description: "See and manage your own signatures.",
                parameters: [],
                available: () => true,
                regularCallback: async (message) => {
                    this.manage(message.author);
                    message.channel.send({
                        embed: {
                            description: `Started!`,
                            color: 111111
                        }
                    })
                },
                slashCallback: async (invoke, channel, user) => {
                    this.manage(user);
                    invoke({
                        embed: {
                            description: `Started!`,
                            color: 111111
                        }
                    })
                }
            }
        ]

        this.FPBGMessageBuffer = await this.imgPathToPDFBuffer('./images/hags.png');
    }

    async userInFPBG(userID:string) {
        try {
            await this.fpbg.members.fetch(userID);
            return true;
        } catch (err) {
            return false;
        }
    }

    async createUser(user: Discord.User) {
        if (this.userExists(user.id)) throw "Attempted to create already existing user!";
        let obj = {
            TAG: user.username,
            DISCRIMINATOR: user.discriminator,
            SIGNATURES: [],
            NAME: user.tag,
            FPBG: await this.userInFPBG(user.id)
        }
        await this.db.collection("Yearbook").doc(user.id).set(obj);
        this.requestsfor.set(user.id, []);
        this.usersCache.set(user.id, obj);
    }

    getSignatures(userID: string) {
        if (!this.userExists(userID)) throw "Attempted to retrieve signatures from non-existent user!";
        return this.usersCache.get(userID).SIGNATURES;
    }

    setSigatures(userID: string, signatures: {LINK: string, USERID: string}[]) {
        if (!this.userExists(userID)) throw "Attempted to set signatures of non-existent user!";
        this.usersCache.get(userID).SIGNATURES = signatures;
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

    async createPage(userID: string, pageID:number, pdf?:boolean) {

        let size = pdf ? this.size : 600;
        let rows = 3;
        let blockwidth = size / rows;
        const canvas = pdf ? Canvas.createCanvas(size, size, 'pdf') : Canvas.createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        if (pdf) {
            ctx.quality = "best";
            ctx.patternQuality = "best";
        }

        let positions: number[][] = [];
        for (let i = 0; i < rows; i++) {
            if (i % 2 === 1) {
                for (let j = 0; j < rows - 1; j++) {
                    positions.push([j * blockwidth + blockwidth / 2, i * blockwidth]);
                }
            } else {
                for (let j = 0; j < rows; j++) {
                    positions.push([j * blockwidth, i * blockwidth]);
                }
            }
        }

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let signatures = this.getSignatures(userID).slice(pageID * this.perPage,pageID * this.perPage + this.perPage);
        for (let i = 0; i < Math.min(positions.length, signatures.length); i++) {
            const img = await Canvas.loadImage(signatures[i].LINK);
            ctx.drawImage(img, positions[i][0], positions[i][1], blockwidth, blockwidth);
        }

        ctx.strokeStyle = "blue";
        for (let p of positions) {
            // ctx.strokeRect(p[0], p[1], blockwidth, blockwidth);
        }

        

        return canvas.toBuffer();
    }

    async imgPathToPDFBuffer(path: string) {
        let size = this.size;

        const canvas = Canvas.createCanvas(size, size, 'pdf');
        const ctx = canvas.getContext('2d');
        ctx.quality = "best";
        ctx.patternQuality = "best";

        const img = await Canvas.loadImage(path);
        ctx.drawImage(img, 0,0, canvas.width, canvas.height);

        

        return canvas.toBuffer();
    }

    async onMessage(message: Discord.Message): Promise<void> {
        // let result = PROCESS(message);
        // if(result) {

        //     if(result.command === "brrr") {


        //         const attachment = new Discord.MessageAttachment(await this.createPage(message.author.id, 0), 'test.png');

        //         message.channel.send(attachment);
        //     }
        // }

        // WEBHOOK
        if (message.channel.id === '839207825535795210') {
            // console.log(message);
            if(message.webhookID) {
                let KEY = message.content;
                if(message.attachments.size > 0 && this.keys.has(KEY)){
                    let url = message.attachments.first().url;
                    const {from, to, callback} = this.keys.get(KEY);
                    this.keys.delete(KEY);

                    // fetch signatures idk
                    let { SIGNATURES } = (await this.db.collection("Yearbook").doc(to.id).get()).data();
                    SIGNATURES.push({
                        LINK: url,
                        USERID: from.id
                    })

                    // update on db
                    await this.db.collection("Yearbook").doc(to.id).update({
                        SIGNATURES
                    })

                    // update cache
                    this.getSignatures(to.id).push({
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
                                    url: this.getSignatures(userBeingSignedID).find((d) => d.USERID === signerUser.id).LINK
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

    async manage(user:Discord.User) {
        if (this.parent.DMSessions.has(user.id)) {
            user.send({
                embed: {
                    description: `The module ${this.parent.DMSessions.get(user.id)} is already using this DM-Channel. Resolve that interaction first by continuining with the process or by sending "end".`,
                    color: 1111111
                }
            })
            return;
        }

        if (!this.userExists(user.id)) {
            await this.createUser(user);
        }

        this.parent.DMSessions.set(user.id, this.name);

        let signatures = () => {
            return this.getSignatures(user.id);
        }

        let pages = () => {
            return Math.ceil( signatures().length / this.perPage );
        }

        let sendHelp = async () => {
            await user.send({
                embed: {
                    title: `Manage Yearbook`,
                    description: `This is to edit or see your own yearbook! If you want to sign someone else's yearbook, type "end", then run /sign in a server (not here).\n` +
                        `To see your yearbook, type "yearbook #", where # is the page of the yearbook you want to see. **You currently have ${pages()} pages.**\n` + 
                        `Alternatively, to view a single signature, type "get #", where # is the signature's index (see Signatures below).\n` +
                        `To manage signatures, refer to the list of commands below.\n` + 
                        `And finally, to export your virtual yearbook as a pdf, simply type "export".`,
                    fields: [
                        {
                            name: `Signatures`,
                            value: `${signatures().length > 0 
                                ? signatures().map(({LINK, USERID}, i) => `${i+1}: <@${USERID}>`).join('\n')
                                : `😔 You don't have any signatures yet!`}`
                        },
                        {
                            name: `Commands`,
                            value: `yearbook # - Gives a yearbook page\n` + 
                                `get # - Gives the requested signature\n` + 
                                `swap # # - Swaps the positions of two signatures\n` +
                                `delete # - Deletes a signature (UNRECOVERABLE)\n` + 
                                `export - Exports your entire virtual yearbook as a pdf\n` + 
                                `help - Resends this message\n` +
                                `end - Ends the session`
                        }
                    ],
                    color: 1111111
                }
            })
        }
        await sendHelp();

        while(true) {
            let a: Discord.Collection<string, Discord.Message>;
            try {
                a = await user.dmChannel.awaitMessages((m: Discord.Message) => {
                    return !m.author.bot;
                }, { max: 1, time: 1000 * 60 * 10, errors: ['time'] });
            } catch (err) {
                await user.send({
                    embed: {
                        description: "The signing session timed out. To restart it, run /sign or --sign in a server.",
                        color: 1111111
                    }
                })
                break;
            }
            
            let m = a.first();

            let args = m.content.split(' ').filter(substr => substr.length);
            let command = args[0];

            // swap complete
            // delete complete
            // get complete
            if(command === "yearbook") {
                if (args.length < 2 || isNaN(parseInt(args[1])) || !(parseInt(args[1]) >= 1 && parseInt(args[1]) <= pages()) ) {
                    await user.send({
                        embed: {
                            description: pages() > 0 
                                ? `Please specify a valid number between 1 and ${pages()}, e.g. "yearbook 1".`
                                : `😔 This command is currently invalid, as you currently do not have any signatures. Request a signature in a server via /requestsignature in a server!`,
                            color: 1111111
                        }
                    })
                } else {
                    let num = parseInt(args[1]) - 1;
                    // SEND YEARBOOK PAGE
                    let buffer = await this.createPage(user.id, num);
                    const attachment = new Discord.MessageAttachment(buffer, `yearbook-${user.id}-${num}.png`);

                    await user.send(`Yearbook Page ${num+1} of ${pages()}`, attachment);
                }
            } else if (command === "get") {
                if (args.length < 2 || isNaN(parseInt(args[1])) || !(parseInt(args[1]) >= 1 && parseInt(args[1]) <= signatures().length)) {
                    await user.send({
                        embed: {
                            description: signatures().length > 0
                                ? `Please specify a valid number between 1 and ${pages()}, e.g. "get 1".`
                                : `😔 This command is currently invalid, as you currently do not have any signatures. Request a signature in a server via /requestsignature in a server!`,
                            color: 1111111
                        }
                    })
                } else {
                    let num = parseInt(args[1]) - 1;
                    await user.send({
                        embed: {
                            description: `${num+1}: Signature from <@${signatures()[num].USERID}>`,
                            color: 1111111,
                            image: {
                                url: signatures()[num].LINK
                            }
                        }
                    })
                }
            } else if (command === "swap") {
                let nums = args.slice(1,3).map(b => parseInt(b));
                if(nums.length < 2 || nums.some(isNaN) || !nums.every(val => val >= 1 && val <= signatures().length)) {
                    await user.send({
                        embed: {
                            description: signatures().length > 0
                                ? `Please specify 2 valid numbers between 1 and ${signatures().length}, e.g. "swap 1 2".`
                                : `😔 This command is currently invalid, as you currently do not have any signatures. Request a signature in a server via /requestsignature in a server!`,
                            color: 1111111
                        }
                    })
                } else {
                    await this.swapSignatures(user.id, nums[0] - 1, nums[1] - 1);
                    await user.send({
                        embed: {
                            description: `Swapped! <:chomp:788142366015881236>`,
                            color: 1111111
                        }
                    })
                    await sendHelp();
                }
                
            } else if (command === "delete") {
                if (args.length < 2 || isNaN(parseInt(args[1])) || !(parseInt(args[1]) >= 1 && parseInt(args[1]) <= signatures().length)) {
                    await user.send({
                        embed: {
                            description: signatures().length > 0
                                ? `Please specify a valid number between 1 and ${pages()}, e.g. "delete 1".`
                                : `😔 This command is currently invalid, as you currently do not have any signatures. Request a signature in a server via /requestsignature in a server!`,
                            color: 1111111
                        }
                    })
                } else {
                    let num = parseInt(args[1]) - 1;

                    await user.send({
                        embed: {
                            description: `Are you sure you want to delete (PERMANANTLY) this signature by <@${signatures()[num].USERID}>? This action is IRREVERSIBLE. Type "yes" if you want to proceed, and type "no" or anything else to cancel.`,
                            color: 1111111,
                            image: {
                                url: signatures()[num].LINK
                            }
                        }
                    })

                    let b: Discord.Collection<string, Discord.Message>;
                    let confirmed = false;
                    try {
                        b = await user.dmChannel.awaitMessages((m: Discord.Message) => {
                            return !m.author.bot;
                        }, { max: 1, time: 1000 * 60 * 3, errors: ['time'] });
                    } catch (err) {
                        await user.send({
                            embed: {
                                description: "The deletion has been cancelled due to timeout.",
                                color: 1111111
                            }
                        })
                    }
                    let confirmationMsg = b.first();
                    if(confirmationMsg.content.toLowerCase() === "yes") {
                        confirmed = true;
                    }

                    if(confirmed) {
                        await this.deleteSignatureByIndex(user.id, num);
                        await user.send({
                            embed: {
                                description: "Deleted! <:chomp:788142366015881236>",
                                color: 1111111
                            }
                        });
                        await sendHelp();
                    } else {
                        await user.send({
                            embed: {
                                description: "Deletion was cancelled!",
                                color: 1111111
                            }
                        })
                    }
                }
            } else if (m.content.toLowerCase() === "export") {
                await user.send({
                    embed: {
                        description: `Exporting sometimes takes a while. Please wait up to around 30 seconds; Peepsbot will be unresponsive meanwhile.`,
                        color: 1111111,
                    }
                });
                let yearbookPagesAsBuffers: Buffer[] = [];
                for(let i = 0; i < pages(); i++) {
                    yearbookPagesAsBuffers.push(await this.createPage(user.id, i, true));
                }

                yearbookPagesAsBuffers.push(this.FPBGMessageBuffer);

                // const PDFDocument = require('pdf-lib').PDFDocument

                var pdfsToMerge = yearbookPagesAsBuffers;

                const mergedPdf = await PDFDocument.create();
                for (const pdfBytes of pdfsToMerge) {
                    const pdf = await PDFDocument.load(pdfBytes);
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => {
                        mergedPdf.addPage(page);
                    });
                }

                function toBuffer(ab: ArrayBuffer) {
                    var buf = Buffer.alloc(ab.byteLength);
                    var view = new Uint8Array(ab);
                    for (var i = 0; i < buf.length; ++i) {
                        buf[i] = view[i];
                    }
                    return buf;
                }

                const newBuffer = toBuffer(await mergedPdf.save()); 
                
                // let origPDFStream = new hummus.PDFRStreamForBuffer(yearbookPagesAsBuffers[0]);
                // let outStream = new memoryStreams.WritableStream();

                // let pdfWriter = hummus.createWriterToModify(origPDFStream, new hummus.PDFStreamForResponse(outStream));

                // for(let i = 1; i < yearbookPagesAsBuffers.length; i++) {
                //     var secondPDFStream = new hummus.PDFRStreamForBuffer(yearbookPagesAsBuffers[i]);
                //     pdfWriter.appendPDFPagesFromPDF(secondPDFStream);
                // }

                // pdfWriter.end();
                // let newBuffer = outStream.toBuffer();

                const attachment = new Discord.MessageAttachment(newBuffer, `yearbook-${user.id}-full.pdf`);
                
                await user.send(attachment);

            } else if (m.content.toLowerCase() === "end") {
                await user.send({
                    embed: {
                        description: "Session ended! To restart it, run /ManageYearbook or --ManageYearbook in a server.",
                        color: 1111111
                    }
                })
                break;
            } else if (m.content.toLowerCase() === "help") {
                sendHelp();
            } else {
                await user.send({
                    embed: {
                        description: `Uh oh, that's not a command I recognize. Type "help" for help if you're confused.`,
                        color: 1111111
                    }
                })
            }

            
        }

        this.parent.DMSessions.delete(user.id);
    }

    available(guild?: Discord.Guild): boolean {
        return true;
    }

    // helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };
    parent: ProcessorBot;

}
