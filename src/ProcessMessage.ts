import { Message } from "discord.js";

export function PROCESS(msg: Message):  { command: string, args: string[] } | null {
    if(msg.content.startsWith(`--`) && !msg.author.bot) {
        const commandBody = msg.content.slice(`--`.length);
        let quotesactive = false;

        let args = [];
        let arg = "";
        for(const character of commandBody) { 
            if(character === `"`) {
                if (quotesactive === true) {
                    args.push(arg);
                    arg = "";
                } else {
                    if(arg.length > 0) args.push(arg);
                    arg = "";
                }
                quotesactive = !quotesactive;
            } else if(character === " ") {
                if(quotesactive) {
                    arg += " ";
                } else {
                    
                    if(arg.length > 0) args.push(arg);
                    arg = "";
                }
            } else {
                arg += character;
            }
        }
        if(arg.length > 0) args.push(arg);
        if(args.length == 0) return null;
        const command = args.shift().toLowerCase();

        return { command, args };
    }
    return null;
}