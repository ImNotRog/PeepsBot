

import Discord = require("discord.js");
import { Command, Module } from "./Module";
import { PROCESS } from "./ProcessMessage";
import { Utilities } from "./Utilities";

export class RoleManagerBot implements Module {
    public name = "Role Manager Bot";

    private client:Discord.Client;
    private readonly approvedChannels = ["750804960333135914", "748670606085587060"];
    private readonly fperbio = "748669830244073533";
    private readonly entrancechannel = "750186607352479755";
    private readonly messageids = ["815007707467612221", "815007708528377867"];
    private numvotes = 3;
    private prefix = `--`;
    private server:Discord.Guild;
    private messages:Discord.Message[];
    private readonly alpha = `🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇲 🇳 🇴 🇵 🇶 🇷`.split(` `);
    private roles: Discord.Collection<string, Discord.Role>;
    private colorroles: Discord.Role[];
    private roledivs: Discord.Role[][];
    public commands: Command[];

    public helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

    constructor(client: Discord.Client) {
        this.client = client;

        this.client.on("messageReactionAdd", (reaction,user) => {
            if(user instanceof Discord.User && user.id !== this.client.user.id) {
                this.onReactAdd(reaction, user)
            }
        })

        this.client.on("messageReactionRemove", (reaction, user) => {
            if (user instanceof Discord.User && user.id !== this.client.user.id) {
                this.onReactRemove(reaction, user)
            }
        })

        this.helpEmbed = {
            title: `Help - Roles Bot`,
            description: [
                `Roles Bot helps manage the roles of the FPERBIO server.`,
            ].join(` `),
            fields: [
                
            ]
        }


        this.commands = [
            {
                name: "Role",
                description: "Obtain cool and hip gamer roles on the FPBG server",
                available: (guild) => guild.id === this.fperbio,
                parameters: [],
                slashCallback: async (invoke, channel) => {
                    invoke(await this.onRole(channel));
                },
                regularCallback: async (message) => {
                    message.channel.send(await this.onRole(message.channel));
                }
            },
            {
                name: "CacheRoles",
                description: "Caches the roles (for developer purposes).",
                available: (guild) => guild.id === this.fperbio,
                parameters: [],
                textOnly: true,
                callback: async (message: Discord.Message) => {
                    await this.cacheRoles();
                    message.channel.send("Done!");
                }
            },
            {
                name: "AddRole",
                description: "Add a role to the FPBG server",
                available: (guild) => guild.id === this.fperbio,
                parameters: [
                    {
                        name: "Name",
                        description: "Name of the role",
                        type: "string",
                        required: true
                    },
                    {
                        name: "Color",
                        description: "Color of the role in hexcode, must be preceded by #",
                        type: "string",
                        required: true
                    }
                ],
                textOnly: true,
                callback: async (message: Discord.Message, name, color) => {
                    this.addRole(message.channel, name, color);
                }
            },
            {
                name: "DeleteRole",
                description: "Delete a role from the FPBG server",
                available: (guild) => guild.id === this.fperbio,
                parameters: [
                    {
                        name: "Name",
                        description: "Name of the role",
                        type: "string",
                        required: true
                    }
                ],
                textOnly: true,
                callback: async (message: Discord.Message, name) => {
                    this.deleteRole(message.channel, name);
                }
            },
            {
                name: "EditRole",
                description: "Edit a role from the FPBG server",
                available: (guild) => guild.id === this.fperbio,
                parameters: [
                    {
                        name: "Name",
                        description: "Name of the role",
                        type: "string",
                        required: true
                    },
                    {
                        name: "Category",
                        description: `The part that you're editing, either "color" or "name"`,
                        type: "string",
                        required: true
                    },
                    {
                        name: "NameOrColor",
                        description: "Depending on category, either name, or color.",
                        type: "string",
                        required: true
                    }
                ],
                textOnly: true,
                callback: async (message: Discord.Message, name, category, color) => {
                    this.editRole(message.channel,[name,category,color]);
                }
            },

        ]
    }

    available(guild: Discord.Guild): boolean {
        return guild && guild.id === '748669830244073533';
    }

