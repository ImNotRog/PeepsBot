
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

import { Module } from "./Module";

export class ProcessorBot {

    private readonly prefix = "--";
    private readonly littleActive = true;
    private readonly trackerActive = true;
    private readonly bdayActive = true;
    private readonly reactActive = true;
    private readonly nameChangerActive = true;
    private readonly roleManagerActive = true;
    private readonly scremActive = true;
    private readonly synonymActive = true;
    private readonly imageActive = false;
    private readonly helpActive = true;

    // private readonly littleActive = false;
    // private readonly trackerActive = false;
    // private readonly bdayActive = false;
    // private readonly reactActive = false;
    // private readonly nameChangerActive = false;
    // private readonly roleManagerActive = false;
    // private readonly scremActive = false;
    // private readonly synonymActive = false;
    // private readonly imageActive = true;
    // private readonly helpActive = false;

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

        this.client = client;

        this.helpEmbed = {
            title: `Help - General`,
            description: [
                `This is a very long help section, much like the girthy substance of a complete TRG.`,
                `I do a lot of things, from quotes to alerts. You can use those arrows down there to scroll around,`,
                `which I don't think I really have to say, but the brick to human ratio is surprisingly high.`,
                `Alright, go read and exercise that 3 second attention span. GLHF`
            ].join(` `)
        }

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
        }

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

    async onMessage(message: Discord.Message) {

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

    }

}