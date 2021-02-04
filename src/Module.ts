
import * as Discord from "discord.js";

export interface Module {
    onMessage(message: Discord.Message): Promise<void>;
    onConstruct(): Promise<void>;
}