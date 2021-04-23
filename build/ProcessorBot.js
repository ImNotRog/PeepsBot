"use strict";
/**
 * @todo Node-canvas pershlaps
 */
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
exports.ProcessorBot = void 0;
const Discord = require("discord.js");
const QuotesBot_1 = require("./QuotesBot");
const GroovyTrackerBot_1 = require("./GroovyTrackerBot");
const CalBot_1 = require("./CalBot");
const ReactBot_1 = require("./ReactBot");
const NameChanger_1 = require("./NameChanger");
const RoleManager_1 = require("./RoleManager");
const ScremBot_1 = require("./ScremBot");
const SynonymBot_1 = require("./SynonymBot");
const ImageBot_1 = require("./ImageBot");
const GeckoInVC_1 = require("./GeckoInVC");
const EmoteBot_1 = require("./EmoteBot");
const PianoManBot_1 = require("./PianoManBot");
const HugBot_1 = require("./HugBot");
const TestBot_1 = require("./TestBot");
const HelpBot_1 = require("./HelpBot");
const ProcessMessage_1 = require("./ProcessMessage");
class ProcessorBot {
    constructor(auth, db, client, MW) {
        this.prefix = "--";
        // private readonly quotesActive = true;
        // private readonly trackerActive = true;
        // private readonly bdayActive = true;
        // private readonly reactActive = true;
        // private readonly nameChangerActive = true;
        // private readonly roleManagerActive = true;
        // private readonly scremActive = true;
        // private readonly synonymActive = true;
        // private readonly geckoInVCActive = true;
        // private readonly imageActive = true;
        // private readonly emojiActive = true;
        // private readonly pianoManActive = true;
        // private readonly hugActive = true;
        // private readonly testActive = true;
        // private readonly helpActive = true;
        this.quotesActive = false;
        this.trackerActive = false;
        this.bdayActive = false;
        this.reactActive = false;
        this.nameChangerActive = false;
        this.roleManagerActive = true;
        this.scremActive = false;
        this.synonymActive = false;
        this.geckoInVCActive = false;
        this.imageActive = false;
        this.emojiActive = false;
        this.pianoManActive = false;
        this.hugActive = false;
        this.testActive = false;
        this.helpActive = true;
        this.clearCommands = false;
        this.modules = [];
        if (this.quotesActive)
            this.modules.push(new QuotesBot_1.QuotesBot(auth, client));
        if (this.trackerActive)
            this.modules.push(new GroovyTrackerBot_1.TrackerBot(auth));
        if (this.bdayActive)
            this.modules.push(new CalBot_1.CalendarBot(auth, client));
        if (this.reactActive)
            this.modules.push(new ReactBot_1.ReactBot());
        if (this.nameChangerActive)
            this.modules.push(new NameChanger_1.NameChangerBot(auth, client));
        if (this.roleManagerActive)
            this.modules.push(new RoleManager_1.RoleManagerBot(client));
        if (this.scremActive)
            this.modules.push(new ScremBot_1.ScremBot(client));
        if (this.synonymActive)
            this.modules.push(new SynonymBot_1.SynonymBot(MW, client));
        if (this.geckoInVCActive)
            this.modules.push(new GeckoInVC_1.GeckoInVCBot(client));
        if (this.emojiActive)
            this.modules.push(new EmoteBot_1.EmoteBot(auth, client));
        if (this.pianoManActive)
            this.modules.push(new PianoManBot_1.PianoManBot(auth, client));
        if (this.hugActive)
            this.modules.push(new HugBot_1.HugBot());
        if (this.imageActive)
            this.modules.push(new ImageBot_1.ImageBot(auth, client));
        if (this.testActive)
            this.modules.push(new TestBot_1.TestBot(auth, client));
        if (this.helpActive)
            this.modules.push(new HelpBot_1.HelpBot(client));
        this.client = client;
        this.DMSessions = new Map();
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const mod of this.modules) {
                mod.parent = this;
            }
            let allpromises = [];
            for (const mod of this.modules) {
                if (mod.onConstruct)
                    allpromises.push(mod.onConstruct());
            }
            yield Promise.all(allpromises);
            console.log("Fetching mounted commmands...");
            this.mountedCommands = yield this.getMountedCommands();
            // console.log(this.mountedCommands);
            // Clear commands
            if (this.clearCommands) {
                console.log("Deleting slash commands...");
                yield this.deleteMountedCommandsByCondition((command, index) => true);
            }
            // console.log("deleting hug");
            // await this.deleteMountedCommandsByCondition((command, index) => command.name === "hug");
            console.log("Registering commands...");
            // Mount commands
            this.commands = this.modules.reduce((list, mod) => mod.commands ? [...list, ...mod.commands] : list, []);
            yield this.MountAllCommands();
            // Handle calls
            // @ts-ignore
            this.client.ws.on("INTERACTION_CREATE", (interaction) => __awaiter(this, void 0, void 0, function* () {
                const { name, options } = interaction.data;
                const command = name.toLowerCase();
                let c = this.commands.filter(c => !("textOnly" in c)).find(c => c.name.toLowerCase() === command);
                if (c) {
                    if ("textOnly" in c) {
                        return;
                    }
                    else if ("callback" in c) {
                        yield this.ResolveInteraction(interaction, yield c.callback(...(!options ? [] : options.map(option => option.value))));
                    }
                    else {
                        let returnchannel = this.client.channels.resolve(interaction.channel_id);
                        if (!(returnchannel instanceof Discord.TextChannel))
                            throw "Something went horribly wrong.";
                        let user = yield this.client.users.fetch(interaction.member.user.id);
                        // let member = returnchannel.guild.member(user);
                        c.slashCallback((returnval) => __awaiter(this, void 0, void 0, function* () {
                            yield this.ResolveInteraction(interaction, returnval);
                        }), returnchannel, user, ...(!options ? [] : options.map(option => option.value)));
                    }
                }
            }));
            this.client.on("message", (message) => {
                this.onMessage(message);
            });
        });
    }
    ResolveInteraction(interaction, returnval) {
        return __awaiter(this, void 0, void 0, function* () {
            let returnchannel = this.client.channels.resolve(interaction.channel_id);
            if (!(returnchannel instanceof Discord.TextChannel))
                throw "Something went horribly wrong.";
            let apimessage;
            // if (typeof returnval !== "string") throw "Something happened!";
            if (typeof returnval === "object" && "content" in returnval) {
                apimessage = Discord.APIMessage.create(returnchannel, 
                // @ts-ignore
                returnval.content);
            }
            else {
                apimessage = Discord.APIMessage.create(returnchannel, 
                // @ts-ignore
                returnval);
            }
            let adf = yield apimessage.resolveData().resolveFiles();
            let { data, files } = adf;
            // @ts-ignore
            yield this.client.api.interactions(interaction.id, interaction.token).callback.post({
                data: {
                    type: 4,
                    data: Object.assign(Object.assign({}, data), { files, allowed_mentions: { parse: [] } })
                }
            });
            if (typeof returnval === "object" && "content" in returnval) {
                returnchannel.send(returnval.files);
            }
        });
    }
    MountCommandOnServer(command, guildID) {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            yield this.client.api.applications(this.client.user.id).guilds(guildID).commands.post({
                data: {
                    name: command.name,
                    description: command.description,
                    options: command.parameters.map(parameter => {
                        return {
                            name: parameter.name,
                            description: parameter.description,
                            required: parameter.required,
                            type: parameter.type === "string" ? 3 : 4
                        };
                    })
                }
            });
        });
    }
    MountCommandsOnServer(guildID) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client.guilds.cache.has(guildID)) {
                let guild = this.client.guilds.cache.get(guildID);
                let allCommandPromises = [];
                for (const command of this.commands) {
                    if (!("textOnly" in command) && (command.available && command.available(guild))) {
                        allCommandPromises.push(this.MountCommandOnServer(command, guild.id));
                    }
                }
                yield Promise.all(allCommandPromises);
            }
            else {
                throw "Guild not found!";
            }
        });
    }
    MountCommand(command) {
        return __awaiter(this, void 0, void 0, function* () {
            if ("textOnly" in command)
                throw "Attempted to mount text-only command!";
            let allCommandPromises = [];
            for (const guild of this.client.guilds.cache.values()) {
                if ((command.available && command.available(guild))) {
                    allCommandPromises.push(this.MountCommandOnServer(command, guild.id));
                }
            }
            yield Promise.all(allCommandPromises);
        });
    }
    MountAllCommands() {
        return __awaiter(this, void 0, void 0, function* () {
            let allCommandPromises = [];
            for (const command of this.commands) {
                if (!("textOnly" in command)) {
                    allCommandPromises.push(this.MountCommand(command));
                }
            }
            yield Promise.all(allCommandPromises);
        });
    }
    deleteMountedCommand(commandObj) {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            yield this.client.api.applications(this.client.user.id).guilds(commandObj.guild_id).commands(commandObj.id).delete();
        });
    }
    deleteMountedCommandsByCondition(cond) {
        return __awaiter(this, void 0, void 0, function* () {
            let indicesToDelete = [];
            for (let index = 0; index < this.mountedCommands.length; index++) {
                if (cond(this.mountedCommands[index], index)) {
                    indicesToDelete.push(index);
                }
            }
            let allpromises = [];
            for (const index of indicesToDelete) {
                allpromises.push(this.deleteMountedCommand(this.mountedCommands[index]));
            }
            yield Promise.all(allpromises);
            let newMountedCommands = [];
            for (let i = 0; i < this.mountedCommands.length; i++) {
                if (!indicesToDelete.includes(i)) {
                    newMountedCommands.push(this.mountedCommands[i]);
                }
            }
            this.mountedCommands = newMountedCommands;
        });
    }
    getMountedCommandsOnServer(guildID) {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            return yield this.client.api.applications(this.client.user.id).guilds(guildID).commands.get();
        });
    }
    getMountedCommands() {
        return __awaiter(this, void 0, void 0, function* () {
            let allGetPromises = [];
            for (const guild of this.client.guilds.cache.values()) {
                allGetPromises.push(this.getMountedCommandsOnServer(guild.id));
            }
            let allGot = yield Promise.all(allGetPromises);
            return allGot.reduce((a, b) => [...a, ...b], []);
        });
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const mod of this.modules) {
                if (!mod.available || !mod.available(message.guild))
                    continue;
                if (mod.onMessage) {
                    try {
                        yield mod.onMessage(message);
                    }
                    catch (err) {
                        console.log("Ruh roh! Error in module " + mod);
                        console.error(err);
                        message.channel.send(`Error: ${err}. Please report to @Rog#2597. Or not, it's your choice.`, { allowedMentions: { parse: [] } });
                    }
                }
            }
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                let c = this.commands.filter(c => c.available && c.available(message.guild)).find(command => command.name.toLowerCase() === result.command.toLowerCase());
                if (c) {
                    let args = result.args;
                    let validargs = true;
                    if (!(args.length >= c.parameters.filter(a => a.required).length && args.length <= c.parameters.length))
                        validargs = false;
                    else {
                        for (let i = 0; i < c.parameters.length; i++) {
                            if (i >= args.length)
                                break;
                            if (c.parameters[i].type === "number") {
                                if (isNaN(parseInt(args[i]))) {
                                    validargs = false;
                                    break;
                                }
                            }
                        }
                    }
                    if (validargs) {
                        if ("textOnly" in c) {
                            c.callback(message, ...args);
                        }
                        else if ("callback" in c) {
                            let returnval = yield c.callback(...args);
                            if (typeof returnval === "object" && "content" in returnval) {
                                if (typeof returnval.content === "string")
                                    yield message.channel.send(returnval.content.replace(/\@/g, ''), returnval.files);
                                else
                                    yield message.channel.send(returnval.content, returnval.files);
                            }
                            else {
                                // @ts-ignore
                                yield message.channel.send(returnval, { allowedMentions: { parse: [] } });
                            }
                        }
                        else {
                            c.regularCallback(message, ...args);
                        }
                    }
                    else {
                        yield message.channel.send({
                            embed: {
                                description: `Invalid Arguments to command ${c.name}. It accepts parameters of the form: \n${this.prefix}${c.name} ${c.parameters.map(param => param.required ? `[**${param.name}**]` : `[Optional: **${param.name}]`).join(' ')}`,
                                color: 1111111
                            }
                        });
                    }
                }
            }
        });
    }
    onReaction(reaction, user) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const mod of this.modules) {
                if (!mod.available || !mod.available(reaction.message.guild))
                    continue;
                if (mod.onReaction) {
                    try {
                        yield mod.onReaction(reaction, user);
                    }
                    catch (err) {
                        console.log("Ruh roh! Error in module " + mod);
                        console.error(err);
                        reaction.message.channel.send(`Error: ${err}. Please report to @Rog#2597. Or not, it's your choice.`, { allowedMentions: { parse: [] } });
                    }
                }
            }
        });
    }
}
exports.ProcessorBot = ProcessorBot;
