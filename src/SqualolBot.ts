import { Module } from "./Module";
import { Course, SFile, SchoologyAccessor } from './SA';
import * as Discord from "discord.js";
import * as fs from 'fs';
import { Utilities } from "./Utilities";
import { PROCESS } from "./ProcessMessage";

/**
 * @todo Build another layer of abstraction between SqualolBot and SA.ts
 */


export class SqualolBot implements Module {
    public name = "Squalol Bot";

    private self:Course;
    constructor() {
        this.helpEmbed = {
            title: "Help Squalol Bot",
            description: `In progress!`,
            fields: []
        }
    }

    async onMessage(message: Discord.Message): Promise<void> {
        const result = PROCESS(message);
        if(result) {
            if (result.command === "search") {
                let str = result.args.join(' ');

                let allchildren = this.self.baseFolder.wordSearch(str);

                let maxchild = allchildren[0];
                let max = Utilities.RatcliffObershelpCustom(str, maxchild.data.title);

                message.channel.send({
                    embed: {
                        title: `Search for "${str.toUpperCase()}"`,
                        fields: [
                            ...await maxchild.toEmbedFields(), 
                            {
                                name: `Similar Results`,
                                value: `The above result was ${Math.round(max * 100)}% similar.\n${allchildren.slice(1, 5).map(a => `${Math.round(Utilities.RatcliffObershelpCustom(str, a.data.title) * 100)}% - ${a.toString()}`).join('\n')}`
                            }
                        ],
                        ...Utilities.embedInfo(message)
                    }
                })
            } else if(result.command === "get") {
                let id = result.args[0];

                let getid = this.self.baseFolder.findall((sfile) => parseInt(sfile.data.id) === parseInt(id));

                if(getid.length === 0) {
                    message.channel.send({
                        embed: {
                            title: `No file found with ID ${id}`,
                            description: `Make sure you're using this command correctly!`,
                            ...Utilities.embedInfo(message)
                        }
                    })
                } else if(getid.length > 1) {
                    message.channel.send({
                        embed: {
                            title: `More than one file found with ID ${id}`,
                            description: `Report to Rog#2597 immediately. This is actually kind of importnat.`,
                            ...Utilities.embedInfo(message)
                        }
                    })
                    console.log(`Duplicate id ${id}`);
                } else {
                    message.channel.send({
                        embed: {
                            title: `Search for ID ${id}`,
                            fields: [
                                ...await getid[0].toEmbedFields(),
                            ],
                            ...Utilities.embedInfo(message)
                        }
                    })
                }
            }
        }
        
    }

    async onConstruct(): Promise<void> {
        let stuff = new Course((await SchoologyAccessor.listCourses("2016549"))[5]);
        await stuff.onConstruct();

        this.self = stuff;

        // console.log(Utilities.RatcliffObershelp("i am going home", "gone home"));

        // console.log(Utilities.SimilarBigramsOf("Week 15", "Week 15 : November 16 - 20 [tk]"));
        // console.log(Utilities.SimilarBigramsOf("Week 15", "Week"));

        // fs.writeFileSync('./day1.json', JSON.stringify(await SchoologyAccessor.getFolder('2772305484', '398147550')))
        // fs.writeFileSync('./temp/assignmentslist.json', JSON.stringify( await (await SchoologyAccessor.get('/sections/2772305484/assignments?limit=1000')).json()) );
    }

    available(guild: Discord.Guild): boolean {
        return guild && guild.id === '748669830244073533';
    }

    helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

}