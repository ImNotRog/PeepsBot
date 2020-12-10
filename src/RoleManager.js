
const { timingSafeEqual } = require("crypto");
const Discord = require("discord.js");
const { Utilities } = require("./Utilities")

class RoleManagerBot {
    /**
     * @constructor
     * @param {Discord.Client} client 
     */
    constructor(client) {
        this.client = client;
        this.utilities = new Utilities();

        this.approvedChannels = ["750804960333135914","748670606085587060"];

        this.client.on("message", (message) => {
            if(this.approvedChannels.includes(message.channel.id)) {
                this.onMessage(message);
            }
        })
        
        this.client.on("messageReactionAdd", (reaction,user) => {
            this.onReactAdd(reaction,user)
        })

        this.client.on("messageReactionRemove", (reaction, user) => {
            this.onReactRemove(reaction, user)
        })
    }

    capitalize(str) {
        let words = str.split(" ");
        for (let i = 0; i < words.length; i++) {
            words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        }
        return words.join(" ");
    }

    async onConstruct() {
        let server = this.client.guilds.cache.get("748669830244073533");
        this.server = server;
        await (server.roles.fetch());
        this.roles = server.roles.cache;

        this.roles.sort( (a,b) => b.position - a.position );

        this.colorroles = this.roles.filter((role) => role.color !== 0);

        this.alpha = `🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇲 🇳 🇴 🇵`.split(` `);

        this.colorroles1 = [ ...this.colorroles ].slice(0, this.colorroles.keyArray().length - 6).map((stuff) => stuff[1]);
        this.colorroles2 = [ ...this.colorroles].slice(this.colorroles.keyArray().length - 6).map((stuff) => stuff[1]);


        let channel = await this.client.channels.fetch("750186607352479755");
        await channel.messages.fetch("786059131806023742");
        await channel.messages.fetch("786061717108293714")
    }

    /**
     *
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     */
    async onReactAdd(reaction,user) {

        if (reaction.message.id === "786059131806023742") {
            let num = this.alpha.indexOf(reaction.emoji.name);
            let member = await this.server.members.fetch( user );
            member.roles.add(this.colorroles1[num]);
        } else if (reaction.message.id === "786061717108293714") {
            let num = this.alpha.indexOf(reaction.emoji.name);
            let member = await this.server.members.fetch(user);
            member.roles.add(this.colorroles2[num]);
        }

    }

    /**
     *
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     */
    async onReactRemove(reaction, user) {

        if (reaction.message.id === "786059131806023742") {
            let num = this.alpha.indexOf(reaction.emoji.name);
            let member = await this.server.members.fetch(user);
            member.roles.remove(this.colorroles1[num]);
        } else if (reaction.message.id === "786061717108293714") {
            let num = this.alpha.indexOf(reaction.emoji.name);
            let member = await this.server.members.fetch(user);
            member.roles.remove(this.colorroles2[num]);
        }

    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async onRole(message) {

        if (!this.approvedChannels.includes(message.channel.id)) return;

        let roleval = "";
        let counter = 0;
        let keys = [];
        for(const key of this.colorroles.keys()) {
            keys.push(key);
            let role = this.colorroles.get(key);
            counter++;
            roleval += `${counter}: <@&${role.id}>\n`;
        }
        let sent = await message.channel.send( {
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

    /**
     *
     * @param {Discord.Message} message
     */
    async onMessage(msg) {

        let keys = this.colorroles.keyArray();

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

        if (num > keys.length) {
            return;
        }
        let role = this.colorroles.get(keys[num - 1]);

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

module.exports = { RoleManagerBot };