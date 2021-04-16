
import * as Discord from "discord.js";

export interface Module {
    name: string;
    commands?: Command[];
    onMessage?(message: Discord.Message): Promise<void>;
    onReaction?(reaction: Discord.MessageReaction, user: Discord.User): Promise<void>;
    onConstruct?(): Promise<void>;
    available?(message: Discord.Message): boolean;
    helpEmbed?: { title: string; description: string; fields: { name: string; value: string; }[]; };
}

export type Command = {
    name: string;
    description: string;
    parameters: {
        name: string, 
        description:string,
        required: boolean,
        type: "string" | "number";
    }[];
    callback: (...params: any[]) => string|Object;
    available?: (guild: Discord.Guild) => boolean;
}
