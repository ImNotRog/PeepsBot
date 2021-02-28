
import * as Discord from "discord.js";

export interface Module {
    name: string;
    onMessage?(message: Discord.Message): Promise<void>;
    onReaction?(reaction: Discord.MessageReaction, user: Discord.User): Promise<void>;
    onConstruct?(): Promise<void>;
    available?(message: Discord.Message): boolean;
    helpEmbed?: { title: string; description: string; fields: { name: string; value: string; }[]; };
}