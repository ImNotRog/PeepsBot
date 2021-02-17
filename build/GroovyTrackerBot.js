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
exports.TrackerBot = void 0;
const SheetsUser_1 = require("./SheetsUser");
const Utilities_1 = require("./Utilities");
const ProcessMessage_1 = require("./ProcessMessage");
class TrackerBot {
    constructor(auth) {
        this.prefix = "--";
        this.approvedMusicServers = ["748669830244073533"];
        let currmap = new Map();
        currmap.set("music", "17YiJDj9-IRnP_sPg3HJYocdaDkkFgMKfNC6IBDLSLqU");
        this.sheetsUser = new SheetsUser_1.SheetsUser(auth, currmap);
        this.musicBots = ["234395307759108106"];
        this.helpEmbed = {
            title: `Help - Groovy Tracker Bot`,
            description: [
                `Keeps track of all the Groovy songs we've ever played on the FPERBIO server exclusively.`,
                `Why? Unsure, just because I feel like it.`
            ].join(` `),
            fields: [
                {
                    name: `${this.prefix}groovy`,
                    value: `Provides the Google spreadsheet where the data is stored.`
                },
            ]
        };
    }
    available(message) {
        return message.guild.id === '748669830244073533';
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                if (result.command === "groovy" && this.approvedMusicServers.indexOf(message.guild.id) !== -1) {
                    this.sendSpreadsheets(message);
                }
            }
            if (message.author.bot && this.approvedMusicServers.indexOf(message.guild.id) !== -1) {
                this.process(message);
            }
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Groovy Tracker Bot constructing...`);
            yield this.sheetsUser.onConstruct();
            console.log(`Groovy Tracker Bot complete.`);
        });
    }
    readList() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sheetsUser.readSheet("music", "Groovy");
        });
    }
    addGroovyEntry(title, link) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sheetsUser.addWithoutDuplicates("music", "Groovy", [title, link, 1, Utilities_1.Utilities.getTodayStr()], [true, true, (x) => parseInt(x) + 1, "CHANGE"]);
        });
    }
    processPlayMessage(txt) {
        return __awaiter(this, void 0, void 0, function* () {
            if (txt && txt.startsWith("[")) {
                let endtitle = txt.indexOf("](");
                let title = txt.slice(1, endtitle);
                let startlink = endtitle + 2;
                let endlink = txt.indexOf(") [<@");
                let link = txt.slice(startlink, endlink);
                yield this.addGroovyEntry(title, link);
            }
        });
    }
    process(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.embeds[0] && this.musicBots.indexOf(message.author.id) !== -1) {
                let prevmsg = yield message.channel.messages.fetch({
                    limit: 2
                });
                let keys = prevmsg.keys();
                keys.next();
                let prevmsgkey = keys.next().value;
                let content = prevmsg.get(prevmsgkey).content;
                if (!content.startsWith("-np")) {
                    (this.processPlayMessage(message.embeds[0].description));
                }
            }
        });
    }
    sendSpreadsheets(message) {
        return __awaiter(this, void 0, void 0, function* () {
            message.channel.send({
                embed: Object.assign({ "title": "– Groovy Spreadsheet –", "description": "F Period Bio Gang Groovy", "fields": [
                        {
                            "name": "Our Groovy History",
                            "value": "All of the Groovy songs played can be found here: [Link](https://docs.google.com/spreadsheets/d/17YiJDj9-IRnP_sPg3HJYocdaDkkFgMKfNC6IBDLSLqU/edit#gid=0)"
                        }
                    ] }, Utilities_1.Utilities.embedInfo(message))
            });
        });
    }
}
exports.TrackerBot = TrackerBot;
