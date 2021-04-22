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
const SheetsUser_1 = require("./SheetsUser");
const Utilities_1 = require("./Utilities");
const ProcessMessage_1 = require("./ProcessMessage");
const fs = require("fs");
class QuotesBot {
    constructor(auth, client) {
        this.collectingChannels = ["754912483390652426", "756698378116530266", "811357805444857866", "811418821205819393"];
        // private readonly littleservers = ["748669830244073533", "568220839590494209", "750066407093436509"];
        this.prefix = "--";
        let currmap = new Map();
        currmap.set("quotes", "1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM");
        this.sheetsUser = new SheetsUser_1.SheetsUser(auth, currmap);
        this.client = client;
        this.cache = new Map();
        this.client.on("messageReactionAdd", (reaction, user) => { this.onReaction(reaction, user); });
        this.client.on("messageReactionRemove", (reaction, user) => { this.onReaction(reaction, user); });
        this.helpEmbed = {
            title: `Help - Quotes Bot`,
            description: `A bot for keeping teacher quotes, often horribly out of context.`,
            fields: [
                {
                    name: `${this.prefix}[teacher name]`,
                    value: `Spews out a random quote from that teacher.`
                },
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
                    teacher = teacher.charAt(0).toUpperCase() + teacher.slice(1).toLowerCase();
                    if (this.availableTeachers(channel.guild).includes(teacher)) {
                        let q = this.randomQuote(teacher);
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
                    teacher = teacher.charAt(0).toUpperCase() + teacher.slice(1).toLowerCase();
                    if (this.availableTeachers(message.guild).includes(teacher)) {
                        let q = this.randomQuote(teacher);
                        if (q.length > 400) {
                            q = q.slice(0, 400) + "... [quote truncated]";
                        }
                        if (m) {
                            message.channel.send(`Q: ${m}\n${teacher}: ${q}`, { allowedMentions: { parse: [] } });
                        }
                        else {
                            message.channel.send(`${teacher}: ${q}`, { allowedMentions: { parse: [] } });
                        }
                        // message.channel.send(q, {allowedMentions: {parse: []}})
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
            this.teacherCommand("Little"),
            this.teacherCommand("Kinyanjui"),
        ];
        // console.log(this.processContent(`"Grrr" - Lemon Think`))
        // console.log(this.processContent(`"Grrr" - Mr.Little`))
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
                let q = this.randomQuote(teacher);
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
    available(message) {
        return true;
    }
    availableTeachers(guild) {
        if (guild.id === "748669830244073533") {
            return [...this.cache.keys()];
        }
        else {
            return ["Little"];
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
                    message.channel.send({
                        embed: {
                            description: "Invalid teacher! Please refrain from using numbers or special characters.",
                            color: 1111111
                        }
                    });
                }
            }
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                let teach = result.command[0].toUpperCase() + result.command.slice(1).toLowerCase();
                if (this.cache.has(teach)) {
                    if ((teach === "Little") !== (message.guild.id === '748669830244073533')) {
                        let q = this.randomQuote(teach);
                        message.channel.send(q.length < 400 ? q : q.slice(0, 400) + '... [quote truncated]', { allowedMentions: { parse: [] } });
                    }
                }
                if (result.command === "quotescache" && result.args.length === 1) {
                    const a = Utilities_1.Utilities.capitilize(result.args[0]);
                    if (this.cache.has(a)) {
                        let str = this.cache.get(a).map(a => a.map(b => b.slice(0, 100)).join(' - ')).join('\n');
                        message.channel.send({
                            embed: Object.assign({ title: `Quotes Cache for ${a}`, description: `${str.length < 1000 ? str : str.slice(0, 1000) + '... [truncated]'}` }, Utilities_1.Utilities.embedInfo(message))
                        });
                    }
                }
                if (["quotes", "quotesheet", "quotessheet"].includes(result.command) && message.guild.id === '748669830244073533') {
                    message.channel.send({
                        embed: {
                            description: `[Link to the quotes.](https://docs.google.com/spreadsheets/d/1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM/edit#gid=1331218902)`,
                            color: 1111111
                        }
                    });
                }
            }
        });
    }
    addQuote(quote, teacher, stars) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log({quote,teacher,stars})
            if (this.cache.has(teacher)) {
                yield this.sheetsUser.addWithoutDuplicates("quotes", teacher, [quote, stars], [true, "CHANGE"]);
                this.cache.set(teacher, yield this.sheetsUser.readSheet("quotes", teacher));
            }
            else {
                yield this.sheetsUser.createSubsheet("quotes", teacher, {
                    columnResize: [800, 100],
                    headers: ["Quote", "Number"]
                });
                yield this.sheetsUser.addWithoutDuplicates("quotes", teacher, [quote, stars], [true, "CHANGE"]);
                this.cache.set(teacher, yield this.sheetsUser.readSheet("quotes", teacher));
            }
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sheetsUser.onConstruct();
            fs.writeFileSync("./temp/test.txt", (yield this.sheetsUser.getSubsheets("quotes")).join("\n"));
            let valueranges = yield this.sheetsUser.bulkRead("quotes");
            for (const valuerange of valueranges) {
                let range = valuerange.range;
                if (range) {
                    let cat = range.slice(0, range.lastIndexOf('!')).replace(/['"]/g, '');
                    this.cache.set(cat, valuerange.values);
                }
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
        let teacher = "Little";
        if (content.includes("-")) {
            teacher = content.slice(content.lastIndexOf('-') + 1);
            let things = teacher.split(/[ \.]/g, -1);
            teacher = things[things.length - 1];
            content = content.slice(0, content.lastIndexOf("-"));
        }
        teacher = teacher[0].toUpperCase() + teacher.slice(1).toLowerCase();
        if (content.includes(`"`) && content.indexOf(`"`) !== content.lastIndexOf(`"`)) {
            content = content.slice(content.indexOf(`"`) + 1, content.lastIndexOf(`"`));
        }
        return {
            teacher,
            content
        };
    }
    validTeacher(teacher) {
        return ([...teacher].every(c => ` abcdefghijklmnopqrstuvwxyz`.includes(c))) && teacher.length > 0 && teacher.length < 20;
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
                    this.addQuote(content, teacher, reaction.count - 1);
                }
            }
        });
    }
    randomQuote(teacher) {
        let total = 0;
        let cache = this.cache.get(teacher);
        for (let i = 1; i < cache.length; i++) {
            total += parseInt(cache[i][1]);
        }
        let rand = Math.random() * total;
        for (let i = 1; i < cache.length; i++) {
            rand -= parseInt(cache[i][1]);
            if (rand < 0) {
                return cache[i][0];
            }
        }
        return "Uh oh, something went wrong.";
    }
}
exports.QuotesBot = QuotesBot;
