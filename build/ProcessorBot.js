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
        this.imageActive = true;
        this.squalolActive = true;
        this.testActive = false;
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
        if (this.imageActive)
            this.modules.push(new ImageBot_1.ImageBot(auth, client));
        if (this.squalolActive)
            this.modules.push(new SqualolBot_1.SqualolBot());
        if (this.testActive)
            this.modules.push(new TestBot_1.TestBot(auth, client));
        if (this.helpActive)
            this.modules.push(new HelpBot_1.HelpBot(this.modules, client));
        this.client = client;
        this.client.on("message", (message) => {
            this.onMessage(message);
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            let allpromises = [];
            for (const mod of this.modules) {
                allpromises.push(mod.onConstruct());
            }
            yield Promise.all(allpromises);
        });
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const mod of this.modules) {
                if (!mod.available(message))
                    continue;
                try {
                    yield mod.onMessage(message);
                }
                catch (err) {
                    console.log("Ruh roh! Error in module " + mod);
                    console.error(err);
                    message.channel.send(`Error: ${err}. Please report to @Rog#7499. Or not, it's your choice.`);
                }
            }
        });
    }
}
exports.ProcessorBot = ProcessorBot;
