

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

        this.fperbio = "748669830244073533";
        this.entrancechannel = "750186607352479755";
        this.messageids = ["786059131806023742","786061717108293714"];
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

        /**
         * @type {Discord.TextChannel}
         */
        let channel = await this.client.channels.fetch(this.entrancechannel);

        this.messages = [];
        for (const messageid of this.messageids) {
            this.messages.push(await channel.messages.fetch(messageid));
        }

        await this.cacheRoles();
    }

    async cacheRoles() {

        await (this.server.roles.fetch());
        this.roles = this.server.roles.cache;

        this.roles.sort((a, b) => b.position - a.position);

        this.colorroles = this.roles.filter((role) => role.color !== 0).array();

        this.alpha = `🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇲 🇳 🇴 🇵`.split(` `);

        let i = 0;

        /**
         * @type {Discord.Role[][]}
         */
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

            parts = parts.map((value, index) => { return { name: `Column ${index + 1}`, inline: true, value: value.join("\n") } });
            this.messages[i].edit({
                embed: {
                    title: `React for Roles`,
                    color: 111111,
                    fields: parts
                }
            })
        }

    }

    /**
     *
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     */
    async onReactAdd(reaction,user) {

        for(let i = 0; i < this.messageids.length; i++) {
            let messageid = this.messageids[i];
            if(reaction.message.id === messageid) {
                let num = this.alpha.indexOf(reaction.emoji.name);
                let member = await this.server.members.fetch(user);
                member.roles.add(this.roledivs[i][num]);
            }
        }

    }

    /**
     *
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     */
    async onReactRemove(reaction, user) {

        for (let i = 0; i < this.messageids.length; i++) {
            let messageid = this.messageids[i];
            if (reaction.message.id === messageid) {
                let num = this.alpha.indexOf(reaction.emoji.name);
                let member = await this.server.members.fetch(user);
                member.roles.remove(this.roledivs[i][num]);
            }
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

    /**
     *
     * @param {Discord.Message} message
     */
    async onMessage(msg) {

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

module.exports = { RoleManagerBot };