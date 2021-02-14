
import * as Discord from "discord.js";

export interface Module {
    onMessage(message: Discord.Message): Promise<void>;
    onConstruct(): Promise<void>;
    available(message: Discord.Message): boolean;
    helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };
}