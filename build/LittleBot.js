var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { SheetsUser } = require("./SheetsUser");
const { Utilities } = require("./Utilities");
/**
 * @todo Actually add a functional cache, instead of fetching every time it saves, b/c that is cringe
 */
const Discord = require("discord.js");
class LittleBot {
    /**
     * @constructor
     * @param {google.auth.OAuth2} auth
     * @param {Discord.Client} client
     */
    constructor(auth, client) {
        let currmap = new Map();
        currmap.set("quotes", "1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM");
        this.sheetsUser = new SheetsUser(auth, currmap);
        this.client = client;
        this.cache = [];
        this.utils = new Utilities();
        this.collectingChannels = ["754912483390652426", "756698378116530266"];
        this.client.on("messageReactionAdd", (reaction, user) => { this.onReaction(reaction, user); });
        this.client.on("messageReactionRemove", (reaction, user) => { this.onReaction(reaction, user); });
        this.prefix = "--";
        this.helpEmbed = {
            title: `Help - Little Quotes Bot`,
            description: [
                `Little Bot keeps track of all sorts of quotes from Mr.Little.`,
                `Want advice? Mr.Little's got you covered.`
            ].join(` `),
            fields: [
                {
                    name: `${this.prefix}little`,
                    value: `Provides an entirely random little quote. It's often surprisingly accurate.`
                },
                {
                    name: `${this.prefix}littler [a sentence]`,
                    value: `Provides a not entirely random little quote, based off of word similarities.`
                },
                {
                    name: `${this.prefix}spreadsheets`,
                    value: `Provides the Google spreadsheet where the Little Quotes live.`
                },
            ]
        };
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Setting up Little Bot.`);
            console.log(`Setting up sheets`);
            yield this.sheetsUser.SetUpSheets();
            this.cache = yield this.fetchLittleQuotes();
            console.log(`Fetching messages from Discord channels`);
            for (const id of this.collectingChannels) {
                let channel = yield this.client.channels.fetch(id);
                /**
                 * @type {Map<string, Discord.Message>}
                 */
                const test = yield channel.messages.fetch({
                    limit: 90
                });
                // Testing why it didn't work
                // for(const key of test.keys()) {
                //     const msg = test.get(key);
                //     if (msg.reactions.cache.has('👍')) {
                //         console.log(`${msg.content} has ${msg.reactions.cache.get('👍').count} thumbs.`)
                //     }
                // }
            }
            console.log(`Little Bot Construction Complete!`);
        });
    }
    stripQuotes(txt) {
        if (txt.startsWith('"')) {
            txt = txt.slice(1, txt.length - 1);
        }
        return txt;
    }
    similarities(txt1, txt2) {
        txt1 = txt1.replace(/[\.?!',"]/g, "");
        txt2 = txt2.replace(/[\.?!',"]/g, "");
        let words1 = txt1.toLowerCase().split(" ");
        let words2 = txt2.toLowerCase().split(" ");
        let similarities = 0;
        for (const word of words1) {
            if (words2.indexOf(word) !== -1)
                similarities++;
        }
        return similarities;
    }
    fetchLittleQuotes() {
        return __awaiter(this, void 0, void 0, function* () {
            let rows = (yield this.sheetsUser.readSheet("quotes", "Quotes")).slice(1);
            for (const row of rows) {
                row[0] = this.stripQuotes(row[0]);
            }
            return rows;
        });
    }
    readLittleQuotes() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache;
        });
    }
    addLittleQuote(quote, stars) {
        return __awaiter(this, void 0, void 0, function* () {
            quote = this.stripQuotes(quote);
            yield this.sheetsUser.addWithoutDuplicates("quotes", "Quotes", [quote, stars], [true, "CHANGE"]);
            this.cache = yield this.fetchLittleQuotes();
        });
    }
    randomLittleQuote() {
        return __awaiter(this, void 0, void 0, function* () {
            let quotes = yield this.readLittleQuotes();
            let total = 0;
            for (const row of quotes) {
                total += parseInt(row[1]);
            }
            let randomnum = Math.random() * total;
            for (const row of quotes) {
                randomnum -= parseInt(row[1]);
                if (randomnum <= 0) {
                    let quote = this.stripQuotes(row[0]);
                    console.log(`My wisdom was summoned, and I responded with ${quote}.`);
                    return quote;
                }
            }
        });
    }
    notRandomLittleQuote(messagecontent) {
        return __awaiter(this, void 0, void 0, function* () {
            let quotes = yield this.readLittleQuotes();
            let max = -1;
            let maxmsg = "";
            for (let i = 0; i < quotes.length; i++) {
                const row = quotes[i];
                if (this.similarities(row[0], messagecontent) > max) {
                    max = this.similarities(row[0], messagecontent);
                    maxmsg = row[0];
                }
            }
            return max > 0 ? maxmsg : "Sorry, I'm not sure what to think about that.";
        });
    }
    /**
     *
     * @param {Discord.Message} message
     */
    sendSpreadsheets(message) {
        return __awaiter(this, void 0, void 0, function* () {
            message.channel.send({
                embed: Object.assign({ "title": "– Spreadsheets –", "description": "A list of PeepsBot's spreadsheets.", "fields": [
                        {
                            "name": "Little Quotes",
                            "value": "All of our Little Quotes can be found here: [Link](https://docs.google.com/spreadsheets/d/1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM/edit#gid=0,)"
                        },
                    ] }, this.utils.embedInfo(message))
            });
        });
    }
    /**
     *
     * @param {Discord.MessageReaction} reaction
     * @param {*} user
     */
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
                console.log(`${reaction.message.content} has ${reaction.count}`);
                this.addLittleQuote(reaction.message.content, reaction.count);
            }
        });
    }
}
module.exports = { LittleBot };
