import * as Discord from "discord.js";
import { Command, Module } from "./Module";
import { PROCESS } from "./ProcessMessage";
import { ProcessorBot } from "./ProcessorBot";
import { Utilities } from "./Utilities"

export class HelpBot implements Module {
    public name = "Help Bot";

    public helpTechnicalEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };
    private readonly prefix = "--";

    public helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };
    public helpGeneralEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };
    // private modules: Module[];
    private client: Discord.Client;
    public parent: ProcessorBot;

    public commands: Command[];

    constructor(client:Discord.Client) {
        this.client = client;
        // this.modules = modules.map(a => a);

        this.helpEmbed = {
            title: `Help`,
            description: [
                `Send the numbers of any modules you would like the commands for, like 1, or 2.`,
                `Moreover, you can type any command name to obtain more detailed information about it,`,
                `but once you are done, remember to type "end", so that other modules can use DMs.`,
                `Finally, if you forgot anything, just type "help" to see this message again.`
            ].join(` `),
            fields: [{
                name: "Commands",
                value: `# - Type in any number for module help\nSomeCommandName - Get help on a specific command\nhelp - resend this message\nend - end the session`
            }]
        }

        this.helpGeneralEmbed = {
            title: "Help - General",
            description: [
                `Peepsbot is a Discord Bot owned by Rog. I do a lot of really random things, from quotes to carrots,`,
                `but I was really only made for the FPBG server, if you know what that is. Functionality might be limited on other servers,`,
                `but I *am* trying to extend functionality to other servers, so be on the lookout for that. Development is ongoing and`,
                `does not look like it will stop soon, so Peepsbot is constantly a WIP.`
            ].join(` `),
            fields: []
        }

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
        }

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
        ]
    }
    
    async onMessage(message: Discord.Message): Promise<void> {
        if(message.author.bot) return;
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
                    color: 1111111
                }
            })
        }

    }

    async DMHelp(user:Discord.User, guild: Discord.Guild) {

        if(this.parent.DMSessions.has(user.id)) {
            user.dmChannel.send({
                embed: {
                    description: `The module ${this.parent.DMSessions.get(user.id)} is already using this DM-Channel. Resolve that interaction first by continuining with the process or by sending "end".`,
                    color: 1111111
                }
            })
            return;
        }

        this.parent.DMSessions.set(user.id, this.name);

        let availableModules = this.parent.modules.filter(module => module.available && module.available(guild) && module.helpEmbed && module.name !== this.name);
        let availableCommands = this.parent.commands.filter(command => command.available && command.available(guild));

        // if (user.dmChannel == null) {
        //     await user.createDM();
        // }

        let sendHelp = async () => {
            await user.send({
                embed: {
                    ...this.helpEmbed,
                    fields: [...this.helpEmbed.fields, {
                        name: "Modules",
                        value: `1: General\n${availableModules.map((m, i) => {
                            return `${i + 2}: ${m.name}`
                        }).join('\n')}\n${availableModules.length+2}: Technical Details`
                    }],
                    color: 1111111
                }
            })
        }

        await sendHelp();

        let parametersToString = (c: Command) => c.parameters.map(param => param.required ? `[**${param.name}**]` : `[Optional: **${param.name}**]`).join(' ')

        while(true) {
            let a: Discord.Collection<string, Discord.Message>;
            try {
                a = await user.dmChannel.awaitMessages((message: Discord.Message) => {
                    return !message.author.bot;
                }, { max: 1, time: 1000 * 60 * 10, errors: ['time'] });
            } catch(err) {
                await user.send({
                    embed: {
                        description: "The help session timed out. To restart it, run /help or --help in a server.",
                        color: 1111111
                    }
                })
                break;
            }
            

            let message = a.first();
            if(!isNaN(parseInt(message.content))) {
                let num = parseInt(message.content);
                if(!(num >= 1 && num <= availableModules.length+2)) {
                    await user.send({
                        embed: {
                            description: `Invalid module number! Please send a number between 1 and ${availableModules.length}.`,
                            color: 1111111
                        }
                    })
                } else if(num === 1) {
                    await user.send({
                        embed: {
                            ...this.helpGeneralEmbed,
                            color: 1111111
                        }
                    })
                } else if (num === availableModules.length + 2) {
                    await user.send({
                        embed: {
                            ...this.helpTechnicalEmbed,
                            color: 1111111
                        } 
                    })
                } else {
                    // @TODO 
                    let availableModuleCommands = availableModules[num - 2].commands.filter(command => command.available && command.available(guild));
                    let embed = availableModules[num - 2].helpEmbed;
                    await user.send({
                        embed: {
                            ...embed,
                            fields: [
                                ...embed.fields,
                                ...availableModuleCommands.map(command => {
                                    return {
                                        name: `${this.prefix}${command.name} ${parametersToString(command)}`,
                                        value: `${command.description}`
                                    }
                                })
                            ],
                            color: 1111111
                        }
                    });
                }
            } else {
                if(message.content.toLowerCase() === "help") {
                    await sendHelp();
                } else if(message.content.toLowerCase() === "end") {
                    await user.send({
                        embed: {
                            description: "Session ended! To restart it, run /help or --help in a server.",
                            color: 1111111
                        }
                    })
                    break;
                } else {
                    let command = availableCommands.find(command => command.name.toLowerCase() === message.content.toLowerCase());
                    if(command) {
                        await user.send({
                            embed: {
                                title: `Help - Command ${command.name}`,
                                description: `Description: ${command.description}\n\nSyntax:\n${this.prefix}${command.name} ${parametersToString(command)}${"textOnly" in command ? "" : `\n/${command.name} ${parametersToString(command)}`}`,
                                fields: [
                                    ...command.parameters.map((value) => {
                                        return {
                                            name: `${value.name}`,
                                            value: `Description: ${value.description}\nType: ${value.type}\nRequired: ${value.required}`
                                        }
                                    }),
                                    {
                                        name: `Slash Commands`,
                                        value: `${"textOnly" in command ? "**Not** enabled for this command." : "Enabled"}`
                                    }
                                ],
                                color: 1111111
                            }
                        })
                    } else {
                        await user.send({
                            embed: {
                                description: `I don't understand what you were trying to say. Send "help" if you're confused.`,
                                color: 1111111
                            }
                        })
                    }
                }
            }
        }
        
        this.parent.DMSessions.delete(user.id);
        
    }

    async onConstruct(): Promise<void> {
        
        this.client.user.setPresence({
            status: 'online',
            activity: {
                name: '--help',
                type: 'LISTENING'
            }
        })

    }

    available(): boolean {
        return true;
    }

}