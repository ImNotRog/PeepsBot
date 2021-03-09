import * as Discord from "discord.js";
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";

export class GeckoInVCBot implements Module {
    public name: "Gecko in VC Bot";

    private client: Discord.Client;
    private readonly LogChannel = "755528072597471243";
    private readonly GECKO = "526863414635790356";
    private readonly FPERBIO = "748669830244073533";
    private geckostatus = 0;

    constructor(client: Discord.Client) {
        this.client = client;
        this.client.on("voiceStateUpdate", (a, b) => {
            this.handleVoiceUpdate(a, b);
        })
    }

    async handleVoiceUpdate(before: Discord.VoiceState, after: Discord.VoiceState) {

        let user = await this.client.users.fetch(before.id);

        if (before.channelID === after.channelID) {
            return;
        }
        
        let bchannel:Discord.Channel;
        let achannel: Discord.Channel;
        if(before.channel != null && before.channel.guild.id !== this.FPERBIO) {
            bchannel = null;
        } else {
            bchannel = before.channel;
        }
        if (after.channel != null && after.channel.guild.id !== this.FPERBIO) {
            achannel = null;
        } else {
            achannel = after.channel;
        }

        let messages:string[] = [];
        if (bchannel == null && achannel != null) {
            // Joined channel
            messages =
                [
                    `Fek ${user.username}#${user.discriminator}!`,
                    `<:doggowave:818606299180695562>`
                ]
        } else if (achannel == null && bchannel != null) {
            // Left channel
            messages =
                [
                    `Bofek ${user.username}#${user.discriminator}! <:lemonpensive:806262605752434699>`,
                ]
            
            if(user.id === this.GECKO) {
                this.geckostatus = 0;
            }
        } else {
            // Moved channel or two channels out of scope
            
        }

        for(const channel of [bchannel, achannel]) {
            if(channel != null && channel instanceof Discord.VoiceChannel) {
                let arr = channel.members.array();
                if(arr.length === 1) {
                    if(channel.members.has(this.GECKO)) {
                        messages.push("Gecko alone in the VC\nWhat will he do?");
                        messages.push("<:owo:808895647108825109>");
                        this.geckostatus = 1;
                    }
                }
                if (arr.length > 1) {
                    if (channel.members.has(this.GECKO)) {
                        this.geckostatus = 2;
                    }
                }
            }
        }

        let channel = await this.client.channels.fetch(this.LogChannel)
        if (channel instanceof Discord.TextChannel) {
            for(const message of messages) {
                await channel.send(message, { allowedMentions: { parse: [] } });
            }
        }

    }

    async onMessage(message: Discord.Message): Promise<void> {
        const result = PROCESS(message);
        if(result) {
            if(result.command === "isgeckointhevc") {
                message.channel.send(this.isGeckoInTheVC(), { allowedMentions: { parse: [] } });
            }
        }
    }

    async onConstruct(): Promise<void> {
        await this.getGeckoInVC();
    }

    isGeckoInTheVC() {
        switch(this.geckostatus) {
            case 0:
                return "Gecko is not in the VC.";
            case 1: 
                return "Gecko alone in the VC\nWhat will he do?"
            case 2:
                return "Gecko not alone in the VC\nWhat will he do?"
            default:
                return "Something went wrong..."
        }
    }

    async getGeckoInVC() {
        this.geckostatus = 0;
        let guild = await this.client.guilds.fetch(this.FPERBIO);
        for(const channel of guild.channels.cache.array()) {
            if(channel instanceof Discord.VoiceChannel) {
                if (channel.members.size === 1) {
                    if (channel.members.has(this.GECKO)) {
                        this.geckostatus = 1;
                    }
                }
                if (channel.members.size > 1) {
                    if (channel.members.has(this.GECKO)) {
                        this.geckostatus = 2;
                    }
                }
            }
            
        }
    }

    available(message: Discord.Message): boolean {
        return message.guild.id === "748669830244073533";
    }

    helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

}