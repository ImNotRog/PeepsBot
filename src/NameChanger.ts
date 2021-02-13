

import { SheetsUser } from "./SheetsUser";
import { Utilities } from "./Utilities";
import Discord = require("discord.js");
import moment = require("moment");
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";

export class NameChangerBot implements Module {

    private sheetsUser: SheetsUser;
    private client: Discord.Client;
    private utilities: Utilities;
    private readonly prefix = `--`;
    public helpEmbed: Object;
    private fperbioserver: string;

    constructor(auth, client: Discord.Client) {
        let currmap = new Map();
        currmap.set("names", "1-eQTzUas98d4PdHcJBEJBJnfVib0Aa-1hs6fQuJZmB4");
        this.sheetsUser = new SheetsUser(auth, currmap);
        this.client = client;

        this.utilities = new Utilities();

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
        }

        this.fperbioserver = "748669830244073533";
    }

    async onMessage(message: Discord.Message): Promise<void> {
        const result = PROCESS(message);
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
    }

    /**
     * 
     * @param {string} str 
     */
    capitalize(str: string) {
        let words = str.split(" ");
        for (let i = 0; i < words.length; i++) {
            words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        }
        return words.join(" ");
    }

    async readIDs() {
        let arr = [];
        const sheet = (await this.sheetsUser.readSheet("names", "DiscordIDs"));
        for (let i = 1; i < sheet.length; i++) {
            arr.push(sheet[i][1]);
        }
        return arr;
    }

    async readThemes() {
        const map = new Map();
        const sheet = (await this.sheetsUser.readSheet("names", "Names"));
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
    }

    async guysCanWePleaseLearnCapitalizationSoIDontHaveToDoThis() {
        const sheet = (await this.sheetsUser.readSheet("names", "Names"));
        for (let i = 0; i < sheet.length; i++) {
            sheet[i][0] = this.capitalize(sheet[i][0]);

            if (i === 0 || i >= 15) {
                for (let j = 1; j < sheet[i].length; j++) {
                    sheet[i][j] = this.capitalize(sheet[i][j])
                }
            }
        }

        await this.sheetsUser.bulkUpdateRows("names", "Names", sheet.map((val, index) => {
            return {
                num: index,
                row: val
            }
        }));
    }

    async onConstruct() {

        // let leo = await this.client.users.fetch("526863414635790356");
        let fpbg = await this.client.guilds.fetch(this.fperbioserver)
        // console.log(fpbg);

        console.log("Fetching")
        await fpbg.members.fetch();
        // let leomember = fpbg.member(leo);
        // console.log(leomember)


        console.log(`Setting up Name Changer Bot.`)
        console.log(`Setting up sheets`)
        await this.sheetsUser.onConstruct();

        console.log(`Name Changer Bot Complete`);
    }

    async available() {
        let time = moment();

        let prev = await this.sheetsUser.readSheet("names", "Info");
        let prevtime = moment(prev[1][0])
        let diff = time.diff(prevtime, "minutes");
        if (diff < 5) {
            return false;
        }
        return true;
    }

    async keys() {
        const map = await this.readThemes();
        return map.keys();
    }

    async nameChange(arr) {

        let time = moment();
        await this.sheetsUser.updateRow("names", "Info", [time.format()], 1)

        const keys = await this.readIDs();

        let guild = (await this.client.guilds.fetch(this.fperbioserver))
        let channels = guild.channels.cache;

        for (let i = 0; i < arr.length; i++) {
            let key = keys[i];
            let name = arr[i];
            if (name === "") {
                name = "Unnamed"
            }
            let channel = (channels.get(key));
            channel.setName(name)
        }
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async sendSpreadsheets(message: Discord.Message) {
        await Utilities.sendClosableEmbed(message, {
            "title": "Theme Spreadsheet",
            "description": "The Spreadsheet where all the FPERBIO themes are kept. You can always edit it and add/edit new themes!",
            "fields": [
                {
                    "name": "Spreadsheet:",
                    "value": "Themes found here: [Link](https://docs.google.com/spreadsheets/d/1-eQTzUas98d4PdHcJBEJBJnfVib0Aa-1hs6fQuJZmB4/edit#gid=0)"
                },
            ],
            ...Utilities.embedInfo(message)
        });
    }

    /**
     *
     * @param {Discord.Message} message
     */
    async sendThemes(message: Discord.Message) {

        const map = await this.readThemes();

        const fields = [];
        for (const key of map.keys()) {

            if (key === "KEY") continue;

            let arr = map.get(key).filter((a) => a !== ``)
            let randsample = arr.length ? arr[Math.floor(Math.random() * arr.length)] : `None available.`;
            fields.push({
                name: `${key}`,
                value: `Sample: ${randsample}`
            })
        }


        await Utilities.sendClosableEmbed(message, {
            title: `Themes`,
            description: `All the themes, as of now. Names are case sensitive. Remember, you can always edit the spreadsheet! (use ${this.prefix}themesheet)`,
            fields,
            ...Utilities.embedInfo(message)
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {string[]} args 
     */
    async onChange(message: Discord.Message, args: string[]) {

        const param = args.join(" ");
        const map = await this.readThemes();
        if (!map.has(param)) {
            message.channel.send({
                embed: {
                    title: `Invalid Theme ${param}`,
                    description: `That theme is not valid. Capitalization matters.`,
                    ...Utilities.embedInfo(message)
                }
            });
            return false;
        }

        if (!(await this.available())) {
            message.channel.send({
                embed: {
                    title: `Slow Down!`,
                    description: `You must wait 5 minutes to fully rename the server. Why? Because Discord API, it's just how it is buddy.`,
                    ...Utilities.embedInfo(message)
                }
            });
            return false;
        }

        const arr = map.get(param);
        const arrstr = arr.join(", ");

        const passed = await Utilities.sendEmoteCollector(message, (bool) => {

            if (typeof bool === "boolean") {
                return {
                    title: bool ? `Changed the Theme to ${param}` : `Change the Theme to ${param}?`,
                    description: bool ?
                        `The theme was changed. You must wait 5 minutes before changing again.` :
                        `Vote with 👍 to approve, 👎 to disapprove like how your parents disapprove of you. 4 net votes are required to change the theme. ` +
                        `Also, admins can use ❌ to instantly disable the vote. Finally, after 2 minutes of inactivity, the vote is disabled.`,
                    fields: [{
                        name: `Channel Names:`,
                        value: arrstr
                    }],
                    ...Utilities.embedInfo(message)
                }
            }

        }, 4, 1000 * 60 * 2)


        if (passed) {
            await this.nameChange(arr);
        }

    }
}