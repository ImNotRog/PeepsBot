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
exports.PianoManBot = void 0;
const Discord = require("discord.js");
const nodecron = require("node-cron");
const Utilities_1 = require("./Utilities");
const ProcessMessage_1 = require("./ProcessMessage");
const SheetsUser_1 = require("./SheetsUser");
class PianoManBot {
    constructor(auth, client) {
        this.pianoManChannel = '748669830244073536';
        this.spam = ['748670606085587060', '750804960333135914', '755528072597471243'];
        this.client = client;
        let currmap = new Map();
        currmap.set("songs", "1S4HET4PciL_d-gXW5DmRt9STFN7T5d-q99ATpZYS_WM");
        this.sheetsUser = new SheetsUser_1.SheetsUser(auth, currmap);
        this.helpEmbed = {
            title: `Help - Song Bot`,
            description: `I just do random word songs sometimes.`,
            fields: [
                {
                    name: `--sing [song name]`,
                    value: `Holds a song singing thing in the channel. Song names are case sensitive.`
                },
                {
                    name: `--songs`,
                    value: `Returns the spreadsheet for the songs. You can even add your own!`
                }
            ]
        };
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sheetsUser.onConstruct();
            nodecron.schedule("0 20 * * 6", () => {
                // nodecron.schedule("30 18 * * 6", () => {
                this.pianoMan();
                console.log("Piano Man!");
            }, {
                timezone: `America/Los_Angeles`
            });
        });
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                if (result.command === "sing") {
                    if (this.spam.includes(message.id) || message.member.hasPermission("ADMINISTRATOR")) {
                        yield this.sheetsUser.setUpSheet("songs");
                        if ((yield this.sheetsUser.getSubsheets("songs")).includes(result.args[0])) {
                            this.singSheet(message.channel, result.args[0]);
                        }
                        else {
                            message.channel.send("Song not found.");
                        }
                    }
                    else {
                        message.channel.send("Not enough permissions. Please find a spam channel to run this command in.");
                    }
                }
                else if (result.command === "songs") {
                    message.channel.send({
                        embed: {
                            description: `[Here's the link to the songs.](https://docs.google.com/spreadsheets/d/1S4HET4PciL_d-gXW5DmRt9STFN7T5d-q99ATpZYS_WM/edit#gid=0) You can add your own, but remember that names are case sensitive!`,
                            color: 1111111
                        }
                    });
                }
            }
        });
    }
    available(guild) {
        return guild && guild.id === "748669830244073533";
    }
    sing(channel, lines, message) {
        return __awaiter(this, void 0, void 0, function* () {
            // let channel = 
            if (channel instanceof Discord.TextChannel) {
                yield channel.send(lines[0]);
                let lastid = "0";
                let lastname = "I";
                for (let currlinenumber = 1; currlinenumber < lines.length;) {
                    let m;
                    try {
                        m = yield channel.awaitMessages((message) => {
                            let stuff = Utilities_1.Utilities.RatcliffObershelpNoRepeats(lines[currlinenumber], message.content);
                            // console.log(`Received! Stuff: ${stuff}`);
                            if (message.content.startsWith("--hint")) {
                                return true;
                            }
                            if (message.content.startsWith("--end") && message.member.hasPermission("ADMINISTRATOR")) {
                                return true;
                            }
                            return message.author.id !== lastid && stuff > 0.8;
                        }, { errors: ['time'], time: 1000 * 60 * 2, max: 1 });
                    }
                    catch (err) {
                        yield channel.send(`${lastname} sang, but no one continued. Sad!`);
                        return;
                    }
                    let mf = m.first();
                    if (mf.content.startsWith("--hint")) {
                        channel.send(`${lines[currlinenumber].slice(0, lines[currlinenumber].length / 2)}...`);
                        continue;
                    }
                    else if (mf.content.startsWith("--end")) {
                        yield mf.react("✅");
                        break;
                    }
                    yield mf.react("✅");
                    lastid = mf.author.id;
                    lastname = mf.author.username + "#" + mf.author.discriminator;
                    currlinenumber++;
                }
                if (message)
                    yield channel.send(message);
                else
                    yield channel.send("------------------");
            }
        });
    }
    singSheet(channel, subsheet) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = (yield this.sheetsUser.readSheet("songs", subsheet));
            let lines = res.map(a => a[0]);
            let message;
            if (res[0].length > 1) {
                message = res[0][1];
            }
            this.sing(channel, lines, message);
        });
    }
    pianoMan() {
        return __awaiter(this, void 0, void 0, function* () {
            let channel = yield this.client.channels.fetch(this.pianoManChannel);
            // this.sing(channel, (await this.sheetsUser.readSheet("songs", "pianoman")).map(a => a[0]), "Happy Saturday!");
            this.singSheet(channel, "pianoman");
        });
    }
}
exports.PianoManBot = PianoManBot;
