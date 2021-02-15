import { Module } from "./Module";
import { Course, SchoologyAccessor } from './SA';
import * as Discord from "discord.js";
import * as fs from 'fs';

/**
 * @todo Build another layer of abstraction between SqualolBot and SA.ts
 */


export class SqualolBot implements Module {

    constructor() {
        
    }

    async onMessage(message: Discord.Message): Promise<void> {
        
    }

    async onConstruct(): Promise<void> {
        let stuff = new Course((await SchoologyAccessor.listCourses())[10]);
        await stuff.onConstruct();
        console.log(stuff.baseFolder.children[0]);
        // fs.writeFileSync('./day1.json', JSON.stringify(await SchoologyAccessor.getFolder('2772305484', '398147550')))
        // fs.writeFileSync('./temp/assignmentslist.json', JSON.stringify( await (await SchoologyAccessor.get('/sections/2772305484/assignments?limit=1000')).json()) );
    }

    available(message: Discord.Message): boolean {
        return message.guild.id === '748669830244073533';
    }

    helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

}