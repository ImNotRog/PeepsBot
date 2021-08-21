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
exports.QuotesBot = void 0;
const Utilities_1 = require("./Utilities");
const ProcessMessage_1 = require("./ProcessMessage");
const crypto = require("crypto");
class QuotesBot {
    constructor(auth, client, db) {
        this.name = "Quotes Bot";
        this.collectingChannels = ["754912483390652426", "756698378116530266", "811357805444857866", "811418821205819393"];
        this.prefix = "--";
        this.client = client;
        this.db = db;
        this.cache = new Map();
        this.client.on("messageReactionAdd", (reaction, user) => { this.onReaction(reaction, user); });
        this.client.on("messageReactionRemove", (reaction, user) => { this.onReaction(reaction, user); });
        this.helpEmbed = {
            title: `Help - Quotes Bot`,
            description: `A bot for keeping teacher quotes, often horribly out of context.`,
            fields: [
                {
                    name: `How to Add Quotes`,
                    value: `In a designated channel specifically on select servers, you can enter a quote of the format: \n` +
                        `"[Quote Content]" - [Teacher Last Name Only, no Shenanigans]\n` +
                        `Then, react to quotations with 👍 to add them. (The more 👍s a quote has, the higher probability it's chosen.)`
                }
            ]
        };
        this.commands = [
            {
                name: "Quote",
                description: "Returns a random quote from a teacher",
                parameters: [
                    {
                        name: "Teacher",
                        description: "The teacher to obtain a quote from",
                        type: "string",
                        required: true
                    },
                    {
                        name: "Message",
                        description: "A question to ask or a message to send",
                        type: "string",
                        required: false
                    }
                ],
                available: () => true,
                slashCallback: (invoke, channel, user, teacher, message) => {
                    teacher = teacher.toLowerCase();
                    if (this.availableTeachers(channel.guild).includes(teacher)) {
                        let q = this.randomQuote(teacher).content;
                        if (q.length > 400) {
                            q = q.slice(0, 400) + "... [quote truncated]";
                        }
                        if (message) {
                            invoke(`Q: ${message}\n${teacher}: ${q}`);
                        }
                        else {
                            invoke(`${teacher}: ${q}`);
                        }
                    }
                    else {
                        invoke({
                            embed: {
                                description: `Teacher ${teacher} not available. In the future, there will be functionality for each server to have their own quotes. However, for now, quotes access is restricted. Run /availablequotes to see available quotes.`,
                                color: 1111111
                            }
                        });
                    }
                },
                regularCallback: (message, teacher, m) => {
                    teacher = teacher.toLowerCase();
                    if (this.availableTeachers(message.guild).includes(teacher)) {
                        let q = this.randomQuote(teacher).content;
                        if (q.length > 400) {
                            q = q.slice(0, 400) + "... [quote truncated]";
                        }
                        if (m) {
                            message.channel.send(`Q: ${m}\n${teacher}: ${q}`, { allowedMentions: { parse: [] } });
                        }
                        else {
                            message.channel.send(`${teacher}: ${q}`, { allowedMentions: { parse: [] } });
                        }
                    }
                    else {
                        message.channel.send({
                            embed: {
                                description: `Teacher ${teacher} not available. In the future, there will be functionality for each server to have their own quotes. However, for now, quotes access is restricted. Run /availablequotes to see available quotes.`,
                                color: 1111111
                            }
                        });
                    }
                }
            },
            {
                name: "AvailableQuotes",
                description: "Gives the available quotes.",
                parameters: [],
                available: () => true,
                slashCallback: (invoke, channel) => {
                    invoke({
                        embed: {
                            description: `Here are the available people to obtain quotes from:  ${this.availableTeachers(channel.guild).join(", ")}. In the future, every server will be able to contribute and store their own quotes, but for now, peepsbot code is broken and functionality is limited.`,
                            color: 1111111
                        }
                    });
                },
                regularCallback: (message) => {
                    message.channel.send({
                        embed: {
                            description: `Here are the available people to obtain quotes from: ${this.availableTeachers(message.guild).join(", ")}. In the future, every server will be able to contribute and store their own quotes, but for now, peepsbot code is broken and functionality is limited.`,
                            color: 1111111
                        }
                    });
                }
            },
            // this.teacherCommand("Little"),
            // this.teacherCommand("Kinyanjui"),
        ];
    }
    teacherCommand(teacher, available) {
        return {
            name: teacher,
            description: `Returns a random ${teacher} quote.`,
            parameters: [
                {
                    name: "Message",
                    description: "A question to ask or a message to send",
                    type: "string",
                    required: false
                }
            ],
            available: available ? available : (guild) => guild.id === "748669830244073533",
            callback: (message) => {
                let q = this.randomQuote(teacher).content;
                if (q.length > 400) {
                    q = q.slice(0, 400) + "... [quote truncated]";
                }
                if (message) {
                    return `Q: ${message}\nA: ${q}`;
                }
                else {
                    return q;
                }
            }
        };
    }
    available(guild) {
        return true;
    }
    availableTeachers(guild) {
        if (guild.id === "748669830244073533") {
            return [...this.cache.keys()];
        }
        else {
            return ["little"];
        }
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.collectingChannels.indexOf(message.channel.id) !== -1 && !message.author.bot) {
                // Verify quote
                let { teacher } = this.processContent(message.content);
                if (this.validTeacher(teacher)) {
                    message.react('👍');
                }
                else {
                    message.react('827975615986532403');
                }
            }
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                const teach = result.command[0].toLowerCase();
                if (this.cache.has(teach)) {
                    if ((teach === "Little") !== (message.guild.id === '748669830244073533')) {
                        const q = this.randomQuote(teach).content;
                        message.channel.send(q.length < 400 ? q : q.slice(0, 400) + '... [quote truncated]', { allowedMentions: { parse: [] } });
                    }
                }
                if (result.command === "quotescache" && result.args.length === 1) {
                    const a = result.args[0].toLowerCase();
                    if (this.cache.has(a)) {
                        let str = this.cache.get(a).map(quote => quote.link === "UNAVAILABLE" ?
                            `${quote.content.slice(0, 100)} - ${quote.stars}` :
                            `[${quote.content.slice(0, 100)}](${quote.link}) - ${quote.stars}`)
                            .join('\n');
                        message.channel.send({
                            embed: Object.assign({ title: `Quotes Cache for ${a}`, description: `${str.length < 1000 ? str : str.slice(0, 1000) + '... [truncated]'}` }, Utilities_1.Utilities.embedInfo(message))
                        });
                    }
                }
            }
        });
    }
    addQuote(quote, teacher, stars, message) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // console.log({quote,teacher,stars})
            if (this.cache.has(teacher)) {
                // match quote
                const qs = this.cache.get(teacher);
                const match = (_a = qs.find(({ link }) => link === message.url)) !== null && _a !== void 0 ? _a : qs.find(({ content }) => content === quote);
                if (match) {
                    match.stars = stars;
                    const qobj = Object.assign({}, match);
                    delete qobj.id;
                    yield this.db.collection('Quotes').doc(teacher).update({
                        [match.id]: Object.assign({}, qobj)
                    });
                }
                else {
                    const id = (crypto.randomBytes(24).toString('hex'));
                    const qobj = {
                        content: quote,
                        link: message.url,
                        stars,
                        submittee: message.author.id,
                        timestamp: message.createdTimestamp
                    };
                    this.cache.get(teacher).push(Object.assign(Object.assign({}, qobj), { id }));
                    yield this.db.collection('Quotes').doc(teacher).update({
                        [id]: qobj
                    });
                }
            }
            else {
                const id = (crypto.randomBytes(24).toString('hex'));
                const qobj = {
                    content: quote,
                    link: message.url,
                    stars,
                    submittee: message.author.id,
                    timestamp: message.createdTimestamp
                };
                this.cache.set(teacher, [Object.assign(Object.assign({}, qobj), { id })]);
                yield this.db.collection('Quotes').doc(teacher).set({
                    [id]: qobj
                });
            }
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            const qcol = this.db.collection('Quotes');
            const data = (yield qcol.get()).docs;
            for (const doc of data) {
                const category = doc.id;
                const obj = doc.data();
                let arr = [];
                for (const id in obj) {
                    const datum = obj[id];
                    arr.push(Object.assign(Object.assign({}, datum), { id }));
                }
                this.cache.set(category, arr);
            }
            for (const id of this.collectingChannels) {
                let channel = yield this.client.channels.fetch(id);
                // @ts-ignore
                const test = yield channel.messages.fetch({
                    limit: 90
                });
            }
        });
    }
    processContent(content) {
        let teacher = null;
        if (content.includes("-")) {
            teacher = content.slice(content.lastIndexOf('-') + 1);
            let things = teacher.split(/[ \.]/g).filter(a => a.length);
            teacher = things.join(' ');
            content = content.slice(0, content.lastIndexOf("-"));
        }
        else {
            return { teacher: null, content: null };
        }
        teacher = teacher.toLowerCase();
        if (content.includes(`"`) && content.indexOf(`"`) !== content.lastIndexOf(`"`)) {
            content = content.slice(content.indexOf(`"`) + 1, content.lastIndexOf(`"`));
        }
        return {
            teacher,
            content
        };
    }
    validTeacher(teacher) {
        return teacher && ([...teacher].every(c => `abcdefghijklmnopqrstuvwxyz`.includes(c.toLowerCase()))) && teacher.length > 0 && teacher.length < 20;
    }
    onReaction(reaction, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.collectingChannels.indexOf(reaction.message.channel.id) === -1)
                return;
            try {
                yield reaction.fetch();
            }
            catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                return;
            }
            if (reaction.emoji.name === "👍") {
                let { content, teacher } = this.processContent(reaction.message.content);
                if (this.validTeacher(teacher)) {
                    // console.log(`${content} -- ${teacher} has ${reaction.count} stars.`);
                    this.addQuote(content, teacher, reaction.count - 1, reaction.message);
                }
            }
        });
    }
    randomQuote(teacher) {
        let total = 0;
        let cache = this.cache.get(teacher);
        for (const quote of cache) {
            total += Math.max(quote.stars, 0);
        }
        let rand = Math.random() * total;
        for (const quote of cache) {
            rand -= Math.max(quote.stars, 0);
            if (rand <= 0) {
                return quote;
            }
        }
        throw "Uh oh, something went wrong.";
    }
}
exports.QuotesBot = QuotesBot;
