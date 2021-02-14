import * as Discord from "discord.js";
import { SheetsUser } from "./SheetsUser";
import { Utilities } from './Utilities';

import { scheduleJob } from "node-schedule";
import { tz } from "moment-timezone";
import { Module } from "./Module";

/**
 * @todo Add spreadsheet link
 */

export class CalendarBot implements Module {

    private sheetsUser:SheetsUser;
    private prefix = `--`;
    private bdayChannels: string[] = ["748669830244073536"];
    private client: Discord.Client;
    public helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

    constructor(auth, client: Discord.Client) {

        let currmap = new Map();
        currmap.set("peeps", "1m-w9iB40s2f5dWaauQR_gNm88g1j4prdajBWVGG12_k");
        this.sheetsUser = new SheetsUser(auth, currmap);


        // this.bdayChannels = ["750804960333135914"]; // Redirect
        this.client = client;

        this.helpEmbed = {
            title: 'Help - Birthday Bot',
            description: `Issues a friendly reminder whenever it's someone's birthday.`,
            fields: []
        }
        
    }

    
    available(message: Discord.Message): boolean {
        return message.guild.id === '748669830244073533';
    }

    async onMessage(message: Discord.Message): Promise<void> { }

    async sendBday(row:string[]) {
        const person = row[0];
        const bday = row[1];
        const age = row[3];

        let embed = {
            title: `Happy Birthday to ${person}! 🎉`,
            description: [`${age} years ago, on ${bday}, they were birthed into this cruel and doomed world.`,
                    `But today, we celebrate! Here's to being 1 year closer to death!`,
                    `Ok, now go bully them with your singing or something.`].join(`\n`),
            ...Utilities.basicEmbedInfoForCal()
        }

        for(const id of this.bdayChannels) {
            let channel = await this.client.channels.fetch(id)
            if(channel instanceof Discord.TextChannel) {
                channel.send({ embed });
            }
        }
    }

    async onConstruct() {

        console.log(`Setting up Calendar Bot`);

        console.log(`Setting up Google Sheets.`)
        await this.sheetsUser.onConstruct();

        console.log(`Fetching data, setting up Birthdays.`)
        let rows = (await this.sheetsUser.readSheet("peeps", "Birthdays"));

        for(let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if(row[1].length > 0) {
                let stuff = row[2].split("/");
                if(stuff[1].length < 2) {
                    stuff[1] = "0" + stuff[1];
                }
                if (stuff[0].length < 2) {
                    stuff[0] = "0" + stuff[0];
                }
                let momentobj = (tz([stuff[2],stuff[0],stuff[1]].join("-"), "America/Los_Angeles"));
                momentobj.set("hours", 7);
                momentobj.set("minutes", 0);
                momentobj.set("seconds", 0);

                scheduleJob(momentobj.toDate(), () => {
                    this.sendBday(row);
                })

            }
        }

        console.log(`Calendar Bot construction complete!`)
    }

}