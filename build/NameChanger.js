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
class NameChangerBot {
    constructor(auth, client) {
        this.prefix = `--`;
        let currmap = new Map();
        currmap.set("names", "1-eQTzUas98d4PdHcJBEJBJnfVib0Aa-1hs6fQuJZmB4");
        this.sheetsUser = new SheetsUser_1.SheetsUser(auth, currmap);
        this.client = client;
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
        this.commands = [
            {
                name: "Themes",
                description: "Lists the themes. Preferably, use this command in spam channels.",
                available: (guild) => guild.id === this.fperbioserver,
                callback: () => __awaiter(this, void 0, void 0, function* () {
                    return yield this.sendThemes();
                }),
                parameters: [],
            },
            {
                name: "ThemeSheet",
                description: "Gives the sheet for the FPBG themes",
                available: (guild) => guild.id === this.fperbioserver,
                callback: () => {
                    return {
                        embed: {
                            description: `[Link to the themes sheet.](https://docs.google.com/spreadsheets/d/1-eQTzUas98d4PdHcJBEJBJnfVib0Aa-1hs6fQuJZmB4/edit#gid=0) You can add or change themes there!`,
                            color: 1111111
                        }
                    };
                },
                parameters: []
            },
            {
                name: "Retheme",
                description: "Rethemes the FPBG server to selected theme.",
                available: (guild) => guild.id === this.fperbioserver,
                parameters: [
                    {
                        name: "Theme",
                        description: "The theme to change to",
                        required: true,
                        type: "string"
                    }
                ],
                slashCallback: (invoke, channel, user, theme) => __awaiter(this, void 0, void 0, function* () {
                    const map = yield this.readThemes();
                    // Valid theme?
                    if (!map.has(theme)) {
                        invoke({
                            embed: {
                                title: `Invalid Theme ${theme}`,
                                description: `That theme is not valid. Capitalization matters.`,
                                // ...Utilities.embedInfo(message)
                                color: 1111111
                            }
                        });
                        return;
                    }
                    // Cooldown?
                    if (!(yield this.changeavailable())) {
                        invoke({
                            embed: {
                                title: `Slow Down!`,
                                description: `You must wait 5 minutes to fully rename the server. Why? Because Discord API, it's just how it is buddy.`,
                                // ...Utilities.embedInfo(message)
                                color: 1111111
                            }
                        });
                        return;
                    }
                    invoke("Changing...");
                    const arr = map.get(theme);
                    const arrstr = arr.join(", ");
                    const passed = yield Utilities_1.Utilities.sendEmoteCollector(channel, (bool) => {
                        return {
                            title: bool ? `Changed the Theme to ${theme}` : `Change the Theme to ${theme}?`,
                            description: bool ?
                                `The theme was changed. You must wait 5 minutes before changing again.` :
                                `Vote with 👍 to approve, 👎 to disapprove like how your parents disapprove of you. 4 net votes are required to change the theme. ` +
                                    `Also, admins can use ❌ to instantly disable the vote. Finally, after 2 minutes of inactivity, the vote is disabled.`,
                            fields: [{
                                    name: `Channel Names:`,
                                    value: arrstr
                                }],
                            // ...Utilities.embedInfo(message)
                            color: 1111111
                        };
                    }, 4, 1000 * 60 * 2);
                    if (passed) {
                        yield this.nameChange(arr);
                    }
                }),
                regularCallback: (message, theme) => {
                    this.onChange(message, theme);
                }
            }
        ];
    }
    available(guild) {
        return guild && guild.id === '748669830244073533';
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
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
            let fpbg = yield this.client.guilds.fetch(this.fperbioserver);
            console.log("Fetching");
            yield fpbg.members.fetch();
            console.log(`Setting up Name Changer Bot.`);
            console.log(`Setting up sheets`);
            yield this.sheetsUser.onConstruct();
            console.log(`Name Changer Bot Complete`);
        });
    }
    changeavailable() {
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
                if (channel)
                    channel.setName(name);
            }
        });
    }
    sendThemes() {
        return __awaiter(this, void 0, void 0, function* () {
            const map = yield this.readThemes();
            const fields = [];
            for (const key of map.keys()) {
                if (key === "KEY")
                    continue;
                if (key.length === 0)
                    continue;
                let arr = map.get(key).filter((a) => a !== ``);
                let randsample = arr.length ? arr[Math.floor(Math.random() * arr.length)] : `None available.`;
                fields.push(`**${key}** (Sample: ${randsample})`);
            }
            return ({
                embed: {
                    title: `Themes`,
                    description: `All the themes, as of now. Names are case sensitive. Remember, you can always edit the spreadsheet! (use /themesheet)`,
                    fields: [{
                            name: "Themes",
                            value: fields.join('\n')
                        }],
                    color: 1111111
                }
            });
        });
    }
    onChange(message, param) {
        return __awaiter(this, void 0, void 0, function* () {
            const map = yield this.readThemes();
            if (!map.has(param)) {
                message.channel.send({
                    embed: Object.assign({ title: `Invalid Theme ${param}`, description: `That theme is not valid. Capitalization matters.` }, Utilities_1.Utilities.embedInfo(message))
                });
                return false;
            }
            if (!(yield this.changeavailable())) {
                message.channel.send({
                    embed: Object.assign({ title: `Slow Down!`, description: `You must wait 5 minutes to fully rename the server. Why? Because Discord API, it's just how it is buddy.` }, Utilities_1.Utilities.embedInfo(message))
                });
                return false;
            }
            const arr = map.get(param);
            const arrstr = arr.join(", ");
            const passed = yield Utilities_1.Utilities.sendEmoteCollector(message.channel, (bool) => {
                if (typeof bool === "boolean") {
                    return Object.assign({ title: bool ? `Changed the Theme to ${param}` : `Change the Theme to ${param}?`, description: bool ?
                            `The theme was changed. You must wait 5 minutes before changing again.` :
                            `Vote with 👍 to approve, 👎 to disapprove like how your parents disapprove of you. 4 net votes are required to change the theme. ` +
                                `Also, admins can use ❌ to instantly disable the vote. Finally, after 2 minutes of inactivity, the vote is disabled.`, fields: [{
                                name: `Channel Names:`,
                                value: arrstr
                            }] }, Utilities_1.Utilities.embedInfo(message));
                }
            }, 4, 1000 * 60 * 2);
            if (passed) {
                yield this.nameChange(arr);
            }
        });
    }
}
exports.NameChangerBot = NameChangerBot;
