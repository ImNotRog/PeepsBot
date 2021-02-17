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
exports.CalendarBot = void 0;
const Discord = require("discord.js");
const SheetsUser_1 = require("./SheetsUser");
const Utilities_1 = require("./Utilities");
const node_schedule_1 = require("node-schedule");
const moment_timezone_1 = require("moment-timezone");
/**
 * @todo Add spreadsheet link
 */
class CalendarBot {
    constructor(auth, client) {
        this.prefix = `--`;
        this.bdayChannels = ["748669830244073536"];
        let currmap = new Map();
        currmap.set("peeps", "1m-w9iB40s2f5dWaauQR_gNm88g1j4prdajBWVGG12_k");
        this.sheetsUser = new SheetsUser_1.SheetsUser(auth, currmap);
        // this.bdayChannels = ["750804960333135914"]; // Redirect
        this.client = client;
        this.helpEmbed = {
            title: 'Help - Birthday Bot',
            description: `Issues a friendly reminder whenever it's someone's birthday.`,
            fields: []
        };
    }
    available(message) {
        return message.guild.id === '748669830244073533';
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    sendBday(row) {
        return __awaiter(this, void 0, void 0, function* () {
            const person = row[0];
            const bday = row[1];
            const age = row[3];
            let embed = Object.assign({ title: `Happy Birthday to ${person}! 🎉`, description: [`${age} years ago, on ${bday}, they were birthed into this cruel and doomed world.`,
                    `But today, we celebrate! Here's to being 1 year closer to death!`,
                    `Ok, now go bully them with your singing or something.`].join(`\n`) }, Utilities_1.Utilities.basicEmbedInfo());
            for (const id of this.bdayChannels) {
                let channel = yield this.client.channels.fetch(id);
                if (channel instanceof Discord.TextChannel) {
                    channel.send({ embed }, { allowedMentions: { parse: [] } });
                }
            }
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Setting up Calendar Bot`);
            console.log(`Setting up Google Sheets.`);
            yield this.sheetsUser.onConstruct();
            console.log(`Fetching data, setting up Birthdays.`);
            let rows = (yield this.sheetsUser.readSheet("peeps", "Birthdays"));
            for (let i = 2; i < rows.length; i++) {
                const row = rows[i];
                if (row[1].length > 0) {
                    let stuff = row[2].split("/");
                    if (stuff[1].length < 2) {
                        stuff[1] = "0" + stuff[1];
                    }
                    if (stuff[0].length < 2) {
                        stuff[0] = "0" + stuff[0];
                    }
                    let momentobj = (moment_timezone_1.tz([stuff[2], stuff[0], stuff[1]].join("-"), "America/Los_Angeles"));
                    momentobj.set("hours", 7);
                    momentobj.set("minutes", 0);
                    momentobj.set("seconds", 0);
                    node_schedule_1.scheduleJob(momentobj.toDate(), () => {
                        this.sendBday(row);
                    });
                }
            }
            console.log(`Calendar Bot construction complete!`);
        });
    }
}
exports.CalendarBot = CalendarBot;
