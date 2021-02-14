
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
import { TestBot } from "./TestBot";

import { Module } from "./Module";
import { HelpBot } from "./HelpBot";

export class ProcessorBot {

    private readonly prefix = "--";
    // private readonly littleActive = true;
    // private readonly trackerActive = true;
    // private readonly bdayActive = true;
    // private readonly reactActive = true;
    // private readonly nameChangerActive = true;
    // private readonly roleManagerActive = true;
    // private readonly scremActive = true;
    // private readonly synonymActive = true;
    // private readonly imageActive = true;
    // private readonly testActive = false;
    // private readonly helpActive = true;

    private readonly littleActive = false;
    private readonly trackerActive = false;
    private readonly bdayActive = false;
    private readonly reactActive = true;
    private readonly nameChangerActive = false;
    private readonly roleManagerActive = false;
    private readonly scremActive = false;
    private readonly synonymActive = false;
    private readonly imageActive = false;
    private readonly testActive = false;
    private readonly helpActive = false;

    private modules: Module[];

    private client: any;

    private helpEmbed: { title: string; description: string; };
    private helpTechnicalEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

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
        if (this.imageActive) this.modules.push(new ImageBot(auth, client));
        if (this.testActive) this.modules.push(new TestBot(auth, client));
        if (this.helpActive) this.modules.push(new HelpBot(this.modules, client));

        this.client = client;

        this.client.on("message", (message) => {
            this.onMessage(message)
        });

    }

    async onConstruct() {
        let allpromises = [];
        for (const mod of this.modules) {
            allpromises.push(mod.onConstruct());
        }
        await Promise.all(allpromises);
    }

    async onMessage(message: Discord.Message) {

        
        for (const mod of this.modules) {
            if(!mod.available(message)) continue;
            try {
                await mod.onMessage(message);
            } catch(err) {
                console.log("Ruh roh! Error in module " + mod);
                console.error(err);
                message.channel.send(`Error: ${err}. Please report to @Rog#7499. Or not, it's your choice.`);
            }
        }
        
    }

}