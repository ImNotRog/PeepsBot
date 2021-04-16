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
class ProcessorBot {
    constructor(auth, db, client, MW) {
        this.prefix = "--";
        this.littleActive = true;
        this.trackerActive = true;
        this.bdayActive = true;
        this.reactActive = true;
        this.nameChangerActive = true;
        this.roleManagerActive = true;
        this.scremActive = true;
        this.synonymActive = true;
        this.geckoInVCActive = true;
        this.imageActive = true;
        this.squalolActive = true;
        this.emojiActive = true;
        this.pianoManActive = true;
        this.cipherActive = true;
        this.hugActive = true;
        this.testActive = true;
        this.helpActive = true;
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
            console.log("Deleting slash commands...");
            let allDeletePromises = [];
            for (const guild of this.client.guilds.cache.values()) {
                // @ts-ignore
                const existingcommands = yield this.client.api.applications(this.client.user.id).guilds(guild.id).commands.get();
                for (const command of existingcommands) {
                    // console.log(command);
                    // @ts-ignore
                    let currDeletePromise = this.client.api.applications(this.client.user.id).guilds(guild.id).commands(command.id).delete();
                    allDeletePromises.push(currDeletePromise);
                }
            }
            yield Promise.all(allDeletePromises);
            console.log("All promises deleted, starting to register commands...");
            this.commands = this.modules.reduce((list, mod) => [...list, ...mod.commands], []);
            let allCommandPromises = [];
            for (const guild of this.client.guilds.cache.values()) {
                for (const command of this.commands) {
                    if ((command.available && command.available(guild))) {
                        // @ts-ignore
                        let newCommandPromise = this.client.api.applications(this.client.user.id).guilds(guild.id).commands.post({
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
                        allCommandPromises.push(newCommandPromise);
                    }
                }
            }
            yield Promise.all(allCommandPromises);
            // console.log(this.commands);
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
