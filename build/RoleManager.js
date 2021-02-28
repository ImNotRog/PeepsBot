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
exports.RoleManagerBot = void 0;
const Discord = require("discord.js");
const ProcessMessage_1 = require("./ProcessMessage");
const Utilities_1 = require("./Utilities");
class RoleManagerBot {
    constructor(client) {
        this.approvedChannels = ["750804960333135914", "748670606085587060"];
        this.fperbio = "748669830244073533";
        this.entrancechannel = "750186607352479755";
        this.messageids = ["815007707467612221", "815007708528377867"];
        this.numvotes = 3;
        this.prefix = `--`;
        this.alpha = `🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇲 🇳 🇴 🇵 🇶 🇷`.split(` `);
        this.client = client;
        this.client.on("messageReactionAdd", (reaction, user) => {
            if (user instanceof Discord.User && user.id !== this.client.user.id) {
                this.onReactAdd(reaction, user);
            }
        });
        this.client.on("messageReactionRemove", (reaction, user) => {
            if (user instanceof Discord.User && user.id !== this.client.user.id) {
                this.onReactRemove(reaction, user);
            }
        });
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
        };
    }
    available(message) {
        return message.guild.id === '748669830244073533';
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.approvedChannels.includes(message.channel.id)) {
                this.parseCommand(message);
            }
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
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
                if (result.command === "cacheroles") {
                    this.cacheRoles();
                }
            }
        });
    }
    capitalize(str) {
        let words = str.split(" ");
        for (let i = 0; i < words.length; i++) {
            words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        }
        return words.join(" ");
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            let server = this.client.guilds.cache.get(this.fperbio);
            this.server = server;
            let channel = yield this.client.channels.fetch(this.entrancechannel);
            if (channel instanceof Discord.TextChannel) {
                this.messages = [];
                for (const messageid of this.messageids) {
                    this.messages.push(yield channel.messages.fetch(messageid));
                }
            }
            yield this.cacheRoles();
        });
    }
    cacheRoles() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (this.server.roles.fetch());
            this.roles = this.server.roles.cache;
            this.roles.sort((a, b) => b.position - a.position);
            this.colorroles = this.roles.filter((role) => role.color !== 0 && !role.name.toLowerCase().includes("booster")).array();
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
                let newparts = parts.map((value, index) => { return { name: `Column ${index + 1}`, inline: true, value: value.join("\n") }; });
                let alphalength = this.roledivs[i].length;
                for (let j = 0; j < alphalength; j++) {
                    this.messages[i].react(this.alpha[j]);
                }
                this.messages[i].edit('', {
                    embed: {
                        title: `React for Roles`,
                        color: '#fffffe',
                        fields: newparts
                    }
                });
            }
        });
    }
    addRole(message, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.length >= 2) {
                let rolemanager = this.server.roles;
                let accepted = `abcdef0123456789`;
                if (args[1].startsWith("#") && [...args[1].slice(1)].every((char) => accepted.includes(char))) {
                    let created = yield Utilities_1.Utilities.sendEmoteCollector(message, (bool) => {
                        return {
                            title: `Create${bool ? 'd' : ''} Role ${args[0]}`,
                            description: `Vote down below. You need net 3 votes to create this role.`,
                            color: args[1]
                        };
                    }, this.numvotes, 60 * 1000 * 2);
                    if (created) {
                        //valid color
                        yield rolemanager.create({
                            data: {
                                name: args[0],
                                color: args[1],
                                position: this.colorroles[this.colorroles.length - 1].position
                            }
                        });
                        yield this.cacheRoles();
                    }
                }
            }
        });
    }
    deleteRole(message, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.length >= 1) {
                let name = args[0];
                let todelete;
                for (const role of this.colorroles) {
                    if (role.name === name) {
                        todelete = role;
                    }
                }
                if (todelete) {
                    let deleted = yield Utilities_1.Utilities.sendEmoteCollector(message, (bool) => {
                        return {
                            title: `Delete${bool ? 'd' : ''} Role ${args[0]}`,
                            description: `Vote down below. You need net 3 votes to delete this role.`,
                            color: todelete.color
                        };
                    }, this.numvotes, 60 * 1000 * 2);
                    if (deleted) {
                        yield todelete.delete();
                        yield this.cacheRoles();
                    }
                }
            }
        });
    }
    editRole(message, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.length >= 3) {
                let name = args[0];
                let toedit;
                for (const role of this.colorroles) {
                    if (role.name === name) {
                        toedit = role;
                    }
                }
                if (toedit) {
                    if (args[1] === "color") {
                        let accepted = `abcdef0123456789`;
                        if (args[2].startsWith("#") && [...args[2].slice(1)].every((char) => accepted.includes(char))) {
                            let edited = yield Utilities_1.Utilities.sendEmoteCollector(message, (bool) => {
                                return {
                                    title: `Edit${bool ? 'ed' : ''} Role ${args[0]}'s Color to ${args[2]}`,
                                    description: `Vote down below. You need net 3 votes to edit this role.`,
                                    color: args[2]
                                };
                            }, this.numvotes, 60 * 1000 * 2);
                            if (edited) {
                                yield toedit.edit({
                                    color: args[2]
                                });
                                yield this.cacheRoles();
                            }
                        }
                    }
                    else if (args[1] === "name") {
                        let edited = yield Utilities_1.Utilities.sendEmoteCollector(message, (bool) => {
                            return {
                                title: `Edit${bool ? 'ed' : ''} Role ${args[0]}'s name to ${args[2]}`,
                                description: `Vote down below. You need net 3 votes to edit this role.`,
                                color: toedit.color
                            };
                        }, this.numvotes, 60 * 1000 * 2);
                        if (edited) {
                            yield toedit.edit({
                                name: args[2]
                            });
                            yield this.cacheRoles();
                        }
                    }
                }
            }
        });
    }
    onReactAdd(reaction, user) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < this.messageids.length; i++) {
                let messageid = this.messageids[i];
                if (reaction.message.id === messageid) {
                    let num = this.alpha.indexOf(reaction.emoji.name);
                    let member = yield this.server.members.fetch(user);
                    member.roles.add(this.roledivs[i][num]);
                }
            }
        });
    }
    onReactRemove(reaction, user) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < this.messageids.length; i++) {
                let messageid = this.messageids[i];
                if (reaction.message.id === messageid) {
                    let num = this.alpha.indexOf(reaction.emoji.name);
                    let member = yield this.server.members.fetch(user);
                    if (num === -1)
                        return;
                    member.roles.remove(this.roledivs[i][num]);
                }
            }
        });
    }
    onRole(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.approvedChannels.includes(message.channel.id))
                return;
            let roleval = "";
            let counter = 0;
            for (const role of this.colorroles) {
                counter++;
                roleval += `${counter}: <@&${role.id}>\n`;
            }
            yield message.channel.send({
                embed: {
                    title: `Roles`,
                    description: [
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
        });
    }
    parseCommand(msg) {
        return __awaiter(this, void 0, void 0, function* () {
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
            }
            ;
            if (num > this.colorroles.length) {
                return;
            }
            let role = this.colorroles[num - 1];
            if (content.startsWith("+")) {
                member.roles.add(role);
                yield msg.channel.send({
                    embed: {
                        description: `Added role <@&${role.id}> to <@${member.id}>!`,
                        color: role.color
                    }
                });
            }
            else {
                member.roles.remove(role);
                yield msg.channel.send({
                    embed: {
                        description: `Removed role <@&${role.id}> from <@${member.id}>!`,
                        color: role.color
                    }
                });
            }
        });
    }
}
exports.RoleManagerBot = RoleManagerBot;
