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
exports.SynonymBot = void 0;
const nodefetch = require("node-fetch");
const Discord = require("discord.js");
const cron = require("node-cron");
const famous = require("./data/famous-people.json");
const ProcessMessage_1 = require("./ProcessMessage");
class SynonymBot {
    constructor(MW, client) {
        this.prefix = '--';
        this.apikey = MW;
        this.cache = new Map();
        this.client = client;
        this.goodmorningchannels = ["748669830244073536"];
        this.famouspeople = famous;
        this.helpEmbed = {
            title: `Help - Synonym Bot`,
            description: `Sends synonyms of specific sentences.`,
            fields: [
                {
                    name: `${this.prefix}bread`,
                    value: `Sends a synonym version of "Good morning epic gamers let's get the bread".`
                },
                {
                    name: `${this.prefix}wfbo`,
                    value: `Sends a synonym version of "Weird flex but ok".`
                },
                {
                    name: `Why Don't You Add More?`,
                    value: `API limits.`
                },
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
                if (result.command === "wfbo") {
                    message.channel.send(yield this.wfbo());
                }
                if (result.command === "bread") {
                    message.channel.send(yield this.goodmorning());
                }
            }
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.goodmorning();
            yield this.wfbo();
            cron.schedule("0 7 * * *", () => {
                this.goodmorningall();
            }, {
                timezone: `America/Los_Angeles`
            });
        });
    }
    goodmorningall() {
        return __awaiter(this, void 0, void 0, function* () {
            let quotes = [];
            for (let i = 0; i < 8; i++)
                quotes.push({
                    name: `"${yield this.goodmorning()}"`,
                    value: `- ${yield this.choose(this.famouspeople)}`
                });
            for (const id of this.goodmorningchannels) {
                let channel = yield this.client.channels.fetch(id);
                if (channel instanceof Discord.TextChannel)
                    channel.send({
                        embed: {
                            title: `Let's Get the Bread`,
                            description: `Another morn, another 8 inspirational quotes from famous historical individuals.`,
                            color: 111111,
                            fields: quotes
                        }
                    });
            }
        });
    }
    getData(word) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cache.has(word)) {
                return this.cache.get(word);
            }
            let responsiblechars = "abcdefghijklmnopqrstuvwxyz";
            word = word.toLowerCase();
            if (word.startsWith("[")) {
                return word.slice(1, word.length - 1);
            }
            for (const char of word) {
                if (!responsiblechars.includes(char)) {
                    return word;
                }
            }
            let response = yield nodefetch.default(`https://www.dictionaryapi.com/api/v3/references/thesaurus/json/${word}?key=${this.apikey}`);
            let data = yield response.json();
            this.cache.set(word, data);
            return data;
        });
    }
    getSynonyms(word) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.getData(word);
            if (typeof data === "string") {
                return data;
            }
            if (typeof data[0] === "string") {
                return word;
            }
            return data.map(def => def.meta.syns.flat());
        });
    }
    choose(arr) {
        return arr[Math.floor(arr.length * Math.random())];
    }
    synonymizeSentence(sentence) {
        return __awaiter(this, void 0, void 0, function* () {
            let words = sentence.split(" ");
            let newwords = [];
            for (const word of words) {
                let syns = yield this.getSynonyms(word);
                if (typeof syns === "string") {
                    newwords.push(syns);
                }
                else {
                    newwords.push(this.choose(syns[0]));
                }
            }
            return newwords.join(" ");
        });
    }
    cap(str) {
        return str[0].toUpperCase() + str.slice(1);
    }
    wfbo() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cap(yield this.synonymizeSentence("weird boast but ok"));
        });
    }
    goodmorning() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cap(yield this.synonymizeSentence("good morning epic people let's get [the] bread"));
        });
    }
}
exports.SynonymBot = SynonymBot;
