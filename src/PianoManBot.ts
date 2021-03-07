import { Module } from "./Module";
import * as Discord from "discord.js"
import * as nodecron from "node-cron";
import * as fs from "fs";
import { Utilities } from "./Utilities";
import { PROCESS } from "./ProcessMessage";
import { SheetsUser } from "./SheetsUser";

export class PianoManBot implements Module {
    public name: "Piano Man Bot";

    private pianoManChannel = '748669830244073536';
    // private pianoManChannel = '750804960333135914'; // OVERRIDE
    private client: Discord.Client;
    private sheetsUser: SheetsUser;
    private spam = ['748670606085587060', '750804960333135914', '755528072597471243'];
    helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

    constructor(auth, client: Discord.Client) {
        this.client = client;

        let currmap = new Map();
        currmap.set("songs", "1S4HET4PciL_d-gXW5DmRt9STFN7T5d-q99ATpZYS_WM");
        this.sheetsUser = new SheetsUser(auth, currmap);

        this.helpEmbed = {
            title: `Help - Song Bot`,
            description: `I just do random word songs sometimes.`,
            fields: [
                {
                    name: `--sing [song name]`,
                    value: `Holds a song singing thing in the channel. Song names are case sensitive.`
                }, 
                {
                    name: `--songs`,
                    value: `Returns the spreadsheet for the songs. You can even add your own!`
                }
            ]
        }
    }

    async onConstruct() {
        await this.sheetsUser.onConstruct();

        nodecron.schedule("0 21 * * 6", () => {
        // nodecron.schedule("30 18 * * 6", () => {
            this.pianoMan();
            console.log("Piano Man!");
        },
        {
            timezone: `America/Los_Angeles`
        })
    }

    async onMessage(message:Discord.Message): Promise<void> {
        const result = PROCESS(message);

        if(result) {

            if (result.command === "sing") {
                if (this.spam.includes(message.id) || message.member.hasPermission("ADMINISTRATOR")) {
                    await this.sheetsUser.setUpSheet("songs");
                    if( (await this.sheetsUser.getSubsheets("songs")).includes(result.args[0]) ) {
                        this.singSheet(message.channel, result.args[0]);
                    } else {
                        message.channel.send("Song not found.")
                    }
                } else {
                    message.channel.send("Not enough permissions. Please find a spam channel to run this command in.");
                }
            } else if(result.command === "songs") {
                message.channel.send({
                    embed: {
                        description: `[Here's the link to the songs.](https://docs.google.com/spreadsheets/d/1S4HET4PciL_d-gXW5DmRt9STFN7T5d-q99ATpZYS_WM/edit#gid=0) You can add your own, but remember that names are case sensitive!`,
                        color: 1111111
                    }
                })
            }

        }
    }

    available(message:Discord.Message) {
        return message.guild.id === "748669830244073533";
    }

    async sing(channel:Discord.Channel, lines: string[], message?: string) {
        // let channel = 
        if (channel instanceof Discord.TextChannel) {
            await channel.send(lines[0]);

            let lastid = "0";
            let lastname = "I";
            for (let currlinenumber = 1; currlinenumber < lines.length;) {
                let m: Discord.Collection<string, Discord.Message>;
                try {
                    m = await channel.awaitMessages((message: Discord.Message) => {
                        let stuff = Utilities.RatcliffObershelpOrig(lines[currlinenumber], message.content);
                        // console.log(`Received! Stuff: ${stuff}`);

                        if(message.content.startsWith("--hint")) {
                            return true;
                        }
                        if (message.content.startsWith("--end") && message.member.hasPermission("ADMINISTRATOR")) {
                            return true;
                        }
                        return message.author.id !== lastid && stuff > 0.8;
                    }, { errors: ['time'], time: 1000 * 60 * 2, max: 1 });
                } catch (err) {
                    await channel.send(`${lastname} sang, but no one continued. Sad!`);
                    return;
                }

                let mf = m.first();

                if(mf.content.startsWith("--hint")) {
                    channel.send(`${lines[currlinenumber].slice(0, lines[currlinenumber].length / 2)}...`);
                    continue;
                } else if(mf.content.startsWith("--end")) {
                    await mf.react("✅");
                    break;
                }

                await mf.react("✅");

                lastid = mf.author.id;
                lastname = mf.author.username + "#" + mf.author.discriminator;
                currlinenumber++;
            }

            if(message) await channel.send(message);
            else await channel.send("------------------");

        }
    }

    async singSheet(channel:Discord.Channel, subsheet: string) {
        let res = (await this.sheetsUser.readSheet("songs", subsheet))
        let lines = res.map(a => a[0]);
        let message:string;
        if(res[0].length > 1) {
            message = res[0][1];
        }
        this.sing(channel,lines, message);
    }

    async pianoMan() {
        let channel = await this.client.channels.fetch(this.pianoManChannel);
        // this.sing(channel, (await this.sheetsUser.readSheet("songs", "pianoman")).map(a => a[0]), "Happy Saturday!");
        this.singSheet(channel, "pianoman");
    }
}