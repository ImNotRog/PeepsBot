import { Message } from "discord.js";

export function PROCESS(msg: Message):  { command: string, args: string[] } | null {
    if(msg.content.startsWith(`--`)) {
        const commandBody = msg.content.slice(`--`.length);
        const args = commandBody.split(' ');
        const command = args.shift().toLowerCase();

        return { command, args };
    }
    return null;
}