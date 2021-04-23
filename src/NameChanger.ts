

import { SheetsUser } from "./SheetsUser";
import { Utilities } from "./Utilities";
import Discord = require("discord.js");
import moment = require("moment");
import { Command, Module } from "./Module";
import { PROCESS } from "./ProcessMessage";

export class NameChangerBot implements Module {
    public name: "Theme Bot";

    private sheetsUser: SheetsUser;
    private client: Discord.Client;
    private readonly prefix = `--`;
    private fperbioserver: string;
    public helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };
    public commands: Command[];

    constructor(auth, client: Discord.Client) {
        let currmap = new Map();
        currmap.set("names", "1-eQTzUas98d4PdHcJBEJBJnfVib0Aa-1hs6fQuJZmB4");
        this.sheetsUser = new SheetsUser(auth, currmap);
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
        }

        this.fperbioserver = "748669830244073533";

        this.commands = [
            {
                name: "Themes",
                description: "Lists the themes. Preferably, use this command in spam channels.",
                available: (guild) => guild.id === this.fperbioserver,
                callback: async () => {
                    return await this.sendThemes();
                },
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
                    }
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
                slashCallback: async (invoke, channel,  user, theme:string) => {
                    const map = await this.readThemes();
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
                    if (!(await this.changeavailable())) {
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

                    const passed = await Utilities.sendEmoteCollector(channel, (bool) => {

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
                        }
                    

                    }, 4, 1000 * 60 * 2)


                    if (passed) {
                        await this.nameChange(arr);
                    }
                },
                regularCallback: (message, theme:string) => {
                    this.onChange(message, theme);
                }
            }
        ]
    }
    
    available(guild: Discord.Guild): boolean {
        return guild && guild.id === '748669830244073533';
    }

    async onMessage(message: Discord.Message): Promise<void> {
        
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

        let fpbg = await this.client.guilds.fetch(this.fperbioserver)

        console.log("Fetching")
        await fpbg.members.fetch();

        console.log(`Setting up Name Changer Bot.`)
        console.log(`Setting up sheets`)
        await this.sheetsUser.onConstruct();

        console.log(`Name Changer Bot Complete`);
    }

    async changeavailable() {
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
            if(channel) channel.setName(name)
        }
    }

    async sendThemes() {

        const map = await this.readThemes();

        const fields = [];
        for (const key of map.keys()) {

            if (key === "KEY") continue;
            if(key.length === 0) continue;

            let arr = map.get(key).filter((a) => a !== ``)
            let randsample = arr.length ? arr[Math.floor(Math.random() * arr.length)] : `None available.`;
            fields.push(`**${key}** (Sample: ${randsample})`)
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
        })
    }

    async onChange(message: Discord.Message, param:string) {

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

        if (!(await this.changeavailable())) {
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

        const passed = await Utilities.sendEmoteCollector(message.channel, (bool) => {

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