import { Module } from "./Module";
import * as Discord from "discord.js"
import * as nodecron from "node-cron";
import * as fs from "fs";
import { Utilities } from "./Utilities";

export class PianoManBot implements Module {
    public name: "Piano Man Bot";

    private pianoManChannel = '748669830244073536';
    // private pianoManChannel = '750804960333135914'; // OVERRIDE
    private client: Discord.Client;
    private lines: string[];

    constructor(client: Discord.Client) {
        this.client = client;
    }

    async onConstruct() {
        this.lines = fs.readFileSync("./src/data/lyrics.txt").toString().split('\n').filter(a => !a.startsWith("*"));

        nodecron.schedule("0 21 * * 6", () => {
        // nodecron.schedule("30 18 * * 6", () => {
            this.pianoMan();
            console.log("Piano Man!");
        },
        {
            timezone: `America/Los_Angeles`
        })
    }

    async pianoMan() {
        let channel = await this.client.channels.fetch(this.pianoManChannel);
        if(channel instanceof Discord.TextChannel) {
            await channel.send(this.lines[0]);

            for( let currlinenumber = 1; currlinenumber < this.lines.length; ) {
                try {
                    await channel.awaitMessages((message: Discord.Message) => {
                        let stuff = Utilities.RatcliffObershelpOrig(this.lines[currlinenumber], message.content);
                        // console.log(`Received! Stuff: ${stuff}`);
                        return stuff > 0.8;
                    }, { errors: ['time'], time: 1000 * 60 * 2, max: 1 });
                } catch (err) {
                    await channel.send("Sad!");
                    return;
                }
                if(currlinenumber+1 >= this.lines.length) {
                    break;
                }
                await channel.send(this.lines[currlinenumber+1]);
                currlinenumber += 2
                if (currlinenumber >= this.lines.length) {
                    break;
                }
            }

            await channel.send("Happy Saturday!");
            
        }
    }
}