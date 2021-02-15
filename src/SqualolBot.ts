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

                let allchildren = (this.self.baseFolder.listAllChildren());

                let max = 0;
                let maxchild: SFile = null;
                for (const child of allchildren) {
                    let num = Utilities.RatcliffObershelpRaw(child.data.title.toLowerCase(), str.toLowerCase());
                    if (num > max) {
                        maxchild = child;
                        max = num;
                    }
                }

                message.channel.send({
                    embed: {
                        title: `Search for "${str}"`,
                        fields: await maxchild.toEmbedFields(),
                        ...Utilities.embedInfo(message)
                    }
                })
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

    available(message: Discord.Message): boolean {
        return message.guild.id === '748669830244073533';
    }

    helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

}