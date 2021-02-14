"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROCESS = void 0;
function PROCESS(msg) {
    if (msg.content.startsWith(`--`) && !msg.author.bot) {
        const commandBody = msg.content.slice(`--`.length);
        const args = commandBody.split(' ');
        const command = args.shift().toLowerCase();
        return { command, args };
    }
    return null;
}
exports.PROCESS = PROCESS;
