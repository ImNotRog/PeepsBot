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
const fs = require("fs");
const Utilities_1 = require("./Utilities");
class PianoManBot {
    constructor(client) {
        this.pianoManChannel = '748669830244073536';
        this.client = client;
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            this.lines = fs.readFileSync("./src/data/lyrics.txt").toString().split('\n').filter(a => !a.startsWith("*"));
            nodecron.schedule("0 21 * * 6", () => {
                this.pianoMan();
                console.log("Piano Man!");
            }, {
                timezone: `America/Los_Angeles`
            });
        });
    }
    pianoMan() {
        return __awaiter(this, void 0, void 0, function* () {
            let channel = yield this.client.channels.fetch(this.pianoManChannel);
            if (channel instanceof Discord.TextChannel) {
                yield channel.send(this.lines[0]);
                for (let currlinenumber = 1; currlinenumber < this.lines.length;) {
                    try {
                        yield channel.awaitMessages((message) => {
                            let stuff = Utilities_1.Utilities.RatcliffObershelpOrig(this.lines[currlinenumber], message.content);
                            // console.log(`Received! Stuff: ${stuff}`);
                            return stuff > 0.8;
                        }, { errors: ['time'], time: 1000 * 60 * 2, max: 1 });
                    }
                    catch (err) {
                        yield channel.send("Sad!");
                        return;
                    }
                    if (currlinenumber + 1 >= this.lines.length) {
                        break;
                    }
                    yield channel.send(this.lines[currlinenumber + 1]);
                    currlinenumber += 2;
                    if (currlinenumber >= this.lines.length) {
                        break;
                    }
                }
                yield channel.send("Happy Saturday!");
            }
        });
    }
}
exports.PianoManBot = PianoManBot;
