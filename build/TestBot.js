"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestBot = void 0;
const DriveUser_1 = require("./DriveUser");
const SheetsUser_1 = require("./SheetsUser");
class TestBot {
    constructor(auth, client) {
        this.prefix = "--";
        this.imagesFolder = '1Bil_W-7kd43marLiwlL6nZ7nEZAUzKQ2';
        this.imagesSheet = '17iYieSC2zDKpxgSPqhk6fcJZQjVBvJFE5S5KS1IcON8';
        this.jackChannels = ['809143110302826497'];
        this.client = client;
        this.driveUser = new DriveUser_1.DriveUser(auth);
        let map = new Map();
        map.set('images', this.imagesSheet);
        this.sheetUser = new SheetsUser_1.SheetsUser(auth, map);
        this.helpEmbed = {
            title: `Help - Test Bot`,
            description: `A test module for dev purposes. tl;dr nerd shtuf.`,
            fields: []
        };
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
                callback: (phrase) => {
                    return phrase;
                    // return "No.";
                },
                available: (guild) => {
                    return guild && guild.id === "832413831845249075";
                }
            },
            /*{
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
            } */
        ];
    }
    available(guild) {
        return false;
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log(PROCESS(message));
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
exports.TestBot = TestBot;
