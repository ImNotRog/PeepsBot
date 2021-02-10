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
        this.imageActive = false;
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
        this.client = client;
        this.helpEmbed = {
            title: `Help - General`,
            description: [
                `This is a very long help section, much like the girthy substance of a complete TRG.`,
                `I do a lot of things, from quotes to alerts. You can use those arrows down there to scroll around,`,
                `which I don't think I really have to say, but the brick to human ratio is surprisingly high.`,
                `Alright, go read and exercise that 3 second attention span. GLHF`
            ].join(` `)
        };
        this.helpTechnicalEmbed = {
            title: `Help - Details for Nerds`,
            description: `If you're a CS nerd, here's all you need to know.`,
            fields: [
                {
                    name: `Contact Me!`,
                    value: `Rog#7499 is the owner of this bot. Contact him to add to your server or sign channels up for alerts.`
                },
                {
                    name: `Invite Link`,
                    value: `Not available, ask Rog#7499 for one. This is a mainly private bot.`
                },
                {
                    name: `Github`,
                    value: `All my code is on Github: https://github.com/BubbyBabur/PeepsBot`
                },
                {
                    name: `NodeJS`,
                    value: [
                        `Built using NodeJS, and if you use any other language, I *will* block you.`,
                        `Node Packages can be found in the Github.`,
                        `I use Heroku to host the bot and use Firebase's Firestore service to store data. It's a straight pain in the butt, but it gets the job done.`,
                        `I also use Google API to store some data in Google spreadsheets, which is sick.`
                    ].join(`\n`)
                },
            ]
        };
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
    // getHelpEmbeds(serverid) {
    //     const embeds = [];
    //     embeds.push(this.helpEmbed)
    //     embeds.push(this.littleBot.helpEmbed);
    //     if (this.approvedMusicServers.indexOf(serverid) !== -1) {
    //         embeds.push(this.trackerBot.helpEmbed)
    //     }
    //     if (serverid === this.FPERBIO) {
    //         embeds.push(this.nameChangerBot.helpEmbed);
    //     }
    //     if(serverid === this.FPERBIO) {
    //         embeds.push(this.roleManagerBot.helpEmbed);
    //     }
    //     embeds.push(this.helpTechnicalEmbed)
    //     return embeds;
    // }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const mod of this.modules) {
                mod.onMessage(message);
            }
            // if (message.content.startsWith("!little")) {
            //     message.channel.send(`It's ${this.prefix}little now. I had to change it to something less generic.`)
            // } else if (message.content.includes("<@!750573267026182185>") && this.littleActive) {
            //     message.channel.send(await this.randomLittleQuote());
            // }
            // if (this.helpActive) {
            //     if (command === "help") {
            //         this.utils.sendCarousel(message, this.getHelpEmbeds(message.guild.id));
            //     }
            // }
        });
    }
}
exports.ProcessorBot = ProcessorBot;
