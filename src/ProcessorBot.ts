
/**
 * @todo Node-canvas pershlaps
 */

import Discord = require("discord.js");

import { QuotesBot } from "./QuotesBot";
import { TrackerBot } from "./GroovyTrackerBot";
import { CalendarBot } from "./CalBot";
import { ReactBot } from "./ReactBot";
import { NameChangerBot } from "./NameChanger";
import { RoleManagerBot } from "./RoleManager";
import { ScremBot } from "./ScremBot";
import { SynonymBot } from "./SynonymBot";
import { ImageBot } from "./ImageBot";
import { GeckoInVCBot } from "./GeckoInVC";
import { EmoteBot } from "./EmoteBot";
import { PianoManBot } from "./PianoManBot";
import { HugBot } from "./HugBot";

import { YearbookBot } from "./YearbookBot";

import { TestBot } from "./TestBot";
import { HelpBot } from "./HelpBot";

import { Module, Command, SlashResponseResolvable } from "./Module";
import { PROCESS } from "./ProcessMessage";

export class ProcessorBot {

    private readonly prefix = "--";
    private readonly quotesActive = true;
    private readonly trackerActive = true;
    private readonly bdayActive = true;
    private readonly reactActive = true;
    private readonly nameChangerActive = true;
    private readonly roleManagerActive = true;
    private readonly scremActive = true;
    private readonly synonymActive = true;
    private readonly geckoInVCActive = true;
    private readonly imageActive = true;
    private readonly emojiActive = true;
    private readonly pianoManActive = true;
    private readonly hugActive = true;

    private readonly yearbookActive = true;

    private readonly testActive = true;
    private readonly helpActive = true;

    // TESTING:

    // private readonly quotesActive = false;
    // private readonly trackerActive = false;
    // private readonly bdayActive = false;
    // private readonly reactActive = false;
    // private readonly nameChangerActive = false;
    // private readonly roleManagerActive = false;
    // private readonly scremActive = false;
    // private readonly synonymActive = false;
    // private readonly geckoInVCActive = false;
    // private readonly imageActive = false;
    // private readonly emojiActive = false;
    // private readonly pianoManActive = false;
    // private readonly hugActive = false;

    // private readonly yearbookActive = true;

    // private readonly testActive = false;
    // private readonly helpActive = false;

    private readonly clearCommands = true;

    public modules: Module[];
    public commands: Command[];
    private mountedCommands: MountedCommand[];

    private client: Discord.Client;

    public DMSessions: Map<string, string>;

    constructor(auth, db: FirebaseFirestore.Firestore, client: Discord.Client, MW: string) {

        this.modules = [];
        if (this.quotesActive) this.modules.push(new QuotesBot(auth, client));
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
        if (this.hugActive) this.modules.push(new HugBot());
        if (this.imageActive) this.modules.push(new ImageBot(auth, client));

        if (this.yearbookActive) this.modules.push(new YearbookBot(db, client));

        if (this.testActive) this.modules.push(new TestBot(auth, client));
        if (this.helpActive) this.modules.push(new HelpBot(client));

        this.client = client;

        this.DMSessions = new Map();
    }

