import * as Discord from 'discord.js';
import { Command, Module } from './Module';
import { PROCESS } from './ProcessMessage';

export class ReactBot implements Module {
    public name: "Reaction Bot";

    private reactmap:Map<string,string>
    private chainmap: Map<string, { value: string, method: string }[]>
    helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };
    public commands: Command[];

    constructor() {
        this.reactmap = new Map();
        this.reactmap.set("little", "754075455304499211")
        this.reactmap.set("trg", "788460256052117524")
        this.reactmap.set("checkpoint", "788460631715348480");
        // this.reactmap.set("cer", "788461210609647646");
        // this.reactmap.set("pain", "776522384642932766");
        // this.reactmap.set("fperbio", "776522302669062154");
        // this.reactmap.set("hw", "755144784083026101");
        // this.reactmap.set("jack", "783125462045032498");
        // this.reactmap.set("tired", "783452754625429504");

        this.chainmap = new Map();
        this.chainmap.set("🥕",
            [
                {
                    value: "^",
                    method: "CONTAINS"
                }
            ]);
        // this.chainmap.set("776525118330503189",
        //     [
        //         {
        //             value: "f",
        //             method: "ONLY"
        //         }
        //     ]);

        // More code here
        // @todo Carrot steal

        this.helpEmbed = {
            title: 'Help - React Bot',
            description: `Ever wanted your ^ to be an actual carrot? Well, want no more, for this incredibly useless bot now exists! Any time you say ^, TRG, Checkpoint, CER, or more, you'll be rewarded with a custom emoji reaction!`,
            fields: []
        }

        this.commands = [
            {
                name: "ReportTheft",
                description: "Report your carrot theft to the local police. Police as in Peepsbot. As in me.",
                parameters: [],
                available: (guild) => true,
                slashCallback: async (invoke, channel, user) => {
                    invoke(await this.reportTheft(user.id,channel));
                },
                regularCallback:async (message) => {
                    message.channel.send(await this.reportTheft(message.author.id, message.channel));
                }
            }
        ]

    }

    available(guild: Discord.Guild): boolean {
        return true;
    }

    async onConstruct(): Promise<void> { }

    isChain(content: string, chainobj: { value: string, method: string }[]) {
        for(const curr of chainobj) {
            if (curr.method === "ONLY") {
               return (content === curr.value)
            } else if (curr.method === "CONTAINS") {
                if( content.includes(curr.value)) return true;
            }
        }
        return false;
    }

    async reportTheft(theftreporter: string, channel: (Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel)) {
        // let theftreporter = msg.author.id;
        let messages = await channel.messages.fetch({
            limit: 30
        })

        let discoveredcrimescene = false;
        let discoveredculprit = false;
        let culprit: Discord.User = null;
        let caseclosed = false;
        for (const key of messages.keyArray()) {
            let message = messages.get(key);


            if (discoveredculprit) {
                await message.react('🥕');
                caseclosed = true;
                break;
            }


            if (!discoveredculprit && discoveredcrimescene) {
                if (message.reactions.cache.has('🥕')) {
                    message.reactions.cache.get('🥕')?.remove();
                    discoveredculprit = true;
                    culprit = message.author;
                    continue;
                }
            }

            if (!discoveredcrimescene && message.author.id === theftreporter && this.isChain(message.content, this.chainmap.get('🥕'))) {
                discoveredcrimescene = true;
                continue;
            }


        }

        if (!caseclosed) {
            return `Unfortunately, I was unable to solve the crime.`;
        } else {
            return `Theft reported and solved. ${culprit.username}#${culprit.discriminator} was the culprit and is stinky.`;
        }
    }

    async onMessage(msg:Discord.Message) {

        for(const key of this.reactmap.keys()) {
            if( msg.content.toLowerCase().replace(/[,\.!"']/g,'').split(" ").includes(key) ){
                msg.react(this.reactmap.get(key));
            }
        }

        for(const emoji of this.chainmap.keys()) {
            if(this.isChain(msg.content, this.chainmap.get(emoji))) {
                let messages = await msg.channel.messages.fetch({
                    limit: 10
                })

                for (const key of messages.keyArray().slice(1)) { 
                    if (!this.isChain(messages.get(key).content, this.chainmap.get(emoji))) {
                        messages.get(key).react(emoji);
                        break;
                    }
                }
            }
        }

        
    }
}