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
const LittleBot_1 = require("./LittleBot");
const GroovyTrackerBot_1 = require("./GroovyTrackerBot");
const CalBot_1 = require("./CalBot");
const ReactBot_1 = require("./ReactBot");
const NameChanger_1 = require("./NameChanger");
const RoleManager_1 = require("./RoleManager");
const ScremBot_1 = require("./ScremBot");
const SynonymBot_1 = require("./SynonymBot");
const ImageBot_1 = require("./ImageBot");
const SqualolBot_1 = require("./SqualolBot");
const GeckoInVC_1 = require("./GeckoInVC");
const EmoteBot_1 = require("./EmoteBot");
const PianoManBot_1 = require("./PianoManBot");
const CipherBot_1 = require("./CipherBot");
const HugBot_1 = require("./HugBot");
const TestBot_1 = require("./TestBot");
const HelpBot_1 = require("./HelpBot");
const ProcessMessage_1 = require("./ProcessMessage");
class ProcessorBot {
    constructor(auth, db, client, MW) {
        this.prefix = "--";
        // private readonly littleActive = true;
        // private readonly trackerActive = true;
        // private readonly bdayActive = true;
        // private readonly reactActive = true;
        // private readonly nameChangerActive = true;
        // private readonly roleManagerActive = true;
        // private readonly scremActive = true;
        // private readonly synonymActive = true;
        // private readonly geckoInVCActive = true;
        // private readonly imageActive = true;
        // private readonly squalolActive = true;
        // private readonly emojiActive = true;
        // private readonly pianoManActive = true;
        // private readonly cipherActive = true;
        // private readonly hugActive = true;
        // private readonly testActive = true;
        // private readonly helpActive = true;
        this.littleActive = false;
        this.trackerActive = false;
        this.bdayActive = false;
        this.reactActive = false;
        this.nameChangerActive = false;
        this.roleManagerActive = false;
        this.scremActive = false;
        this.synonymActive = false;
        this.geckoInVCActive = false;
        this.imageActive = false;
        this.squalolActive = false;
        this.emojiActive = false;
        this.pianoManActive = false;
        this.cipherActive = false;
        this.hugActive = true;
        this.testActive = false;
        this.helpActive = false;
        this.clearCommands = false;
        this.modules = [];
        if (this.littleActive)
            this.modules.push(new LittleBot_1.LittleBot(auth, client));
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
        if (this.cipherActive)
            this.modules.push(new CipherBot_1.CipherBot(client));
        if (this.hugActive)
            this.modules.push(new HugBot_1.HugBot());
        if (this.imageActive)
            this.modules.push(new ImageBot_1.ImageBot(auth, client));
        if (this.squalolActive)
            this.modules.push(new SqualolBot_1.SqualolBot());
        if (this.testActive)
            this.modules.push(new TestBot_1.TestBot(auth, client));
        if (this.helpActive)
            this.modules.push(new HelpBot_1.HelpBot(this.modules, client));
        this.client = client;
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            let allpromises = [];
            for (const mod of this.modules) {
                if (mod.onConstruct)
                    allpromises.push(mod.onConstruct());
            }
            yield Promise.all(allpromises);
            this.client.on("message", (message) => {
                this.onMessage(message);
            });
            console.log("Fetching mounted commmands...");
            this.mountedCommands = yield this.getMountedCommands();
            console.log(this.mountedCommands);
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
            // await this.MountAllCommands();
            // Handle calls
            // @ts-ignore
            this.client.ws.on("INTERACTION_CREATE", (interaction) => __awaiter(this, void 0, void 0, function* () {
                const { name, options } = interaction.data;
                const command = name.toLowerCase();
                let c = this.commands.find(c => c.name.toLowerCase() === command);
                if (c) {
                    let returnval = c.callback(...(!options ? [] : options.map(option => option.value)));
                    if (typeof returnval !== "string")
                        throw "Something happened!";
                    // @ts-ignore
                    this.client.api.interactions(interaction.id, interaction.token).callback.post({
                        data: {
                            type: 4,
                            data: {
                                content: returnval
                            }
                        }
                    });
                }
            }));
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
                    if ((command.available && command.available(guild))) {
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
                allCommandPromises.push(this.MountCommand(command));
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
                if (!mod.available || !mod.available(message))
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
                let c = this.commands.find(command => command.name.toLowerCase() === result.command.toLowerCase());
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
                        yield message.channel.send(c.callback(...args));
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
                if (!mod.available || !mod.available(reaction.message))
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
