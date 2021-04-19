import { DriveUser } from "./DriveUser";
import { SheetsUser } from "./SheetsUser";
import * as Discord from 'discord.js';
import { Module, Command } from "./Module";
import { SchoologyAccessor } from './SA';
import * as fs from "fs";
import { PROCESS } from "./ProcessMessage";
export class TestBot implements Module {
    public name: "Test Bot";

    private client: Discord.Client;
    private readonly prefix: string = "--";
    private driveUser: DriveUser;
    private sheetUser: SheetsUser;

    private readonly imagesFolder = '1Bil_W-7kd43marLiwlL6nZ7nEZAUzKQ2';
    private readonly imagesSheet = '17iYieSC2zDKpxgSPqhk6fcJZQjVBvJFE5S5KS1IcON8';

    private readonly jackChannels = ['809143110302826497'];

    public commands: Command[];

    constructor(auth, client: Discord.Client) {
        this.client = client;
        this.driveUser = new DriveUser(auth);

        let map = new Map();
        map.set('images', this.imagesSheet);
        this.sheetUser = new SheetsUser(auth, map);
        
        this.helpEmbed = {
            title: `Help - Test Bot`,
            description: `A test module for dev purposes. tl;dr nerd shtuf.`,
            fields: []
        }

        this.commands = [
            {
                name: "Ping",
                description: "Pong!",
                parameters: [],
                callback: () => {
                    return "Pong!";
                },
                available: (guild) => {
                    return true;
                }
            },
            {
                name: "Pingeth",
                description: "Pongeth!",
                parameters: [],
                callback: () => {
                    return "Pongeth!";
                },
                available: (guild) => {
                    return true;
                }
            },
            {
                name: "Say",
                description: "Say a given phrase",
                parameters: [
                    {
                        name: "Phrase",
                        description: "The given phrase",
                        required: true,
                        type: "string"
                    }
                ],
                callback: (phrase: string) => {
                    return phrase;
                },
                available: (guild) => {
                    return guild.id === "832413831845249075"
                }
            },
            {
                name: "Embed",
                description: "Embed testing",
                parameters: [],
                callback: () => {
                    // let embed = new Discord.MessageEmbed();
                    
                    return {
                        embed: {
                            description: "This is a test.",
                            color: 1111111
                        }
                    }
                },
                available: () => true
            },
            {
                name: "ImageTest",
                description: "Image testing",
                parameters: [],
                slashCallback: async (invoke, channel, user) => {
                    // let embed = new Discord.MessageEmbed();
                    await invoke("Processing...");

                    const a = new Discord.MessageAttachment(`./testing/DOG.jpg`);
                    await channel.send(a);
                    // invoke({
                    //     content: "Test",
                    //     files: a
                    // })
                },
                regularCallback: async (message) => {
                    await message.channel.send("Processing...");
                    const a = new Discord.MessageAttachment(`./testing/DOG.jpg`);
                    await message.channel.send(a);
                },
                available: () => true
            }
        ]
    }
    
    available(message: Discord.Message): boolean {
        return false;
    }

    helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

    async onMessage(message: Discord.Message): Promise<void> {
        
        // console.log(PROCESS(message));
        
    }

    async onConstruct(): Promise<void> {

        // const fpbg = await this.client.guilds.fetch("748669830244073533");
        // let allemotes = [...fpbg.emojis.cache.values()].filter(emote => !emote.animated).slice(40,50);

        // const announce = await this.client.channels.fetch("751552954518994965");
        // if(announce instanceof Discord.TextChannel) {
            // let msg = await announce.send(`${allemotes.map(emote => `<:${emote.name}:${emote.id}>`).join(" ")}`);
            // for(const emote of allemotes) {
            //     msg.react(emote.id);
            // }
            // await announce.send(`It is with great sadness that I must announce the recent passing of 23 emotes, all of which received 2 or less votes on the previous poll. Their reactions have been removed out of respect for their legacy. Tragically, these 23 emotes will not be the last. This is the purge part 2, and I sadly do not doubt the existence of a part 3. REACT WITH ANY EMOTE THAT YOU WANT TO STAY. Reacting with all emotes is equivalent to doing nothing.`)
            // await announce.send("Voting concludes Monday 5pm PST promptly.")
        // }

        // const getapp = (guildID) => {
        //     //@ts-ignore
        //     const app = this.client.api.applications(this.client.user.id);
        //     if(guildID) {
        //         app.guilds(guildID);
        //     }
        //     return app;
        // }
        // // @ts-ignore
        // // const commands = await this.client.api.applications(this.client.user.id).guilds("832413831845249075").commands;

        // await getapp("748669830244073533").commands.post({
        //     data: {
        //         name: "ping",
        //         description: "haha brr",
        //         options: [
        //             {
        //                 name: "haha",
        //                 description: "brr",
        //                 required: false,
        //                 type: 3
        //             }
        //         ]
        //     }
        // });

        // console.log(await getapp("748669830244073533").commands.get());


        // // @ts-ignore
        // this.client.ws.on("INTERACTION_CREATE", async (interaction) => {
        //     const command = interaction.data.name.toLowerCase();
        //     console.log(command);

        //     if(command === "ping") {
        //         // @ts-ignore
        //         this.client.api.interactions(interaction.id, interaction.token).callback.post({
        //             data: {
        //                 type: 4,
        //                 data: {
        //                     content: "pong"
        //                 }
        //             }
        //         })
        //     }
        // })
    }

    

}