    async onMessage(message: Discord.Message): Promise<void> {

        if (this.approvedChannels.includes(message.channel.id)) {
            this.parseCommand(message);
        }
    }

    capitalize(str) {
        let words = str.split(" ");
        for (let i = 0; i < words.length; i++) {
            words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        }
        return words.join(" ");
    }

    async onConstruct() {
        let server = this.client.guilds.cache.get(this.fperbio);
        this.server = server;

        let channel = await this.client.channels.fetch(this.entrancechannel);
        if(channel instanceof Discord.TextChannel) {
            this.messages = [];
            for (const messageid of this.messageids) {
                this.messages.push(await channel.messages.fetch(messageid));
            }

        }

        await this.cacheRoles();
    }

    async cacheRoles() {

        await (this.server.roles.fetch());

        this.roles = this.server.roles.cache;

        this.roles.sort((a, b) => b.position - a.position);

        let exceptedroles = ['booster', 'chry', 'poop', '🫂'];
        this.colorroles = this.roles.filter((role) => role.color !== 0 && exceptedroles.every(exception => !role.name.toLowerCase().includes(exception))).array();

        let i = 0;

        this.roledivs = [];
        while (i < this.colorroles.length) {
            this.roledivs.push(this.colorroles.slice(i, i + this.alpha.length));
            i += this.alpha.length;
        }

        for (let i = 0; i < this.roledivs.length; i++) {
            let currroles = this.roledivs[i].map((role, index) => ` ${this.alpha[index]}: <@&${role.id}>`);
            let length = currroles.length;

            let cols = 3;
            let parts = Array(cols).fill(0).map((zero, index) => currroles.slice(index * length / cols, (index + 1) * length / cols));

            let newparts = parts.map((value, index) => { return { name: `Column ${index + 1}`, inline: true, value: value.join("\n") } });
            
            let alphalength = this.roledivs[i].length;

            for(let j = 0; j < alphalength; j++) {
                this.messages[i].react(this.alpha[j]);
            }

            this.messages[i].edit('', {
                embed: {
                    title: `React for Roles`,
                    color: '#fffffe',
                    fields: newparts
                }
            })
        }

    }
    
    async addRole(channel: Discord.TextChannel|Discord.NewsChannel|Discord.DMChannel, name:string,color:string) {
        
        let rolemanager = this.server.roles;

        let accepted = `ABCDEFabcdef0123456789`;
        if( color.startsWith("#") && [...color.slice(1)].every((char) => accepted.includes(char))) {

            let created = await Utilities.sendEmoteCollector(channel, (bool) => {
                return {
                    title: `Create${bool ? 'd' : ''} Role ${name}`,
                    description: `Vote down below. You need net 3 votes to create this role.`,
                    color
                }
            },this.numvotes,60*1000*2)

            if(created) {
                //valid color
                await rolemanager.create({
                    data: {
                        name,
                        color,
                        position: this.colorroles[this.colorroles.length - 1].position
                    }
                })

                await this.cacheRoles();
            }
        } 
    
    }

    async deleteRole(channel: Discord.TextChannel | Discord.NewsChannel | Discord.DMChannel,name:string) {
       
        let todelete: Discord.Role;
        for(const role of this.colorroles) {
            if( role.name === name ) {
                todelete = role;
            }
        }

        if(todelete) {
            let deleted = await Utilities.sendEmoteCollector(channel, (bool) => {
                return {
                    title: `Delete${bool ? 'd' : ''} Role ${name}`,
                    description: `Vote down below. You need net 3 votes to delete this role.`,
                    color: todelete.color
                }
            }, this.numvotes, 60 * 1000 * 2)

            if(deleted) {
                await todelete.delete();

                await this.cacheRoles();
            }

        } else {
            channel.send({
                embed: {
                    description: "Role name could not be found! Capitalization matters.",
                    color: 1111111
                }
            })
        }
    
    }
    