    async onConstruct() {

        for(const mod of this.modules) {
            mod.parent = this;
        }

        let allpromises = [];
        for (const mod of this.modules) {
            if(mod.onConstruct) allpromises.push(mod.onConstruct());
        }
        await Promise.all(allpromises);
        
        

        console.log("Fetching mounted commmands...")
        this.mountedCommands = await this.getMountedCommands();
        // console.log(this.mountedCommands);

        // Clear commands
        if(this.clearCommands) {
            console.log("Deleting slash commands...");
            await this.deleteMountedCommandsByCondition((command, index) => true);
        }

        // console.log("deleting hug");
        // await this.deleteMountedCommandsByCondition((command, index) => command.name === "hug");
        
        console.log("Registering commands...")

        // Mount commands
        this.commands = this.modules.reduce((list, mod) => mod.commands ? [...list,...mod.commands] : list, []);

        await this.MountAllCommands();

        // Handle calls

        // @ts-ignore
        this.client.ws.on("INTERACTION_CREATE", async (interaction) => {

            const { name, options } = interaction.data;
            const command = name.toLowerCase();
            
            let c = this.commands.filter(c => !("textOnly" in c)).find(c => c.name.toLowerCase() === command);
            if(c) {

                if("textOnly" in c) {
                    return;
                } else if("callback" in c) {
                    await this.ResolveInteraction(interaction, await c.callback(...(!options ? [] : options.map(option => option.value))));
                } else {
                    let returnchannel = this.client.channels.resolve(interaction.channel_id);
                    if (!(returnchannel instanceof Discord.TextChannel)) throw "Something went horribly wrong.";

                    let user = await this.client.users.fetch(interaction.member.user.id);
                    // let member = returnchannel.guild.member(user);
                    c.slashCallback(async (returnval) => {
                        await this.ResolveInteraction(interaction, returnval);
                    }, returnchannel, user, ...(!options ? [] : options.map(option => option.value)));
                }
                
            }
        })

        this.client.on("message", (message) => {
            this.onMessage(message)
        });

    }

