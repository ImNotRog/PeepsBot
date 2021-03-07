import { Client, Message, MessageReaction, TextChannel, User } from "discord.js";
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";

export class CipherBot implements Module {
    name = "Cipher Bot";
    zwj = "‍";

    private client:Client;

    constructor(client:Client) {
        this.client = client;
        // console.log(this.NothingnessToStr(this.StrToNothingness("test")));
    }

    async onMessage(message: Message): Promise<void> {
        const result = PROCESS(message);
        if(result) {
            if(result.command === "cipher") {
                let str = result.args.join(' ');
                message.channel.send(this.StrToNothingness(str));
            } else if(result.command === "decipher") {
                if(result.args.length > 1 || result.args.length === 0) {
                    message.channel.send("You have to put quotes around the sequence.");
                } else {
                    if(result.args[0].startsWith(this.zwj)) {
                        let nothingness = result.args[0];
                        message.channel.send(this.NothingnessToStr(nothingness));
                    } else if(result.args[0].startsWith("https")) {
                        // https://discord.com/channels/748669830244073533/748670606085587060/818190661886017564
                        let goodstuff = result.args[0].slice('https://discord.com/channels/'.length);
                        let params = goodstuff.split('/');
                        let channel = await this.client.channels.fetch(params[1]);
                        if(channel instanceof TextChannel) {
                            let msg = await channel.messages.fetch(params[2]);
                            let nothingness = msg.content;
                            message.channel.send(this.NothingnessToStr(nothingness));
                        }
                    } else {
                        try {
                            let msg = await message.channel.messages.fetch(result.args[0]);
                            let nothingness = msg.content;
                            message.channel.send(this.NothingnessToStr(nothingness));
                        } catch(err) {
                            message.channel.send("Unknown argument.");
                        }
                    }
                }
            }
        }
    }


    available(message: Message): boolean {
        return true;
    }

    CharToNumber(char: string) {
        return char.charCodeAt(0);
    }

    CharToBinary(char:string) {
        let str = char.charCodeAt(0).toString(2);
        while(str.length < 16) {
            str = '0' + str;
        }
        return str;
    }

    StrToBinary(str:string) {
        let binary = "";
        for(const letter of str ) {
            binary += this.CharToBinary(letter);
        }
        return binary;
    }

    StrToNothingness(str:string) {
        return this.zwj + this.StrToBinary(str).replace(/0/g, " ").replace(/1/g, this.zwj) + this.zwj;
    }

    NumberToChar(code:number) {
        return String.fromCharCode(code);
    }

    BinaryToChar(binary:string) {
        return this.NumberToChar(parseInt(binary,2));
    }

    BinaryToStr(binary:string) {
        let str = "";
        for(let i = 0; i < binary.length; i += 16) {
            let segment = binary.slice(i,i+16);
            str += this.BinaryToChar(segment);
        }
        return str;
    }

    NothingnessToStr(nothingness:string) {
        return this.BinaryToStr(nothingness.slice(1, nothingness.length - 1).replace(/‍/g, "1").replace(/ /g, "0"));
    }
    
}