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
exports.CipherBot = void 0;
const discord_js_1 = require("discord.js");
const ProcessMessage_1 = require("./ProcessMessage");
// DEPRECATED
class CipherBot {
    constructor(client) {
        this.name = "Cipher Bot";
        this.zwj = "‍";
        this.client = client;
        // console.log(this.NothingnessToStr(this.StrToNothingness("test")));
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                if (result.command === "cipher") {
                    let str = result.args.join(' ');
                    message.channel.send(this.StrToNothingness(str));
                }
                else if (result.command === "decipher") {
                    if (result.args.length > 1 || result.args.length === 0) {
                        message.channel.send("You have to put quotes around the sequence.");
                    }
                    else {
                        if (result.args[0].startsWith(this.zwj)) {
                            let nothingness = result.args[0];
                            message.channel.send(this.NothingnessToStr(nothingness));
                        }
                        else if (result.args[0].startsWith("https")) {
                            // https://discord.com/channels/748669830244073533/748670606085587060/818190661886017564
                            let goodstuff = result.args[0].slice('https://discord.com/channels/'.length);
                            let params = goodstuff.split('/');
                            let channel = yield this.client.channels.fetch(params[1]);
                            if (channel instanceof discord_js_1.TextChannel) {
                                let msg = yield channel.messages.fetch(params[2]);
                                let nothingness = msg.content;
                                message.channel.send(this.NothingnessToStr(nothingness));
                            }
                        }
                        else {
                            try {
                                let msg = yield message.channel.messages.fetch(result.args[0]);
                                let nothingness = msg.content;
                                message.channel.send(this.NothingnessToStr(nothingness));
                            }
                            catch (err) {
                                message.channel.send("Unknown argument.");
                            }
                        }
                    }
                }
            }
        });
    }
    available() {
        return true;
    }
    CharToNumber(char) {
        return char.charCodeAt(0);
    }
    CharToBinary(char) {
        let str = char.charCodeAt(0).toString(2);
        while (str.length < 16) {
            str = '0' + str;
        }
        return str;
    }
    StrToBinary(str) {
        let binary = "";
        for (const letter of str) {
            binary += this.CharToBinary(letter);
        }
        return binary;
    }
    StrToNothingness(str) {
        return this.zwj + this.StrToBinary(str).replace(/0/g, " ").replace(/1/g, this.zwj) + this.zwj;
    }
    NumberToChar(code) {
        return String.fromCharCode(code);
    }
    BinaryToChar(binary) {
        return this.NumberToChar(parseInt(binary, 2));
    }
    BinaryToStr(binary) {
        let str = "";
        for (let i = 0; i < binary.length; i += 16) {
            let segment = binary.slice(i, i + 16);
            str += this.BinaryToChar(segment);
        }
        return str;
    }
    NothingnessToStr(nothingness) {
        return this.BinaryToStr(nothingness.slice(1, nothingness.length - 1).replace(/‍/g, "1").replace(/ /g, "0"));
    }
}
exports.CipherBot = CipherBot;
