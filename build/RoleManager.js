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
const Utilities_1 = require("./Utilities");
class RoleManagerBot {
    constructor(client) {
        this.name = "Role Manager Bot";
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
            fields: []
        };
        this.commands = [
            {
                name: "Role",
                description: "Obtain cool and hip gamer roles on the FPBG server",
                available: (guild) => guild.id === this.fperbio,
                parameters: [],
                slashCallback: (invoke, channel) => __awaiter(this, void 0, void 0, function* () {
                    invoke(yield this.onRole(channel));
                }),
                regularCallback: (message) => __awaiter(this, void 0, void 0, function* () {
                    message.channel.send(yield this.onRole(message.channel));
                })
            },
            {
                name: "CacheRoles",
                description: "Caches the roles (for developer purposes).",
                available: (guild) => guild.id === this.fperbio,
                parameters: [],
                textOnly: true,
                callback: (message) => __awaiter(this, void 0, void 0, function* () {
                    yield this.cacheRoles();
                    message.channel.send("Done!");
                })
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
                callback: (message, name, color) => __awaiter(this, void 0, void 0, function* () {
                    this.addRole(message.channel, name, color);
                })
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
                callback: (message, name) => __awaiter(this, void 0, void 0, function* () {
                    this.deleteRole(message.channel, name);
                })
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
                callback: (message, name, category, color) => __awaiter(this, void 0, void 0, function* () {
                    this.editRole(message.channel, [name, category, color]);
                })
            },
        ];
    }
    available(guild) {
        return guild && guild.id === '748669830244073533';
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.approvedChannels.includes(message.channel.id)) {
                this.parseCommand(message);
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
    addRole(channel, name, color) {
        return __awaiter(this, void 0, void 0, function* () {
            let rolemanager = this.server.roles;
            let accepted = `ABCDEFabcdef0123456789`;
            if (color.startsWith("#") && [...color.slice(1)].every((char) => accepted.includes(char))) {
                let created = yield Utilities_1.Utilities.sendEmoteCollector(channel, (bool) => {
                    return {
                        title: `Create${bool ? 'd' : ''} Role ${name}`,
                        description: `Vote down below. You need net 3 votes to create this role.`,
                        color
                    };
                }, this.numvotes, 60 * 1000 * 2);
                if (created) {
                    //valid color
                    yield rolemanager.create({
                        data: {
                            name,
                            color,
                            position: this.colorroles[this.colorroles.length - 1].position
                        }
                    });
                    yield this.cacheRoles();
                }
            }
        });
    }
    deleteRole(channel, name) {
        return __awaiter(this, void 0, void 0, function* () {
            let todelete;
            for (const role of this.colorroles) {
                if (role.name === name) {
                    todelete = role;
                }
            }
            if (todelete) {
                let deleted = yield Utilities_1.Utilities.sendEmoteCollector(channel, (bool) => {
                    return {
                        title: `Delete${bool ? 'd' : ''} Role ${name}`,
                        description: `Vote down below. You need net 3 votes to delete this role.`,
                        color: todelete.color
                    };
                }, this.numvotes, 60 * 1000 * 2);
                if (deleted) {
                    yield todelete.delete();
                    yield this.cacheRoles();
                }
            }
            else {
                channel.send({
                    embed: {
                        description: "Role name could not be found! Capitalization matters.",
                        color: 1111111
                    }
                });
            }
        });
    }
    // Can't be bothered to fix
    editRole(channel, args) {
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
                            let edited = yield Utilities_1.Utilities.sendEmoteCollector(channel, (bool) => {
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
                        let edited = yield Utilities_1.Utilities.sendEmoteCollector(channel, (bool) => {
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
                    else {
                        channel.send({
                            embed: {
                                description: "Invalid category! Must be 'color' or 'name'.",
                                color: 1111111
                            }
                        });
                    }
                }
                else {
                    channel.send({
                        embed: {
                            description: "Role name could not be found! Capitalization matters.",
                            color: 1111111
                        }
                    });
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
    onRole(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.approvedChannels.includes(channel.id))
                return `Please run this command in a spam channel!`;
            let roleval = "";
            let counter = 0;
            for (const role of this.colorroles) {
                counter++;
                roleval += `${counter}: <@&${role.id}>\n`;
            }
            return ({
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
