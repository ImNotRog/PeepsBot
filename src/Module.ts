
import * as Discord from "discord.js";
import { ProcessorBot } from "./ProcessorBot";

export interface Module {
    name: string;
    commands?: Command[];
    onMessage?(message: Discord.Message): Promise<void>;
    onReaction?(reaction: Discord.MessageReaction, user: Discord.User): Promise<void>;
    onConstruct?(): Promise<void>;
    available?(message: Discord.Message): boolean;
    helpEmbed?: { title: string; description: string; fields: { name: string; value: string; }[]; };
    parent?: ProcessorBot;
}

export type Command = RegularCommand | ComplexCommand | TextOnlyCommand;

type BaseCommand = {
    name: string;
    description: string;
    parameters: {
        name: string,
        description: string,
        required: boolean,
        type: "string" | "number";
    }[];
    // callback: (...params: any[]) => SlashResponseResolvable;
    available: (guild: Discord.Guild) => boolean;
}

type TextOnlyCommand = BaseCommand & {
    textOnly: true;
    callback: (message: Discord.Message, ...params: any[]) => any;
} 

type AdvancedEmbedCommand = BaseCommand & {
    callback: (...params: any[]) => {embed: Object};
    advancedEmbed:true;
}

type RegularCommand = BaseCommand & {
    callback: (...params: any[]) => SlashResponseResolvable|Promise<SlashResponseResolvable>;
}

type ComplexCommand = BaseCommand & {
    slashCallback: ( invoke: (response: SlashResponseResolvable) => Promise<void>, channel: Discord.TextChannel, user: Discord.User, ...params: any[]) => any;
    regularCallback: ( message: Discord.Message, ...params: any[] ) => any;
}

export type SlashResponseResolvable = string | { embed: Object } | { content: string | { embed: Object }, files: Object };;
