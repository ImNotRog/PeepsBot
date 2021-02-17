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
exports.LittleBot = void 0;
const SheetsUser_1 = require("./SheetsUser");
const ProcessMessage_1 = require("./ProcessMessage");
class LittleBot {
    constructor(auth, client) {
        this.collectingChannels = ["754912483390652426", "756698378116530266", "811357805444857866", "811418821205819393"];
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
    }
    available(message) {
        return true;
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                let teach = result.command[0].toUpperCase() + result.command.slice(1).toLowerCase();
                if (this.cache.has(teach)) {
                    message.channel.send(this.randomQuote(teach), { allowedMentions: { parse: [] } });
                }
            }
        });
    }
    addQuote(quote, teacher, stars) {
        return __awaiter(this, void 0, void 0, function* () {
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
            let subsheets = (yield this.sheetsUser.getSubsheets("quotes"));
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
                let content = reaction.message.content;
                let teacher = "Little";
                if (content.includes("-")) {
                    let nowhitespace = content.replace(/ /g, '');
                    teacher = nowhitespace.slice(nowhitespace.lastIndexOf('-') + 1);
                    content = content.slice(0, content.lastIndexOf("-"));
                }
                teacher = teacher[0].toUpperCase() + teacher.slice(1).toLowerCase();
                if (content.includes(`"`) && content.indexOf(`"`) !== content.lastIndexOf(`"`)) {
                    content = content.slice(content.indexOf(`"`) + 1, content.lastIndexOf(`"`));
                }
                console.log(`${content} -- ${teacher} has ${reaction.count} stars.`);
                this.addQuote(content, teacher, reaction.count);
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
exports.LittleBot = LittleBot;
