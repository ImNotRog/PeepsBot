"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROCESS = void 0;
function PROCESS(msg) {
    if (msg.content.startsWith(`--`) && !msg.author.bot) {
        const commandBody = msg.content.slice(`--`.length);
        let quotesactive = false;
        let args = [];
        let arg = "";
        for (const character of commandBody) {
            if (character === `"`) {
                if (quotesactive === true) {
                    args.push(arg);
                    arg = "";
                }
                else {
                    if (arg.length > 0)
                        args.push(arg);
                    arg = "";
                }
                quotesactive = !quotesactive;
            }
            else if (character === " ") {
                if (quotesactive) {
                    arg += " ";
                }
                else {
                    if (arg.length > 0)
                        args.push(arg);
                    arg = "";
                }
            }
            else {
                arg += character;
            }
        }
        if (arg.length > 0)
            args.push(arg);
        const command = args.shift().toLowerCase();
        return { command, args };
    }
    return null;
}
exports.PROCESS = PROCESS;
