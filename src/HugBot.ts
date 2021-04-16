import { Message, MessageReaction, User } from "discord.js";
import { Module, Command } from "./Module";
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
        `https://tenor.com/view/peach-cat-hug-hug-up-love-mochi-mochi-peach-cat-gif-16334628`,
        `https://tenor.com/view/hugmati-gif-18302861`,
        `https://tenor.com/view/hug-peachcat-cat-cute-gif-13985247`,
        `https://tenor.com/view/milk-and-mocha-cuddling-hug-cute-kawaii-gif-12535135`,
        `https://tenor.com/view/milk-and-mocha-hug-cute-kawaii-love-gif-12535134`,
        `https://tenor.com/view/milk-and-mocha-bear-couple-line-hug-cant-breathe-gif-12687187`,
        `https://tenor.com/view/cute-cat-cats-couple-love-gif-14214458`,
        `https://tenor.com/view/cat-hug-back-hug-notice-me-attention-to-me-gif-14227401`,
        `https://tenor.com/view/cute-cat-couple-hug-love-gif-14184904`,
        `https://tenor.com/view/mochi-peachcat-mochi-peachcat-hug-pat-gif-19092449`,
        `https://tenor.com/view/cat-gray-cat-white-cat-love-cat-hug-gif-14227403`,
        `https://tenor.com/view/mochi-cuddle-peach-goma-gif-20216925`,
        `https://tenor.com/view/peachcat-hi-hello-gif-13806512`,
        `https://tenor.com/view/cat-hyper-hug-love-excited-gif-17981819`
        
    ]
    
    name: string = `Hug Bot`;

    public commands: Command[] = [
        {
            name: "Hug",
            description: "Gives a hug",
            parameters: [{
                name: "User",
                description: "User to hug",
                type: "string",
                required: false
            }],
            available: () => true,
            callback: (uid:string) => {

                if(uid) {
                    let snowflake: string;
                    if (uid.startsWith("<@!") && uid.endsWith(">") && uid.length === 18 + 4 && [...uid.slice(3, uid.length-1)].every(char => "0123456789".includes(char))) {
                        snowflake = uid.slice(3, uid.length - 1);
                    } else if (uid.length === 18 && [...uid].every(char => "0123456789".includes(char))) {
                        snowflake = uid;
                    } else {
                        return `🫂 ${uid.replace(/@/, '')}`;
                    }

                    return `🫂 <@!${snowflake}>`
                } 
                

                const id = Math.floor(Math.random() * this.gifs.length);
                return this.gifs[id];
            }
        }
    ]
    
    async onMessage?(message: Message): Promise<void> {
        const result = PROCESS(message);

        // if(result){
        //     if(result.command === "hug"){
        //         const id = Math.floor(Math.random()*this.gifs.length);
        //         message.channel.send(this.gifs[id]);
        //     }
        // }
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