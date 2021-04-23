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
exports.HelpBot = void 0;
class HelpBot {
    constructor(client) {
        this.name = "Help Bot";
        this.prefix = "--";
        this.client = client;
        // this.modules = modules.map(a => a);
        this.helpEmbed = {
            title: `Help - General`,
            description: [
                `Send the numbers of any modules you would like the commands for, like 1, or 2.`,
                `Moreover, you can type any command name to obtain more detailed information about it.`,
                `Finally, once you are done, remember to type "end", so that other modules can use DMs.`
            ].join(` `),
            fields: [{
                    name: "Commands",
                    value: `# - Type in any number for module help\n[Some Command Name] - Get help on a specific command\nend - end the session`
                }]
        };
        this.helpTechnicalEmbed = {
            title: `Help - Details for Nerds`,
            description: `If you're a CS nerd, here's all you need to know.`,
            fields: [
                {
                    name: `Contact Me!`,
                    value: `Rog#2597 is the owner of this bot. Contact him to add to your server or sign channels up for alerts.`
                },
                {
                    name: `Invite Link`,
                    value: `Not available, ask Rog#2597 for one. This is a mainly private bot.`
                },
                {
                    name: `Github`,
                    value: `All my code is on Github: https://github.com/BubbyBabur/PeepsBot`
                },
                {
                    name: `NodeJS`,
                    value: [
                        `Built using NodeJS, and if you use any other language, I *will* block you.`,
                        `Node Packages can be found in the Github.`,
                        `I use Heroku to host the bot and use Firebase's Firestore service to store data. It's a straight pain in the butt, but it gets the job done.`,
                        `I also use Google API to store some data in Google spreadsheets, which is sick.`
                    ].join(`\n`)
                },
            ]
        };
        this.commands = [
            {
                name: "Help",
                description: "AAAAAAAAAAAA",
                available: () => true,
                parameters: [
                    {
                        name: "Command",
                        description: "Command to get detailed help on.",
                        required: false,
                        type: "string"
                    }
                ],
                slashCallback: (invoke, channel, user) => {
                    this.DMHelp(user, channel.guild);
                    invoke("Help is on its way.");
                    // user.dmChannel.send()
                },
                regularCallback: (message) => {
                    this.DMHelp(message.author, message.guild);
                    message.channel.send("Help is on its way.");
                }
            }
        ];
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.author.bot)
                return;
            if (message.content.includes("<@!750573267026182185>")) {
                message.channel.send({
                    embed: {
                        description: `Use /help for help.`,
                        fields: [
                            {
                                name: 'Latency',
                                value: `${Date.now() - message.createdTimestamp}ms`
                            }
                        ],
                        // ...Utilities.embedInfo(message)
                        color: 1111111
                    }
                });
            }
            // const result = PROCESS(message);
            // if(result && result.command === 'help') {
            //     let embeds = [];
            //     embeds.push(this.helpEmbed);
            //     for (let i = 0; i < this.modules.length; i++) {
            //         const module = this.modules[i];
            //         if(module.available(message) && module.helpEmbed) {
            //             embeds.push(module.helpEmbed);
            //         }
            //     }
            //     embeds.push(this.helpTechnicalEmbed);
            //     await Utilities.sendCarousel(message, embeds);
            // }
        });
    }
    DMHelp(user, guild) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.parent.DMSessions.has(user.id)) {
                user.dmChannel.send({
                    embed: {
                        description: `The module ${this.parent.DMSessions.get(user.id)} is already using this DM-Channel. Resolve that interaction first by continuining with the process or by sending "end".`,
                        color: 1111111
                    }
                });
                return;
            }
            this.parent.DMSessions.set(user.id, this.name);
            let availableModules = this.parent.modules.filter(module => module.available && module.available(guild) && module.helpEmbed);
            if (user.dmChannel == null) {
                yield user.createDM();
            }
            user.dmChannel.send({
                embed: Object.assign(Object.assign({}, this.helpEmbed), { fields: [...this.helpEmbed.fields, {
                            name: "Modules",
                            value: `${availableModules.map((m, i) => {
                                return `${i + 1}: ${m.name}`;
                            }).join('\n')}`
                        }], color: 1111111 })
            });
            // let embeds = [];
            // embeds.push(this.helpEmbed);
            // console.log(guild.id);
            // for(let i = 0; i < this.parent.modules.length; i++) {
            //     const module = this.parent.modules[i];
            //     if(module.available(guild) && module.helpEmbed) {
            //         embeds.push({
            //             ...module.helpEmbed,
            //             // fields: [...module.helpEmbed.fields]
            //         })
            //     }
            // }
            // for (let i = 0; i < this.modules.length; i++) {
            // const module = this.modules[i];
            // if(module.available(message) && module.helpEmbed) {
            //     embeds.push(module.helpEmbed);
            // }
            // }
            // embeds.push(this.helpTechnicalEmbed);
            // if(user.dmChannel == null) {
            //     await user.createDM();
            // }
            // await Utilities.dmCarousel(user, embeds);
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client.user.setPresence({
                status: 'online',
                activity: {
                    name: '--help',
                    type: 'LISTENING'
                }
            });
        });
    }
    available() {
        return true;
    }
}
exports.HelpBot = HelpBot;
