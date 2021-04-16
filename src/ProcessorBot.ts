
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
import { PianoManBot } from "./PianoManBot";
import { CipherBot } from "./CipherBot"
import { HugBot } from "./HugBot";

import { TestBot } from "./TestBot";
import { HelpBot } from "./HelpBot";

import { Module, Command } from "./Module";

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
    private readonly geckoInVCActive = true;
    private readonly imageActive = true;
    private readonly squalolActive = true;
    private readonly emojiActive = true;
    private readonly pianoManActive = true;
    private readonly cipherActive = true;
    private readonly hugActive = true;

    private readonly testActive = true;
    private readonly helpActive = true;

    // private readonly littleActive = false;
    // private readonly trackerActive = false;
    // private readonly bdayActive = false;
    // private readonly reactActive = false;
    // private readonly nameChangerActive = false;
    // private readonly roleManagerActive = false;
    // private readonly scremActive = false;
    // private readonly synonymActive = false;
    // private readonly geckoInVCActive = false;
    // private readonly imageActive = false;
    // private readonly squalolActive = false;
    // private readonly emojiActive = false;
    // private readonly pianoManActive = false;
    // private readonly cipherActive = false;
    // private readonly hugActive = false;

    // private readonly testActive = true;
    // private readonly helpActive = false;

    private modules: Module[];
    private commands: Command[];

    private client: Discord.Client;

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
        if (this.pianoManActive) this.modules.push(new PianoManBot(auth, client));
        if (this.cipherActive) this.modules.push(new CipherBot(client));
        if (this.hugActive) this.modules.push(new HugBot());
        if (this.imageActive) this.modules.push(new ImageBot(auth, client));
        if (this.squalolActive) this.modules.push(new SqualolBot());


        if (this.testActive) this.modules.push(new TestBot(auth, client));
        if (this.helpActive) this.modules.push(new HelpBot(this.modules, client));

        this.client = client;

    }

    async onConstruct() {
        let allpromises = [];
        for (const mod of this.modules) {
            if(mod.onConstruct) allpromises.push(mod.onConstruct());
        }
        await Promise.all(allpromises);
        
        this.client.on("message", (message) => {
            this.onMessage(message)
        });

        console.log("Deleting slash commands...");
        let allDeletePromises = [];
        for(const guild of this.client.guilds.cache.values() ) {
            // @ts-ignore
            const existingcommands = await this.client.api.applications(this.client.user.id).guilds(guild.id).commands.get();
            if(existingcommands) {
                for (const command of existingcommands) {
                    // console.log(command);
                    // @ts-ignore
                    let currDeletePromise = this.client.api.applications(this.client.user.id).guilds(guild.id).commands(command.id).delete();
                    allDeletePromises.push(currDeletePromise);
                }
            }
            

        }
        
        await Promise.all(allDeletePromises);

        console.log("All promises deleted, starting to register commands...")

        this.commands = this.modules.reduce((list, mod) => mod.commands ? [...list,...mod.commands] : list, []);

        let allCommandPromises = [];
        for(const guild of this.client.guilds.cache.values()) {
            for(const command of this.commands) {
                if( (command.available && command.available(guild) ) ) {
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
                                }
                            })
                        }
                    });
                    allCommandPromises.push(newCommandPromise);
                }
            }
        }

        await Promise.all(allCommandPromises);

        // console.log(this.commands);

        // @ts-ignore
        this.client.ws.on("INTERACTION_CREATE", async (interaction) => {
            const { name, options } = interaction.data;
            const command = name.toLowerCase();
            
            let c = this.commands.find(c => c.name.toLowerCase() === command);
            if(c) {
                let returnval = c.callback( ...(!options ? [] : options.map(option => option.value)));
                if(typeof returnval !== "string") throw "Something happened!";
                // @ts-ignore
                this.client.api.interactions(interaction.id, interaction.token).callback.post({
                    data: {
                        type: 4,
                        data: {
                            content: returnval
                        }
                    }
                })
            }
        })

    }

    async onMessage(message: Discord.Message) {
        
        for (const mod of this.modules) {
            if(!mod.available || !mod.available(message)) continue;
            if(mod.onMessage) {
                try {
                    await mod.onMessage(message);
                } catch (err) {
                    console.log("Ruh roh! Error in module " + mod);
                    console.error(err);
                    message.channel.send(`Error: ${err}. Please report to @Rog#2597. Or not, it's your choice.`, { allowedMentions: { parse: [] } });
                }
            }
        }
        
    }

    async onReaction(reaction: Discord.MessageReaction, user: Discord.User) {

        for (const mod of this.modules) {
            if (!mod.available || !mod.available(reaction.message)) continue;
            if (mod.onReaction) {
                try {
                    await mod.onReaction(reaction,user);
                } catch (err) {
                    console.log("Ruh roh! Error in module " + mod);
                    console.error(err);
                    reaction.message.channel.send(`Error: ${err}. Please report to @Rog#2597. Or not, it's your choice.`, { allowedMentions: { parse: [] } });
                }
            }
        }

    }

}