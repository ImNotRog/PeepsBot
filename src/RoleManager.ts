

import Discord = require("discord.js");
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";
import { Utilities } from "./Utilities";

export class RoleManagerBot implements Module {

    private client:Discord.Client;
    private utilities: Utilities;
    private readonly approvedChannels = ["750804960333135914", "748670606085587060"];
    private readonly fperbio = "748669830244073533";
    private readonly entrancechannel = "750186607352479755";
    private readonly messageids = ["786059131806023742", "786061717108293714"];
    private numvotes = 3;
    private prefix = `--`;
    public helpEmbed: Object;
    private server:Discord.Guild;
    private messages:Discord.Message[];
    private readonly alpha = `🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇲 🇳 🇴 🇵`.split(` `);
    private roles: Discord.Collection<string, Discord.Role>;
    private colorroles: Discord.Role[];
    private roledivs: Discord.Role[][];

    constructor(client: Discord.Client) {
        this.client = client;
        this.utilities = new Utilities();

        this.client.on("messageReactionAdd", (reaction,user) => {
            if(user instanceof Discord.User) {
                this.onReactAdd(reaction, user)
            }
        })

        this.client.on("messageReactionRemove", (reaction, user) => {
            if (user instanceof Discord.User) {
                this.onReactRemove(reaction, user)
            }
        })

        this.helpEmbed = {
            title: `Help - Roles Bot`,
            description: [
                `Roles Bot helps manage the roles of the FPERBIO server.`,
            ].join(` `),
            fields: [
                {
                    name: `${this.prefix}addrole [role name] [role color, in hexcode]`,
                    value: `Adds the role when 3 votes are reached. Will be ignored if the role color is not hexcode, e.g. #ff0000.`
                },
                {
                    name: `${this.prefix}deleterole [role name]`,
                    value: `Deletes the role when 3 votes are reached. Role names are case sensitive.`
                },
                {
                    name: `${this.prefix}editrole [role name] color [role color, in hexcode]`,
                    value: `Edits the role's color. Again, must be in hexcode, e.g. #ff0000`
                },
                {
                    name: `${this.prefix}editrole [role name] name [new role name]`,
                    value: `Edits the role's name.`
                },
            ]
        }
    }
    async onMessage(message: Discord.Message): Promise<void> {

        if (this.approvedChannels.includes(message.channel.id)) {
            this.parseCommand(message);
        }

        const result = PROCESS(message);
        if(result) {
            if (result.command === "role" || result.command === "roles") {
                this.onRole(message);
            }
            if (result.command === "addrole") {
                this.addRole(message, result.args);
            }
            if (result.command === "deleterole") {
                this.deleteRole(message, result.args);
            }
            if (result.command === "editrole") {
                this.editRole(message, result.args);
            }
            if (result.command === "recacheroles") {
                this.cacheRoles();
            }
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

        this.colorroles = this.roles.filter((role) => role.color !== 0).array();

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

            // @ts-ignore
            parts = parts.map((value, index) => { return { name: `Column ${index + 1}`, inline: true, value: value.join("\n") } });
            this.messages[i].edit({
                embed: {
                    title: `React for Roles`,
                    color: '#fffffe',
                    fields: parts
                }
            })
        }

    }
    
    async addRole(message: Discord.Message,args: string[]) {
        if(args.length >= 2) {

            let rolemanager = this.server.roles;

            let accepted = `abcdef0123456789`;
            if( args[1].startsWith("#") && [...args[1].slice(1)].every((char) => accepted.includes(char))) {

                let created = await this.utilities.sendEmoteCollector(message, (bool) => {
                    return {
                        title: `Create${bool ? 'd' : ''} Role ${args[0]}`,
                        description: `Vote down below. You need net 3 votes to create this role.`,
                        color: args[1]
                    }
                },this.numvotes,60*1000*2)

                if(created) {
                    //valid color
                    await rolemanager.create({
                        data: {
                            name: args[0],
                            color: args[1],
                            position: this.colorroles[this.colorroles.length - 1].position
                        }
                    })

                    await this.cacheRoles();
                }
            }
        }
    }

    async deleteRole(message,args) {
        if (args.length >= 1) { 

            let name = args[0];
            let todelete: Discord.Role;
            for(const role of this.colorroles) {
                if( role.name === name ) {
                    todelete = role;
                }
            }

            if(todelete) {
                let deleted = await this.utilities.sendEmoteCollector(message, (bool) => {
                    return {
                        title: `Delete${bool ? 'd' : ''} Role ${args[0]}`,
                        description: `Vote down below. You need net 3 votes to delete this role.`,
                        color: todelete.color
                    }
                }, this.numvotes, 60 * 1000 * 2)

                if(deleted) {
                    await todelete.delete();

                    await this.cacheRoles();
                }

            }
        }
    }

    async editRole(message,args) {
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

                        let edited = await this.utilities.sendEmoteCollector(message, (bool) => {
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

                    let edited = await this.utilities.sendEmoteCollector(message, (bool) => {
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
                }

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
                member.roles.remove(this.roledivs[i][num]);
            }
        }

    }

    async onRole(message: Discord.Message) {

        if (!this.approvedChannels.includes(message.channel.id)) return;

        let roleval = "";
        let counter = 0;
        for(const role of this.colorroles) {
            counter++;
            roleval += `${counter}: <@&${role.id}>\n`;
        }

        await message.channel.send( {
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
