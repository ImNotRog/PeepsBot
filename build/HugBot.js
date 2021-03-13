"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HugBot = void 0;
const ProcessMessage_1 = require("./ProcessMessage");
class HugBot {
    constructor() {
        this.gifs = [
            `https://tenor.com/view/hugmati-gif-18302861`,
            `https://tenor.com/view/hug-virtual-hug-hug-sent-gif-5026057`,
            `https://tenor.com/view/funny-dog-cat-patting-head-gif-4953911`,
            `https://tenor.com/view/cute-cat-cats-couple-love-gif-14214458`,
            `https://tenor.com/view/mala-mishra-jha-pat-head-cute-sparkle-penguin-gif-16770818`,
            `https://tenor.com/view/stromman-excited-group-hug-payday-feels-angell-gif-11062571`,
            `https://tenor.com/view/milk-and-mocha-bear-couple-line-hug-cant-breathe-gif-12687187`,
            `https://tenor.com/view/hug-peachcat-cat-cute-gif-13985247`,
            `https://tenor.com/view/milk-and-mocha-hug-cute-kawaii-love-gif-12535134`,
            `https://tenor.com/view/peach-cat-hug-hug-up-love-mochi-mochi-peach-cat-gif-16334628`
        ];
        this.name = `Hug Bot`;
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                if (result.command === "hug") {
                    const id = Math.floor(Math.random() * this.gifs.length);
                    message.channel.send(this.gifs[id]);
                }
            }
        });
    }
    available(message) {
        return message.guild.id === `748669830244073533`;
    }
}
exports.HugBot = HugBot;
