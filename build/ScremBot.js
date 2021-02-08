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
exports.ScremBot = void 0;
const Discord = require("discord.js");
const ProcessMessage_1 = require("./ProcessMessage");
class ScremBot {
    constructor(client) {
        this.chars = ["a", "A"];
        this.cursedchars = ["a", "A", "ḁ̶̧̡͉̹͖̭̈͒͛͂́̀̐̿̎͆͛̓̕͠͝", "ä̷̢̨̛͓̙̗̗̼̝͇̦͖͙̦͚̳̪̘̟̩̘̤͚͕͈̩̭̦͎̱͉̘̳̣̫͙͎̫̜̬̝̺͇̮̲͔̮͔̯̀̃̓̌̀̀̆͛͐̃̆̈́͑͆̈́͌̔͒̋̋̔̃̐̂̿̉͂̂̆̈́͋̆̈́̀͒͘̕͘͝͠͝͝", "a̸̡̨̡̡̨̛̛̤̲̱̲̗͇̦̦͉͕̬͔̞̺͇̘̼̲̖̬̖͎̖̦̳̺̦̪̱͎͈͕͓̖͈͍̼͇͖̳͙̖͓̼͈̖̙͔̱͚̞̗̖̝̻̞̬̮͙̳̘̺͕̞̟̩͓̙͉͈̩͔͗̆̍͒̄͊̎̏̄̈́̿̇̂̓̌̈́͗͋͋͆̋͒͗͐̒̉̅̾̃̐̓̃͛̀̋͋͌̔̓͌̐͛̌̾̉̇́̑͛͛̋̊́̃̚͘̕͜͜͜͝͝͠͠͝͠ͅ", "Ằ̵̡̨̢̨̢̧̨̨̢̤͓͓̩͚̤̮͇̤͇̠̦̝̝̯͎͍̫̮̦̬̰̝̪͙͇̪̥̖̭͎̼͔̺̝͓͚̻̤̣̥̭̲̮̯̣̺̝͕͕̰͉͚͔̘̜̗͈̳͉̼̞̟͈̗̄̋́̉̿̇͒̅́̈́͆̄̔̍͆̒̀͂͒̄̾̅̚̚͝͠͝ͅͅ", "Á̵̧̦̟̘̯̩̱̥̰̹̙̮̲̹̀̽͊͛́̈́͐̓́́̋͋́̓͂̾̂̏͊̓̊̕̚͝͝"];
        this.voidchannels = ["750804960333135914", "748670606085587060"];
        this.client = client;
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                if (result.command === "scream" || result.command === "screm") {
                    this.scream(message, result.args, false);
                }
                if (result.command === "cursedscrem") {
                    this.scream(message, result.args, true);
                }
                if (this.voidchannels.includes(message.channel.id) &&
                    (result.command === "void" || result.command === "screamintothevoid" || result.command === "scremintothevoid")) {
                    this.void(message);
                }
            }
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    choice(arr) {
        return arr[Math.floor(arr.length * Math.random())];
    }
    screm(num) {
        return this.generateScrem(num, this.chars);
    }
    curse(num) {
        return this.generateScrem(num, this.cursedchars);
    }
    generateScrem(num, chars) {
        let msg = "";
        let space = true;
        for (let i = 0; i < num; i++) {
            if (i === num - 1)
                space = true;
            let letter;
            if (space) {
                letter = this.choice(chars);
                space = false;
            }
            else {
                letter = this.choice([...chars, " "]);
                if (letter === " ") {
                    space = true;
                }
            }
            msg += letter;
        }
        let words = msg.split(" ");
        let emphasis = [["", "*"], ["", "**"], ["", "", "", "~~"], ["", "__"]];
        for (let i = 0; i < words.length; i++) {
            let curr = "";
            for (const emph of emphasis) {
                curr += this.choice(emph);
            }
            let rev = "";
            for (const char of curr) {
                rev = char + rev;
            }
            words[i] = curr + words[i] + rev;
        }
        msg = words.join(" ");
        return msg;
    }
    scream(message, args, cursed) {
        return __awaiter(this, void 0, void 0, function* () {
            let def = args.length === 0;
            let num = args[0] ? parseInt(args[0]) : 32;
            if (isNaN(num))
                num = 32;
            yield message.delete();
            let author = message.author.username + "#" + message.author.discriminator;
            let msg = cursed ? this.curse(num) : this.screm(num);
            if (!def)
                msg = `"${msg}", 🎙️ **${author}** said calmly.`;
            let sent;
            try {
                sent = yield message.channel.send(msg);
            }
            catch (err) {
                message.channel.send(`Error: ${err}`);
                return;
            }
            if (def) {
                let msgs = [msg, ...Array(2).fill(0).map(() => cursed ? this.curse(num) : this.screm(num)), `🎙️ **${author}** said calmly.`];
                let curr = { stage: 2 };
                let interval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    if (curr.stage > msgs.length) {
                        clearInterval(interval);
                        return;
                    }
                    let tosend = msgs.slice(0, curr.stage);
                    curr.stage++;
                    try {
                        yield sent.edit(tosend);
                    }
                    catch (err) {
                        clearInterval(interval);
                        return;
                    }
                }), 1000);
            }
        });
    }
    void(message) {
        return __awaiter(this, void 0, void 0, function* () {
            let sent = yield message.channel.send({
                embed: {
                    title: `Scream into the Void`,
                    description: `Screm your inner rage and pain in this channel. --end to send the agony into the void.`,
                    color: 7419530
                }
            });
            let total = 0;
            let totalchars = 0;
            while (true) {
                let messages;
                try {
                    messages = yield message.channel.awaitMessages(() => true, { max: 1, errors: ["time"], time: 60 * 1000, });
                }
                catch (err) {
                    break;
                }
                total++;
                totalchars += message.content.length;
                message = messages.first();
                if (message.content.startsWith("--end")) {
                    break;
                }
            }
            if (message.channel instanceof Discord.TextChannel) {
                yield message.channel.bulkDelete(total);
                sent.edit({
                    embed: {
                        title: `Scream into the Void`,
                        description: `Stress relief session ended. ${total} messages and ${totalchars} characters of pure agony and school-directed hatred were scremed into the void.`,
                        color: 7419530
                    }
                });
            }
        });
    }
}
exports.ScremBot = ScremBot;
