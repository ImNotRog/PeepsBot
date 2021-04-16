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
                callback: (phrase) => {
                    return phrase;
                },
                available: (guild) => {
                    return guild.id === "832413831845249075";
                }
            }
        ];
    }
    available(message) {
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
            //     // let msg = await announce.send(`${allemotes.map(emote => `<:${emote.name}:${emote.id}>`).join(" ")}`);
            //     // for(const emote of allemotes) {
            //         // msg.react(emote.id);
            //     // }
            //     await announce.send("Voting concludes Friday 5pm PST promptly.")
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
