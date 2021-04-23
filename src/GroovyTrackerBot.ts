import { SheetsUser } from "./SheetsUser";
import { Utilities } from "./Utilities";
import * as Discord from "discord.js";
import { Command, Module } from "./Module";

export class TrackerBot implements Module {
    public name: "Groovy Tracker Bot";

    private sheetsUser: SheetsUser;
    private musicBots: string[];
    private prefix: string = "--";
    public helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };
    private approvedMusicServers = ["748669830244073533"];
    public commands: Command[];

    constructor(auth){

        let currmap = new Map();
        currmap.set("music", "17YiJDj9-IRnP_sPg3HJYocdaDkkFgMKfNC6IBDLSLqU");
        this.sheetsUser = new SheetsUser(auth, currmap);
        
        this.musicBots = ["234395307759108106"]

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
        }

        this.commands = [
            {
                name: "GroovySheet",
                description: "Returns the Groovy Sheet",
                available: (guild) => guild.id === "748669830244073533",
                parameters: [],
                callback: () => {
                    return {
                        embed: {
                            description: `[Link to Groovy Sheet](https://docs.google.com/spreadsheets/d/17YiJDj9-IRnP_sPg3HJYocdaDkkFgMKfNC6IBDLSLqU/edit#gid=0)`,
                            color: 1111111
                        }
                    }
                }
            }
        ]
    }

    available(guild: Discord.Guild): boolean {
        return guild && guild.id === '748669830244073533';
    }

    async onMessage(message: Discord.Message): Promise<void> {
        if (message.author.bot && this.approvedMusicServers.indexOf(message.guild.id) !== -1) {
            this.process(message);
        }
    }

    async onConstruct(){
        // console.log(`Groovy Tracker Bot constructing...`)
        await this.sheetsUser.onConstruct();
        // console.log(`Groovy Tracker Bot complete.`)
    }

    async readList() {
        return this.sheetsUser.readSheet("music", "Groovy");
    }

    async addGroovyEntry(title:string,link:string) {
        this.sheetsUser.addWithoutDuplicates("music", "Groovy", [title,link,1,Utilities.getTodayStr()], [true,true, (x) => parseInt(x)+1, "CHANGE"]);
    }

    async processPlayMessage(txt: string){
        if (txt && txt.startsWith("[")) {
            let endtitle = txt.indexOf("](");
            let title = txt.slice(1, endtitle);

            let startlink = endtitle + 2;
            let endlink = txt.indexOf(") [<@")
            let link = txt.slice(startlink, endlink);

            await this.addGroovyEntry(title, link)
        }
        
    }
    
    async process(message:Discord.Message) {
        if(message.embeds[0] && this.musicBots.indexOf( message.author.id ) !== -1){
            let prevmsg = await message.channel.messages.fetch({
                limit: 2
            })
            let keys = prevmsg.keys()
            keys.next();
            let prevmsgkey = keys.next().value;
            let content = prevmsg.get(prevmsgkey).content

            if(!content.startsWith("-np")){
                (this.processPlayMessage(message.embeds[0].description))
            }
        }
        
    }

}