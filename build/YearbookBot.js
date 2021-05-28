"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YearbookBot = void 0;
const Discord = require("discord.js");
const Canvas = require("canvas");
const Crypto = require("crypto");
const AdmZip = require("adm-zip");
const node_fetch_1 = require("node-fetch");
class YearbookBot {
    constructor(db, client) {
        this.name = "Yearbook Bot";
        this.perPage = 8;
        this.size = 750;
        this.db = db;
        this.keys = new Map();
        this.requestsfor = new Map();
        this.client = client;
        this.usersCache = new Map();
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.db.collection("Yearbook").get();
            for (const doc of data.docs) {
                this.requestsfor.set(doc.id, []);
                // @ts-ignore
                this.usersCache.set(doc.id, doc.data());
            }
            this.helpEmbed = {
                title: `Help - Yearbook Bot`,
                description: `This module creates a virtual and scuffed yearbook signing experience! Everything is held together with duck tape and Typescript, and will only work if you READ!\n` +
                    `There are 4 commands you need to know. /createuser signs you up, so others can know you're accepting signatures. ` +
                    `Then, /requestsignature @someone requests someone's signature. After that, they have to run /sign to sign your yearbook. ` +
                    `Finally, /manageyearbook allows you to look at your own yearbook!`,
                fields: []
            };
            this.fpbg = yield this.client.guilds.fetch('748669830244073533');
            this.commands = [
                {
                    name: 'CreateUser',
                    description: 'Creates a user for the Yearbook Signing Bot',
                    available: () => true,
                    parameters: [],
                    regularCallback: (message) => __awaiter(this, void 0, void 0, function* () {
                        if (!this.userExists(message.author.id)) {
                            yield this.createUser(message.author);
                            message.channel.send({
                                embed: {
                                    color: 1111111,
                                    description: `User created! <:chomp:788142366015881236>`
                                }
                            });
                        }
                        else {
                            message.channel.send({
                                embed: {
                                    color: 1111111,
                                    description: `Your account already exists!`
                                }
                            });
                        }
                    }),
                    slashCallback: (invoke, channel, user) => __awaiter(this, void 0, void 0, function* () {
                        if (!this.userExists(user.id)) {
                            yield this.createUser(user);
                            invoke({
                                embed: {
                                    color: 1111111,
                                    description: `User created! <:chomp:788142366015881236>`
                                }
                            });
                        }
                        else {
                            invoke({
                                embed: {
                                    color: 1111111,
                                    description: `Your account already exists!`
                                }
                            });
                        }
                    })
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
                    regularCallback: (message, mention) => __awaiter(this, void 0, void 0, function* () {
                        let user = yield this.parseMention(mention);
                        if (user) {
                            if (!this.userExists(user.id)) {
                                message.channel.send({
                                    embed: {
                                        color: 1111111,
                                        description: `<@!${user.id}> has not signed up yet! They must run --create or /create first, before accepting requests. (Also, /request and /sign implicitly create accounts for the user.)`
                                    }
                                });
                                return;
                            }
                            if (!this.userExists(message.author.id)) {
                                // implicitly create
                                yield this.createUser(message.author);
                            }
                            if (this.requestsfor.get(user.id).includes(message.author.id)) {
                                message.channel.send({
                                    embed: {
                                        color: 1111111,
                                        description: `You've already requested ${user}'s presence!`
                                    }
                                });
                                return;
                            }
                            let c = user.id;
                            if (this.getSignatures(message.author.id).find(({ USERID }) => USERID === c)) {
                                message.channel.send({
                                    embed: {
                                        color: 1111111,
                                        description: `${user} has already signed your yearbook!`
                                    }
                                });
                                return;
                            }
                            this.requestsign(message.author, user);
                            message.channel.send({
                                content: `<@!${user.id}>`,
                                embed: {
                                    color: 1111111,
                                    description: `${user}, your presence has been requested by ${message.author}! Type --sign or /sign to begin signing!`
                                }
                            });
                        }
                        else {
                            message.channel.send({
                                embed: {
                                    color: 1111111,
                                    description: `Invalid mention! The parameter to request-signature must be a Discord ping to a specific person.`
                                }
                            });
                        }
                    }),
                    slashCallback: (invoke, channel, user, mention) => __awaiter(this, void 0, void 0, function* () {
                        let requested = yield this.parseMention(mention);
                        if (requested) {
                            if (!this.userExists(requested.id)) {
                                invoke({
                                    embed: {
                                        color: 1111111,
                                        description: `<@!${requested.id}> has not signed up yet! They must run --create or /create first, before accepting requests. (Also, /request and /sign implicitly create accounts for the user.)`
                                    }
                                });
                                return;
                            }
                            if (!this.userExists(user.id)) {
                                // implicitly create
                                yield this.createUser(user);
                            }
                            if (this.requestsfor.get(requested.id).includes(user.id)) {
                                invoke({
                                    embed: {
                                        color: 1111111,
                                        description: `You've already requested ${requested}'s presence!`
                                    }
                                });
                                return;
                            }
                            let c = requested.id;
                            if (this.getSignatures(user.id).find(({ USERID }) => USERID === c)) {
                                invoke({
                                    embed: {
                                        color: 1111111,
                                        description: `${requested} has already signed your yearbook!`
                                    }
                                });
                                return;
                            }
                            this.requestsign(user, requested);
                            yield invoke({
                                embed: {
                                    color: 1111111,
                                    description: `${requested}, your presence has been requested by ${user}! Type --sign or /sign to begin signing!`
                                }
                            });
                            channel.send(`<@!${requested.id}>`);
                        }
                        else {
                            invoke({
                                embed: {
                                    color: 1111111,
                                    description: `Invalid mention! The parameter to request-signature must be a Discord ping to a specific person.`
                                }
                            });
                        }
                    })
                },
                {
                    name: "Sign",
                    description: "Starts a signing session to sign others' yearbooks.",
                    parameters: [],
                    available: () => true,
                    regularCallback: (message) => __awaiter(this, void 0, void 0, function* () {
                        this.sign(message.author);
                        message.channel.send({
                            embed: {
                                description: `Started!`,
                                color: 111111
                            }
                        });
                    }),
                    slashCallback: (invoke, channel, user) => __awaiter(this, void 0, void 0, function* () {
                        this.sign(user);
                        invoke({
                            embed: {
                                description: `Started!`,
                                color: 111111
                            }
                        });
                    })
                },
                {
                    name: "ManageYearbook",
                    description: "See and manage your own signatures.",
                    parameters: [],
                    available: () => true,
                    regularCallback: (message) => __awaiter(this, void 0, void 0, function* () {
                        this.manage(message.author);
                        message.channel.send({
                            embed: {
                                description: `Started!`,
                                color: 111111
                            }
                        });
                    }),
                    slashCallback: (invoke, channel, user) => __awaiter(this, void 0, void 0, function* () {
                        this.manage(user);
                        invoke({
                            embed: {
                                description: `Started!`,
                                color: 111111
                            }
                        });
                    })
                }
            ];
        });
    }
    userInFPBG(userID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.fpbg.members.fetch(userID);
                return true;
            }
            catch (err) {
                return false;
            }
        });
    }
    createUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.userExists(user.id))
                throw "Attempted to create already existing user!";
            let obj = {
                TAG: user.username,
                DISCRIMINATOR: user.discriminator,
                SIGNATURES: [],
                NAME: user.tag,
                FPBG: yield this.userInFPBG(user.id)
            };
            yield this.db.collection("Yearbook").doc(user.id).set(obj);
            this.requestsfor.set(user.id, []);
            this.usersCache.set(user.id, obj);
        });
    }
    getSignatures(userID) {
        if (!this.userExists(userID))
            throw "Attempted to retrieve signatures from non-existent user!";
        return this.usersCache.get(userID).SIGNATURES;
    }
    setSigatures(userID, signatures) {
        if (!this.userExists(userID))
            throw "Attempted to set signatures of non-existent user!";
        this.usersCache.get(userID).SIGNATURES = signatures;
    }
    deleteSignatureByIndex(userID, index) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setSigatures(userID, this.getSignatures(userID).filter((_, i) => i !== index));
            yield this.pushSignature(userID);
        });
    }
    swapSignatures(userID, index1, index2) {
        return __awaiter(this, void 0, void 0, function* () {
            let signatures = this.getSignatures(userID);
            ;
            [signatures[index1], signatures[index2]] = [signatures[index2], signatures[index1]];
            yield this.pushSignature(userID);
        });
    }
    pushSignature(userID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.collection("Yearbook").doc(userID).update({
                SIGNATURES: this.getSignatures(userID)
            });
        });
    }
    requestsign(requester, requested) {
        if (this.requestsfor.has(requested.id) && !this.requestsfor.get(requested.id).includes(requester.id)) {
            this.requestsfor.set(requested.id, [...this.requestsfor.get(requested.id), requester.id]);
        }
        else {
            console.log("Uh oh!");
        }
    }
    userExists(userID) {
        return this.requestsfor.has(userID);
    }
    generateToken() {
        return Crypto.randomBytes(16).toString('hex');
    }
    generateLink(from, to, token) {
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
    parseMention(mention) {
        return __awaiter(this, void 0, void 0, function* () {
            mention = mention.replace(/ /g, '');
            if (!(mention.length === 22 && mention.startsWith('<@!') && mention.endsWith('>') && [...mention.slice(3, -1)].every(char => '0123456789'.includes(char)))) {
                return false;
            }
            let id = mention.slice(3, -1);
            let user = yield this.client.users.fetch(id);
            if (user) {
                return user;
            }
            else {
                return false;
            }
        });
    }
    createPage(userID, pageID, exportFile) {
        return __awaiter(this, void 0, void 0, function* () {
            let size = exportFile ? 2400 : 600;
            let rows = 3;
            let blockwidth = size / rows;
            const canvas = Canvas.createCanvas(size, size);
            const ctx = canvas.getContext('2d');
            let positions = [];
            for (let i = 0; i < rows; i++) {
                if (i % 2 === 1) {
                    for (let j = 0; j < rows - 1; j++) {
                        positions.push([j * blockwidth + blockwidth / 2, i * blockwidth]);
                    }
                }
                else {
                    for (let j = 0; j < rows; j++) {
                        positions.push([j * blockwidth, i * blockwidth]);
                    }
                }
            }
            ctx.patternQuality = "best";
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            let signatures = this.getSignatures(userID).slice(pageID * this.perPage, pageID * this.perPage + this.perPage);
            for (let i = 0; i < Math.min(positions.length, signatures.length); i++) {
                const img = yield Canvas.loadImage(signatures[i].LINK);
                ctx.drawImage(img, positions[i][0], positions[i][1], blockwidth, blockwidth);
            }
            return canvas.toBuffer('image/png', exportFile ? {
                compressionLevel: 6,
                filters: canvas.PNG_ALL_FILTERS,
                backgroundIndex: 0,
                resolution: 400
            } : {});
        });
    }
    createYearbook(userID) {
        return __awaiter(this, void 0, void 0, function* () {
            let size = this.size;
            let rows = 3;
            let blockwidth = size / rows;
            const canvas = Canvas.createCanvas(size, size, 'pdf');
            const ctx = canvas.getContext('2d');
            // ctx.quality = "best";
            ctx.patternQuality = "best";
            let positions = [];
            for (let i = 0; i < rows; i++) {
                if (i % 2 === 1) {
                    for (let j = 0; j < rows - 1; j++) {
                        positions.push([j * blockwidth + blockwidth / 2, i * blockwidth]);
                    }
                }
                else {
                    for (let j = 0; j < rows; j++) {
                        positions.push([j * blockwidth, i * blockwidth]);
                    }
                }
            }
            let pages = Math.ceil(this.getSignatures(userID).length / this.perPage);
            for (let pageID = 0; pageID < pages; pageID++) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                let signatures = this.getSignatures(userID).slice(pageID * this.perPage, pageID * this.perPage + this.perPage);
                for (let i = 0; i < Math.min(positions.length, signatures.length); i++) {
                    const img = yield Canvas.loadImage(signatures[i].LINK);
                    ctx.drawImage(img, positions[i][0], positions[i][1], blockwidth, blockwidth);
                }
                ctx.addPage();
            }
            // if() {
            // if (true) {
            let img = this.usersCache.get(userID).FPBG ? yield Canvas.loadImage('./images/fpbghags.png') : yield Canvas.loadImage('./images/hags.png');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // }
            return canvas.toBuffer();
        });
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
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
                if (message.webhookID) {
                    let KEY = message.content;
                    if (message.attachments.size > 0 && this.keys.has(KEY)) {
                        let url = message.attachments.first().url;
                        const { from, to, callback } = this.keys.get(KEY);
                        this.keys.delete(KEY);
                        // fetch signatures idk
                        let { SIGNATURES } = (yield this.db.collection("Yearbook").doc(to.id).get()).data();
                        SIGNATURES.push({
                            LINK: url,
                            USERID: from.id
                        });
                        // update on db
                        yield this.db.collection("Yearbook").doc(to.id).update({
                            SIGNATURES
                        });
                        // update cache
                        this.getSignatures(to.id).push({
                            LINK: url,
                            USERID: from.id
                        });
                        callback();
                    }
                }
            }
        });
    }
    sign(signerUser) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.parent.DMSessions.has(signerUser.id)) {
                signerUser.send({
                    embed: {
                        description: `The module ${this.parent.DMSessions.get(signerUser.id)} is already using this DM-Channel. Resolve that interaction first by continuining with the process or by sending "end".`,
                        color: 1111111
                    }
                });
                return;
            }
            if (!this.userExists(signerUser.id)) {
                yield this.createUser(signerUser);
            }
            this.parent.DMSessions.set(signerUser.id, this.name);
            let requestees = () => {
                return this.requestsfor.get(signerUser.id);
            };
            let sendHelp = () => __awaiter(this, void 0, void 0, function* () {
                yield signerUser.send({
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
                });
            });
            if (requestees().length === 0) {
                yield sendHelp();
            }
            while (requestees().length > 0) {
                yield sendHelp();
                let a;
                try {
                    a = yield signerUser.dmChannel.awaitMessages((m) => {
                        return !m.author.bot;
                    }, { max: 1, time: 1000 * 60 * 10, errors: ['time'] });
                }
                catch (err) {
                    yield signerUser.send({
                        embed: {
                            description: "The signing session timed out. To restart it, run /sign or --sign in a server.",
                            color: 1111111
                        }
                    });
                    break;
                }
                let m = a.first();
                if (!isNaN(parseInt(m.content))) {
                    let num = parseInt(m.content) - 1;
                    if (!(num >= 0 && num < requestees().length)) {
                        yield signerUser.send({
                            embed: {
                                description: `Invalid requester number! Please send a number between 1 and ${requestees().length}.`,
                                color: 1111111
                            }
                        });
                    }
                    else {
                        let userBeingSignedID = requestees()[num];
                        // SIGNING HERE
                        let token = this.generateToken();
                        yield signerUser.send({
                            embed: {
                                title: `Signing Yearbook`,
                                description: `Signing <@!${userBeingSignedID}>'s yearbook! \n***Use this link to sign:*** ${this.generateLink(signerUser, yield this.client.users.fetch(userBeingSignedID), token)} \n(I promise its not a virus)\n\n` +
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
                            };
                            // Also resolve if message is end
                            // lmao this code please kill me
                            (() => __awaiter(this, void 0, void 0, function* () {
                                while (!resolved) {
                                    let b;
                                    try {
                                        b = yield signerUser.dmChannel.awaitMessages((m) => {
                                            return !m.author.bot;
                                        }, { max: 1, time: 1000 * 30 * 60, errors: ['time'] }); // * 60 in production
                                    }
                                    catch (err) {
                                        if (!resolved) {
                                            yield signerUser.send({
                                                embed: {
                                                    description: `The signature timed out. To restart it, retype the number or type "help" if you're confused.`,
                                                    color: 1111111
                                                }
                                            });
                                            resolved = true;
                                            res(false);
                                        }
                                    }
                                    if (!resolved) {
                                        if (b.first().content.toLowerCase() === "end") {
                                            yield signerUser.send({
                                                embed: {
                                                    description: `Aborted!`,
                                                    color: 1111111
                                                }
                                            });
                                            resolved = true;
                                            res(false);
                                        }
                                    }
                                }
                            }))();
                        });
                        let resolved = yield returnpromise;
                        if (resolved) {
                            // console.log(this.signatureCache)
                            yield signerUser.send({
                                embed: {
                                    description: `🥳 Successfully Signed Yearbook for <@!${userBeingSignedID}>!`,
                                    color: 1111111,
                                    image: {
                                        url: this.getSignatures(userBeingSignedID).find((d) => d.USERID === signerUser.id).LINK
                                    }
                                }
                            });
                            let userbeingsigned = yield this.client.users.fetch(userBeingSignedID);
                            userbeingsigned.send({
                                embed: {
                                    color: 1111111,
                                    description: `🥳 ${signerUser} signed your yearbook! Run /manageyearbook in a server to view it!`
                                }
                            });
                            this.requestsfor.set(signerUser.id, this.requestsfor.get(signerUser.id).filter(c => c !== userBeingSignedID));
                        }
                    }
                }
                else if (m.content.toLowerCase() === "end") {
                    yield signerUser.send({
                        embed: {
                            description: "Session ended! To restart it, run /sign or --sign in a server.",
                            color: 1111111
                        }
                    });
                    break;
                }
                else if (m.content.toLowerCase() === "help") {
                    sendHelp();
                }
                else {
                    yield signerUser.send({
                        embed: {
                            description: `Uh oh, that's not a command I recognize. Type in the number of the person who you want to sign, or type "help" for help.`,
                            color: 1111111
                        }
                    });
                }
                if (requestees().length === 0) {
                    yield signerUser.send({
                        embed: {
                            description: "Session ended! There are no more requested yearbooks to sign.",
                            color: 1111111
                        }
                    });
                }
            }
            this.parent.DMSessions.delete(signerUser.id);
        });
    }
    manage(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.parent.DMSessions.has(user.id)) {
                user.send({
                    embed: {
                        description: `The module ${this.parent.DMSessions.get(user.id)} is already using this DM-Channel. Resolve that interaction first by continuining with the process or by sending "end".`,
                        color: 1111111
                    }
                });
                return;
            }
            if (!this.userExists(user.id)) {
                yield this.createUser(user);
            }
            this.parent.DMSessions.set(user.id, this.name);
            let signatures = () => {
                return this.getSignatures(user.id);
            };
            let pages = () => {
                return Math.ceil(signatures().length / this.perPage);
            };
            let sendHelp = () => __awaiter(this, void 0, void 0, function* () {
                yield user.send({
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
                                    ? signatures().map(({ LINK, USERID }, i) => `${i + 1}: <@${USERID}>`).join('\n')
                                    : `😔 You don't have any signatures yet!`}`
                            },
                            {
                                name: `Commands`,
                                value: `yearbook # - Gives a yearbook page\n` +
                                    `get # - Gives the requested signature\n` +
                                    `swap # # - Swaps the positions of two signatures\n` +
                                    `delete # - Deletes a signature (UNRECOVERABLE)\n` +
                                    `export - Exports your entire virtual yearbook (as a zip)\n` +
                                    `help - Resends this message\n` +
                                    `end - Ends the session`
                            }
                        ],
                        color: 1111111
                    }
                });
            });
            yield sendHelp();
            while (true) {
                let a;
                try {
                    a = yield user.dmChannel.awaitMessages((m) => {
                        return !m.author.bot;
                    }, { max: 1, time: 1000 * 60 * 10, errors: ['time'] });
                }
                catch (err) {
                    yield user.send({
                        embed: {
                            description: "The signing session timed out. To restart it, run /sign or --sign in a server.",
                            color: 1111111
                        }
                    });
                    break;
                }
                let m = a.first();
                let args = m.content.split(' ').filter(substr => substr.length);
                let command = args[0];
                // swap complete
                // delete complete
                // get complete
                if (command === "yearbook") {
                    if (args.length < 2 || isNaN(parseInt(args[1])) || !(parseInt(args[1]) >= 1 && parseInt(args[1]) <= pages())) {
                        yield user.send({
                            embed: {
                                description: pages() > 0
                                    ? `Please specify a valid number between 1 and ${pages()}, e.g. "yearbook 1".`
                                    : `😔 This command is currently invalid, as you currently do not have any signatures. Request a signature in a server via /requestsignature in a server!`,
                                color: 1111111
                            }
                        });
                    }
                    else {
                        let num = parseInt(args[1]) - 1;
                        // SEND YEARBOOK PAGE
                        let buffer = yield this.createPage(user.id, num);
                        const attachment = new Discord.MessageAttachment(buffer, `yearbook-${user.id}-${num}.png`);
                        yield user.send(`Yearbook Page ${num + 1} of ${pages()}`, attachment);
                    }
                }
                else if (command === "get") {
                    if (args.length < 2 || isNaN(parseInt(args[1])) || !(parseInt(args[1]) >= 1 && parseInt(args[1]) <= signatures().length)) {
                        yield user.send({
                            embed: {
                                description: signatures().length > 0
                                    ? `Please specify a valid number between 1 and ${pages()}, e.g. "get 1".`
                                    : `😔 This command is currently invalid, as you currently do not have any signatures. Request a signature in a server via /requestsignature in a server!`,
                                color: 1111111
                            }
                        });
                    }
                    else {
                        let num = parseInt(args[1]) - 1;
                        yield user.send({
                            embed: {
                                description: `${num + 1}: Signature from <@${signatures()[num].USERID}>`,
                                color: 1111111,
                                image: {
                                    url: signatures()[num].LINK
                                }
                            }
                        });
                    }
                }
                else if (command === "swap") {
                    let nums = args.slice(1, 3).map(b => parseInt(b));
                    if (nums.length < 2 || nums.some(isNaN) || !nums.every(val => val >= 1 && val <= signatures().length)) {
                        yield user.send({
                            embed: {
                                description: signatures().length > 0
                                    ? `Please specify 2 valid numbers between 1 and ${signatures().length}, e.g. "swap 1 2".`
                                    : `😔 This command is currently invalid, as you currently do not have any signatures. Request a signature in a server via /requestsignature in a server!`,
                                color: 1111111
                            }
                        });
                    }
                    else {
                        yield this.swapSignatures(user.id, nums[0] - 1, nums[1] - 1);
                        yield user.send({
                            embed: {
                                description: `Swapped! <:chomp:788142366015881236>`,
                                color: 1111111
                            }
                        });
                        yield sendHelp();
                    }
                }
                else if (command === "delete") {
                    if (args.length < 2 || isNaN(parseInt(args[1])) || !(parseInt(args[1]) >= 1 && parseInt(args[1]) <= signatures().length)) {
                        yield user.send({
                            embed: {
                                description: signatures().length > 0
                                    ? `Please specify a valid number between 1 and ${pages()}, e.g. "delete 1".`
                                    : `😔 This command is currently invalid, as you currently do not have any signatures. Request a signature in a server via /requestsignature in a server!`,
                                color: 1111111
                            }
                        });
                    }
                    else {
                        let num = parseInt(args[1]) - 1;
                        yield user.send({
                            embed: {
                                description: `Are you sure you want to delete (PERMANANTLY) this signature by <@${signatures()[num].USERID}>? This action is IRREVERSIBLE. Type "yes" if you want to proceed, and type "no" or anything else to cancel.`,
                                color: 1111111,
                                image: {
                                    url: signatures()[num].LINK
                                }
                            }
                        });
                        let b;
                        let confirmed = false;
                        try {
                            b = yield user.dmChannel.awaitMessages((m) => {
                                return !m.author.bot;
                            }, { max: 1, time: 1000 * 60 * 3, errors: ['time'] });
                        }
                        catch (err) {
                            yield user.send({
                                embed: {
                                    description: "The deletion has been cancelled due to timeout.",
                                    color: 1111111
                                }
                            });
                        }
                        let confirmationMsg = b.first();
                        if (confirmationMsg.content.toLowerCase() === "yes") {
                            confirmed = true;
                        }
                        if (confirmed) {
                            yield this.deleteSignatureByIndex(user.id, num);
                            yield user.send({
                                embed: {
                                    description: "Deleted! <:chomp:788142366015881236>",
                                    color: 1111111
                                }
                            });
                            yield sendHelp();
                        }
                        else {
                            yield user.send({
                                embed: {
                                    description: "Deletion was cancelled!",
                                    color: 1111111
                                }
                            });
                        }
                    }
                }
                else if (m.content.toLowerCase() === "export") {
                    yield user.send({
                        embed: {
                            description: `Exporting sometimes takes a while. Please wait up to around 30 seconds; Peepsbot will be unresponsive meanwhile.`,
                            color: 1111111,
                        }
                    });
                    let yearbookfull = yield this.createYearbook(user.id);
                    let zip = new AdmZip();
                    zip.addFile(`yearbook-full.pdf`, yearbookfull);
                    let pages = Math.ceil(this.getSignatures(user.id).length / this.perPage);
                    for (let i = 0; i < pages; i++) {
                        zip.addFile(`yearbook-page-${i + 1}.png`, yield this.createPage(user.id, i, true));
                    }
                    let signatures = this.getSignatures(user.id);
                    let addSignature = (i) => __awaiter(this, void 0, void 0, function* () {
                        let res = yield node_fetch_1.default(signatures[i].LINK);
                        let b = yield res.buffer();
                        zip.addFile(`yearbook-signature-${i + 1}.png`, b);
                    });
                    let allpromises = [];
                    for (let i = 0; i < signatures.length; i++) {
                        allpromises.push(addSignature(i));
                    }
                    Promise.all(allpromises);
                    let userinfo = this.usersCache.get(user.id);
                    var signatureInfoContent = `–– Virtual Yearbook Signatures 2020-2021 ––\n\n` +
                        `Property of: ${userinfo.NAME}\n` +
                        `Discord ID: ${user.id}\n\n` +
                        `Signatures are listed per page, from top left and going right then down, like how you read English.\n\n`;
                    for (let i = 0; i < pages; i++) {
                        let signatures = this.getSignatures(user.id).slice(this.perPage * i, this.perPage * (i + 1));
                        signatureInfoContent +=
                            `* Page ${i + 1} of ${pages} *\n` +
                                `${signatures.map((val, localindex) => {
                                    let name = this.usersCache.get(val.USERID).NAME;
                                    let actualIndex = localindex + this.perPage * i;
                                    return `Signature ${actualIndex + 1}: from ${name}\n`;
                                }).join('\n\n')}` +
                                `\n\n`;
                    }
                    if (userinfo.FPBG) {
                        signatureInfoContent +=
                            `Hi. Hey. Hello.\n` +
                                `We’re the FPBG, and we’d like to thank you for choosing to partake in our Glorious Server with us during this historic school year. From what started as a 4 person joke grew into a 100 person server… of which only about four people use (Five? Six? None of us really know how to count). It’s been weird and wonderful but mostly weird to see the FPBG’s tendrils of influence silently wrap around every aspect of the world, but of course, none of it would have been possible without the contribution of people like you. So thanks. And have a great summer.\n\n` +
                                `Mors, census, vec et TRG.\n` +
                                `The FPBG`;
                    }
                    else {
                        signatureInfoContent +=
                            `Have a fantastic summer!`;
                    }
                    // console.log(signatureInfoContent);
                    zip.addFile("yearbook-info.txt", Buffer.from(signatureInfoContent, 'utf-8'));
                    let zipbuffer = zip.toBuffer();
                    const attachment = new Discord.MessageAttachment(zipbuffer, `yearbook.zip`);
                    yield user.send(attachment);
                }
                else if (m.content.toLowerCase() === "end") {
                    yield user.send({
                        embed: {
                            description: "Session ended! To restart it, run /ManageYearbook or --ManageYearbook in a server.",
                            color: 1111111
                        }
                    });
                    break;
                }
                else if (m.content.toLowerCase() === "help") {
                    sendHelp();
                }
                else {
                    yield user.send({
                        embed: {
                            description: `Uh oh, that's not a command I recognize. Type "help" for help if you're confused.`,
                            color: 1111111
                        }
                    });
                }
            }
            this.parent.DMSessions.delete(user.id);
        });
    }
    available(guild) {
        return true;
    }
}
exports.YearbookBot = YearbookBot;
