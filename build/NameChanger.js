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
exports.NameChangerBot = void 0;
const SheetsUser_1 = require("./SheetsUser");
const Utilities_1 = require("./Utilities");
const moment = require("moment");
const ProcessMessage_1 = require("./ProcessMessage");
class NameChangerBot {
    constructor(auth, client) {
        this.prefix = `--`;
        let currmap = new Map();
        currmap.set("names", "1-eQTzUas98d4PdHcJBEJBJnfVib0Aa-1hs6fQuJZmB4");
        this.sheetsUser = new SheetsUser_1.SheetsUser(auth, currmap);
        this.client = client;
        this.utilities = new Utilities_1.Utilities();
        this.helpEmbed = {
            title: `Help - Themes Bot`,
            description: [
                `Themes Bot changes the theme of the FPERBIO server.`,
                `There's an editable spreadsheet that keeps track of the themes.`
            ].join(` `),
            fields: [
                {
                    name: `${this.prefix}rename [theme name]`,
                    value: `Changes the theme of the server to the theme name, which is case sensitive. It basically changes all the channel names.`
                },
                {
                    name: `${this.prefix}themesheet`,
                    value: `Provides the link to the spreadsheet where themes are kept. You can even add your own!`
                },
                {
                    name: `${this.prefix}themes`,
                    value: `Gives a quick list of all the themes.`
                },
            ]
        };
        this.fperbioserver = "748669830244073533";
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                if (result.command === "rename") {
                    this.onChange(message, result.args);
                }
                if (result.command === "themesheet") {
                    this.sendSpreadsheets(message);
                }
                if (result.command === "themes") {
                    this.sendThemes(message);
                }
            }
        });
    }
    /**
     *
     * @param {string} str
     */
    capitalize(str) {
        let words = str.split(" ");
        for (let i = 0; i < words.length; i++) {
            words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        }
        return words.join(" ");
    }
    readIDs() {
        return __awaiter(this, void 0, void 0, function* () {
            let arr = [];
            const sheet = (yield this.sheetsUser.readSheet("names", "DiscordIDs"));
            for (let i = 1; i < sheet.length; i++) {
                arr.push(sheet[i][1]);
            }
            return arr;
        });
    }
    readThemes() {
        return __awaiter(this, void 0, void 0, function* () {
            const map = new Map();
            const sheet = (yield this.sheetsUser.readSheet("names", "Names"));
            for (let i = 0; i < sheet[0].length; i++) {
                let key = sheet[0][i];
                if (i === 0) {
                    key = "KEY";
                }
                const arr = [];
                for (let j = 1; j < sheet.length; j++) {
                    arr.push(sheet[j][i]);
                }
                map.set(key, arr);
            }
            return map;
        });
    }
    guysCanWePleaseLearnCapitalizationSoIDontHaveToDoThis() {
        return __awaiter(this, void 0, void 0, function* () {
            const sheet = (yield this.sheetsUser.readSheet("names", "Names"));
            for (let i = 0; i < sheet.length; i++) {
                sheet[i][0] = this.capitalize(sheet[i][0]);
                if (i === 0 || i >= 15) {
                    for (let j = 1; j < sheet[i].length; j++) {
                        sheet[i][j] = this.capitalize(sheet[i][j]);
                    }
                }
            }
            yield this.sheetsUser.bulkUpdateRows("names", "Names", sheet.map((val, index) => {
                return {
                    num: index,
                    row: val
                };
            }));
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            // let leo = await this.client.users.fetch("526863414635790356");
            let fpbg = yield this.client.guilds.fetch(this.fperbioserver);
            // console.log(fpbg);
            console.log("Fetching");
            yield fpbg.members.fetch();
            // let leomember = fpbg.member(leo);
            // console.log(leomember)
            console.log(`Setting up Name Changer Bot.`);
            console.log(`Setting up sheets`);
            yield this.sheetsUser.onConstruct();
            console.log(`Name Changer Bot Complete`);
        });
    }
    available() {
        return __awaiter(this, void 0, void 0, function* () {
            let time = moment();
            let prev = yield this.sheetsUser.readSheet("names", "Info");
            let prevtime = moment(prev[1][0]);
            let diff = time.diff(prevtime, "minutes");
            if (diff < 5) {
                return false;
            }
            return true;
        });
    }
    keys() {
        return __awaiter(this, void 0, void 0, function* () {
            const map = yield this.readThemes();
            return map.keys();
        });
    }
    nameChange(arr) {
        return __awaiter(this, void 0, void 0, function* () {
            let time = moment();
            yield this.sheetsUser.updateRow("names", "Info", [time.format()], 1);
            const keys = yield this.readIDs();
            let guild = (yield this.client.guilds.fetch(this.fperbioserver));
            let channels = guild.channels.cache;
            for (let i = 0; i < arr.length; i++) {
                let key = keys[i];
                let name = arr[i];
                if (name === "") {
                    name = "Unnamed";
                }
                let channel = (channels.get(key));
                channel.setName(name);
            }
        });
    }
    /**
     *
     * @param {Discord.Message} message
     */
    sendSpreadsheets(message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.utilities.sendClosableEmbed(message, Object.assign({ "title": "Theme Spreadsheet", "description": "The Spreadsheet where all the FPERBIO themes are kept. You can always edit it and add/edit new themes!", "fields": [
                    {
                        "name": "Spreadsheet:",
                        "value": "Themes found here: [Link](https://docs.google.com/spreadsheets/d/1-eQTzUas98d4PdHcJBEJBJnfVib0Aa-1hs6fQuJZmB4/edit#gid=0)"
                    },
                ] }, this.utilities.embedInfo(message)));
        });
    }
    /**
     *
     * @param {Discord.Message} message
     */
    sendThemes(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const map = yield this.readThemes();
            const fields = [];
            for (const key of map.keys()) {
                if (key === "KEY")
                    continue;
                let arr = map.get(key).filter((a) => a !== ``);
                let randsample = arr.length ? arr[Math.floor(Math.random() * arr.length)] : `None available.`;
                fields.push({
                    name: `${key}`,
                    value: `Sample: ${randsample}`
                });
            }
            yield this.utilities.sendClosableEmbed(message, Object.assign({ title: `Themes`, description: `All the themes, as of now. Names are case sensitive. Remember, you can always edit the spreadsheet! (use ${this.prefix}themesheet)`, fields }, this.utilities.embedInfo(message)));
        });
    }
    /**
     *
     * @param {Discord.Message} message
     * @param {string[]} args
     */
    onChange(message, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const param = args.join(" ");
            const map = yield this.readThemes();
            if (!map.has(param)) {
                message.channel.send({
                    embed: Object.assign({ title: `Invalid Theme ${param}`, description: `That theme is not valid. Capitalization matters.` }, this.utilities.embedInfo(message))
                });
                return false;
            }
            if (!(yield this.available())) {
                message.channel.send({
                    embed: Object.assign({ title: `Slow Down!`, description: `You must wait 5 minutes to fully rename the server. Why? Because Discord API, it's just how it is buddy.` }, this.utilities.embedInfo(message))
                });
                return false;
            }
            const arr = map.get(param);
            const arrstr = arr.join(", ");
            const passed = yield this.utilities.sendEmoteCollector(message, (bool) => {
                if (typeof bool === "boolean") {
                    return Object.assign({ title: bool ? `Changed the Theme to ${param}` : `Change the Theme to ${param}?`, description: bool ?
                            `The theme was changed. You must wait 5 minutes before changing again.` :
                            `Vote with 👍 to approve, 👎 to disapprove like how your parents disapprove of you. 4 net votes are required to change the theme. ` +
                                `Also, admins can use ❌ to instantly disable the vote. Finally, after 2 minutes of inactivity, the vote is disabled.`, fields: [{
                                name: `Channel Names:`,
                                value: arrstr
                            }] }, this.utilities.embedInfo(message));
                }
            }, 4, 1000 * 60 * 2);
            if (passed) {
                yield this.nameChange(arr);
            }
        });
    }
}
exports.NameChangerBot = NameChangerBot;
