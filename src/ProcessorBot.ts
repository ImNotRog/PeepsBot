
/**
 * @todo Node-canvas pershlaps
 */

import Discord = require("discord.js");

import { LittleBot } from "./LittleBot";
import { TrackerBot } from "./GroovyTrackerBot";
import { CalendarBot } from "./CalBot";
import { ReactBot } from "./ReactBot";
import { NameChangerBot } from "./NameChanger";
import { RoleManagerBot } from "./RoleManager";
import { ScremBot } from "./ScremBot";
import { SynonymBot } from "./SynonymBot";
import { ImageBot } from "./ImageBot";
import { SqualolBot } from "./SqualolBot";
import { GeckoInVCBot } from "./GeckoInVC";
import { EmoteBot } from "./EmoteBot";

import { TestBot } from "./TestBot";
import { HelpBot } from "./HelpBot";

import { Module } from "./Module";

export class ProcessorBot {

    private readonly prefix = "--";
    // private readonly littleActive = true;
    // private readonly trackerActive = true;
    // private readonly bdayActive = true;
    // private readonly reactActive = true;
    // private readonly nameChangerActive = true;
    // private readonly roleManagerActive = false;
    // private readonly scremActive = true;
    // private readonly synonymActive = true;
    // private readonly geckoInVCActive = true;
    // private readonly imageActive = true;
    // private readonly squalolActive = true;
    // private readonly emojiActive = true;

    // private readonly testActive = false;
    // private readonly helpActive = true;

    private readonly littleActive = false;
    private readonly trackerActive = false;
    private readonly bdayActive = false;
    private readonly reactActive = false;
    private readonly nameChangerActive = false;
    private readonly roleManagerActive = true;
    private readonly scremActive = false;
    private readonly synonymActive = false;
    private readonly geckoInVCActive = false;
    private readonly imageActive = false;
    private readonly squalolActive = false;
    private readonly emojiActive = false;

    private readonly testActive = false;
    private readonly helpActive = false;

    private modules: Module[];

    private client: any;

    constructor(auth, db: FirebaseFirestore.Firestore, client: Discord.Client, MW: string) {

        this.modules = [];
        if (this.littleActive) this.modules.push(new LittleBot(auth, client));
        if (this.trackerActive) this.modules.push(new TrackerBot(auth));
        if (this.bdayActive) this.modules.push(new CalendarBot(auth, client));
        if (this.reactActive) this.modules.push(new ReactBot());
        if (this.nameChangerActive) this.modules.push(new NameChangerBot(auth, client));
        if (this.roleManagerActive) this.modules.push(new RoleManagerBot(client));
        if (this.scremActive) this.modules.push(new ScremBot(client));
        if (this.synonymActive) this.modules.push(new SynonymBot(MW, client));
        if (this.geckoInVCActive) this.modules.push(new GeckoInVCBot(client));
        if (this.emojiActive) this.modules.push(new EmoteBot(auth, client));
        if (this.imageActive) this.modules.push(new ImageBot(auth, client));
        if (this.squalolActive) this.modules.push(new SqualolBot())


        if (this.testActive) this.modules.push(new TestBot(auth, client));
        if (this.helpActive) this.modules.push(new HelpBot(this.modules, client));

        this.client = client;

    }

    async onConstruct() {
        let allpromises = [];
        for (const mod of this.modules) {
            allpromises.push(mod.onConstruct());
        }
        await Promise.all(allpromises);
        
        this.client.on("message", (message) => {
            this.onMessage(message)
        });
    }

    async onMessage(message: Discord.Message) {

        
        for (const mod of this.modules) {
            if(!mod.available(message)) continue;
            try {
                await mod.onMessage(message);
            } catch(err) {
                console.log("Ruh roh! Error in module " + mod);
                console.error(err);
                message.channel.send(`Error: ${err}. Please report to @Rog#7499. Or not, it's your choice.`, { allowedMentions: { parse: [] } });
            }
        }
        
    }

}