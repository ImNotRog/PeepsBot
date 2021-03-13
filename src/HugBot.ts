import { Message, MessageReaction, User } from "discord.js";
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";

export class HugBot implements Module {
    private readonly gifs = [
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
    ]
    
    name: string = `Hug Bot`;
    
    async onMessage?(message: Message): Promise<void> {
        const result = PROCESS(message);

        if(result){
            if(result.command === "hug"){
                const id = Math.floor(Math.random()*this.gifs.length);
                message.channel.send(this.gifs[id]);
            }
        }
    }

    available?(message: Message): boolean {
        return message.guild.id === `748669830244073533`;
    }
    helpEmbed?: {
        title: string; description: string; fields: {
            name: string; //tenor.com/view/mala-mishra-jha-pat-head-cute-sparkle-penguin-gif-16770818`,
            //tenor.com/view/mala-mishra-jha-pat-head-cute-sparkle-penguin-gif-16770818`,
            value: string;
        }[];
    };

    
    

    
}