    private async ResolveInteraction(interaction: any, returnval: SlashResponseResolvable) {
        let returnchannel = this.client.channels.resolve(interaction.channel_id);
        if (!(returnchannel instanceof Discord.TextChannel)) throw "Something went horribly wrong.";

        let apimessage: Discord.APIMessage;

        // if (typeof returnval !== "string") throw "Something happened!";
        if (typeof returnval === "object" && "content" in returnval) {
            apimessage = Discord.APIMessage.create(
                returnchannel,
                // @ts-ignore
                returnval.content
            );
        } else {
            apimessage = Discord.APIMessage.create(
                returnchannel,
                // @ts-ignore
                returnval
            );
        }

        let adf = await apimessage.resolveData().resolveFiles();
        let { data, files } = adf;

        // @ts-ignore
        await this.client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
                type: 4,
                data: {
                    ...data,
                    files,
                    allowed_mentions: { parse: [] }
                }
            }
        })

        if (typeof returnval === "object" && "content" in returnval) {
            returnchannel.send(returnval.files);
        }
    }

    async MountCommandOnServer(command: Command, guildID: string) {
        // @ts-ignore
        await this.client.api.applications(this.client.user.id).guilds(guildID).commands.post({
            data: {
                name: command.name.toLowerCase(),
                description: command.description,
                options: command.parameters.map(parameter => {
                    return {
                        name: parameter.name.toLowerCase(),
                        description: parameter.description,
                        required: parameter.required,
                        type: parameter.type === "string" ? 3 : 4
                    }
                })
            }
        });
    }

    async MountCommandsOnServer(guildID:string) {
        if( this.client.guilds.cache.has(guildID)){
            let guild = this.client.guilds.cache.get(guildID);
            let allCommandPromises = [];
            for(const command of this.commands) {
                if (!("textOnly" in command) && (command.available && command.available(guild))) {
                    allCommandPromises.push(this.MountCommandOnServer(command, guild.id));
                }
            }
            await Promise.all(allCommandPromises);
        } else {
            throw "Guild not found!";
        }
    }

    async MountCommand(command: Command)  {
        if("textOnly" in command) throw "Attempted to mount text-only command!";
        let allCommandPromises = [];
        for (const guild of this.client.guilds.cache.values()) {
            if ((command.available && command.available(guild))) {
                allCommandPromises.push(this.MountCommandOnServer(command, guild.id));
            }
        }
        await Promise.all(allCommandPromises);
    }

    async MountAllCommands()  {
        let allCommandPromises = [];
        for(const command of this.commands) {
            if(!("textOnly" in command)) {
                allCommandPromises.push(this.MountCommand(command));
            }
        }
        await Promise.all(allCommandPromises);
    }

    async deleteMountedCommand(commandObj: MountedCommand) {
        // @ts-ignore
        await this.client.api.applications(this.client.user.id).guilds(commandObj.guild_id).commands(commandObj.id).delete();
    }

    async deleteMountedCommandsByCondition(cond: (mc: MountedCommand, index: number) => boolean) {
        
        let indicesToDelete = [];
        for(let index = 0; index < this.mountedCommands.length; index++) {
            if(cond(this.mountedCommands[index], index)) {
                indicesToDelete.push(index);
            }
        }

        let allpromises = [];
        for(const index of indicesToDelete) {
            allpromises.push( this.deleteMountedCommand(this.mountedCommands[index]) );
        }
        await Promise.all(allpromises);

        let newMountedCommands = [];
        for(let i = 0; i < this.mountedCommands.length; i++) {
            if(!indicesToDelete.includes(i)) {
                newMountedCommands.push(this.mountedCommands[i]);
            }
        }
        this.mountedCommands = newMountedCommands;
    } 

    async getMountedCommandsOnServer(guildID: string): Promise<MountedCommand[]> {
        // @ts-ignore
        return await this.client.api.applications(this.client.user.id).guilds(guildID).commands.get();
    }

    async getMountedCommands(): Promise<MountedCommand[]> {
        let allGetPromises = [];
        for (const guild of this.client.guilds.cache.values()) {
            allGetPromises.push(this.getMountedCommandsOnServer(guild.id));
        }

        let allGot = await Promise.all(allGetPromises);
        return allGot.reduce((a,b) => [...a,...b], []);
    }

    async onMessage(message: Discord.Message) {
        
        for (const mod of this.modules) {
            if(!mod.available || !mod.available(message.guild)) continue;
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

        const result = PROCESS(message);

        if(result) {
            let c = this.commands.filter(c => c.available && c.available(message.guild)).find(command => command.name.toLowerCase() === result.command.toLowerCase());

            if(c) {
                let args = result.args;
                let validargs = true;
                if(!( args.length >= c.parameters.filter(a => a.required).length && args.length <= c.parameters.length )) validargs = false;
                else {
                    for(let i = 0; i < c.parameters.length; i++) {
                        if(i >= args.length) break;

                        if(c.parameters[i].type === "number") {
                            if (isNaN(parseInt(args[i]))) {
                                validargs = false;
                                break;
                            }
                        }
                        
                    }
                }

                if(validargs) {

                    if("textOnly" in c) {
                        c.callback(message, ...args);
                    } else if("callback" in c) {
                        let returnval = await c.callback(...args);
                        if (typeof returnval === "object" && "content" in returnval) {
                            if (typeof returnval.content === "string") await message.channel.send(returnval.content.replace(/\@/g, ''), returnval.files);
                            else await message.channel.send(returnval.content, returnval.files);
                        } else {
                            // @ts-ignore
                            await message.channel.send(returnval, {allowedMentions: {parse: []}});
                        }
                    } else {
                        c.regularCallback(message, ...args);
                    }
                    
                    
                } else {
                    await message.channel.send({
                        embed: {
                            description: `Invalid Arguments to command ${c.name}. It accepts parameters of the form: \n${this.prefix}${c.name} ${c.parameters.map(param => param.required ? `[**${param.name}**]` : `[Optional: **${param.name}**]`).join(' ')}`,
                            color: 1111111
                        }
                    })
                }

            }
        }
        
    }

    async onReaction(reaction: Discord.MessageReaction, user: Discord.User) {

        for (const mod of this.modules) {
            if (!mod.available || !mod.available(reaction.message.guild)) continue;
            if (mod.onReaction) {
                try {
                    await mod.onReaction(reaction,user);
                } catch (err) {
                    console.log("Ruh roh! Error in module " + mod);
                    console.error(err);
                    // reaction.message.channel.send(`Error: ${err}. Please report to @Rog#2597. Or not, it's your choice.`, { allowedMentions: { parse: [] } });
                }
            }
        }

    }

}

type MountedCommand = { id: string, application_id: string, name: string, description: string, version: string, guild_id: string };