    // Can't be bothered to fix
    async editRole(channel: Discord.TextChannel|Discord.NewsChannel|Discord.DMChannel,args) {
        if (args.length >= 3) {

            let name = args[0];
            let toedit: Discord.Role;
            for (const role of this.colorroles) {
                if (role.name === name) {
                    toedit = role;
                }
            }

            if (toedit) {

                if (args[1] === "color") {

                    let accepted = `abcdef0123456789`;
                    if (args[2].startsWith("#") && [...args[2].slice(1)].every((char) => accepted.includes(char))) {

                        let edited = await Utilities.sendEmoteCollector(channel, (bool) => {
                            return {
                                title: `Edit${bool ? 'ed' : ''} Role ${args[0]}'s Color to ${args[2]}`,
                                description: `Vote down below. You need net 3 votes to edit this role.`,
                                color: args[2]
                            }
                        }, this.numvotes, 60 * 1000 * 2)

                        if (edited) {
                            await toedit.edit({
                                color: args[2]
                            })

                            await this.cacheRoles();
                        }

                    }
                } else if(args[1] === "name") {

                    let edited = await Utilities.sendEmoteCollector(channel, (bool) => {
                        return {
                            title: `Edit${bool ? 'ed' : ''} Role ${args[0]}'s name to ${args[2]}`,
                            description: `Vote down below. You need net 3 votes to edit this role.`,
                            color: toedit.color
                        }
                    }, this.numvotes, 60 * 1000 * 2)

                    if (edited) {
                        await toedit.edit({
                            name: args[2]
                        });

                        await this.cacheRoles();
                    }
                } else {
                    channel.send({
                        embed: {
                            description: "Invalid category! Must be 'color' or 'name'.",
                            color: 1111111
                        }
                    })
                }

            } else {
                channel.send({
                    embed: {
                        description: "Role name could not be found! Capitalization matters.",
                        color: 1111111
                    }
                })
            }
        }
    }

    async onReactAdd(reaction: Discord.MessageReaction,user: Discord.User) {

        for(let i = 0; i < this.messageids.length; i++) {
            let messageid = this.messageids[i];
            if(reaction.message.id === messageid) {
                let num = this.alpha.indexOf(reaction.emoji.name);
                let member = await this.server.members.fetch(user);
                member.roles.add(this.roledivs[i][num]);
            }
        }

    }

    async onReactRemove(reaction: Discord.MessageReaction, user: Discord.User) {

        for (let i = 0; i < this.messageids.length; i++) {
            let messageid = this.messageids[i];
            if (reaction.message.id === messageid) {
                let num = this.alpha.indexOf(reaction.emoji.name);
                let member = await this.server.members.fetch(user);
                if(num === -1) return;
                member.roles.remove(this.roledivs[i][num]);
            }
        }

    }

    async onRole(channel: Discord.Channel) {

        if (!this.approvedChannels.includes(channel.id)) return `Please run this command in a spam channel!`;

        let roleval = "";
        let counter = 0;
        for(const role of this.colorroles) {
            counter++;
            roleval += `${counter}: <@&${role.id}>\n`;
        }

        return( {
            embed: {
                title: `Roles`,
                description: 
                [
                    `Each role has a corresponding number.`,
                    `If that number is n, type +n to receive that role.`,
                    `And type -n to remove that role. If I wanted to receive role 1,`,
                    `I'd type in +1. To remove it, I'd type -1.`,
                ].join(" "),
                fields: [
                    {
                        name: "All Roles:",
                        value: roleval
                    }
                ]
            }
        });
        
    }

    async parseCommand(msg: Discord.Message) {

        let content = msg.content;
        let member = msg.member;

        if (content.toLowerCase().indexOf(`end`) !== -1) {
            return;
        }

        if (!content.startsWith("+") && !content.startsWith("-")) {
            return;
        }

        let num = parseInt(content.slice(1));
        if (isNaN(num)) {
            return;
        };

        if (num > this.colorroles.length) {
            return;
        }
        let role = this.colorroles[num-1];

        if (content.startsWith("+")) {
            member.roles.add(role);
            await msg.channel.send({
                embed: {
                    description: `Added role <@&${role.id}> to <@${member.id}>!`,
                    color: role.color
                }
            });
        } else {
            member.roles.remove(role);
            await msg.channel.send({
                embed: {
                    description: `Removed role <@&${role.id}> from <@${member.id}>!`,
                    color: role.color
                }
            });
        }
        
    }
}
