
import * as nodefetch from 'node-fetch';
import * as Discord from 'discord.js';
import * as cron from "node-cron";
import * as famous from "./data/famous-people.json";
import { Module } from './Module';
import { PROCESS } from './ProcessMessage';

export class SynonymBot implements Module {

    private readonly prefix = '--';
    private apikey: string;
    private cache: Map<string, Object>;
    private client: Discord.Client;
    private goodmorningchannels: string[];
    private famouspeople: string[];
    public helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

    constructor(MW:string, client: Discord.Client) {
        this.apikey = MW;
        this.cache = new Map();
        this.client = client;

        this.goodmorningchannels = ["748669830244073536"];

        this.famouspeople = famous;

        this.helpEmbed = {
            title: `Help - Synonym Bot`,
            description: `Sends synonyms of specific sentences.`,
            fields: [
                {
                    name: `${this.prefix}bread`,
                    value: `Sends a synonym version of "Good morning epic gamers let's get the bread".`
                },
                {
                    name: `${this.prefix}wfbo`,
                    value: `Sends a synonym version of "Weird flex but ok".`
                },
                {
                    name: `Why Don't You Add More?`,
                    value: `API limits.`
                },

            ]
        }
    }

    available(message: Discord.Message): boolean {
        return true;
    }
    

    async onMessage(message: Discord.Message): Promise<void> {
        const result = PROCESS(message);
        if(result) {
            if (result.command === "wfbo") {
                message.channel.send(await this.wfbo(), { allowedMentions: { parse: [] } });
            }
            if (result.command === "bread") {
                message.channel.send(await this.goodmorning(), { allowedMentions: { parse: [] } });
            }
        }
    }

    async onConstruct(): Promise<void> {

        await this.goodmorning();
        await this.wfbo();

        cron.schedule("0 7 * * *", () => {
            this.goodmorningall();
        }, 
        {
            timezone: `America/Los_Angeles`
        });
        
    }

    async goodmorningall(): Promise<void> {

        let quotes = []
        for(let i = 0; i < 8; i++)
            quotes.push({
                name: `"${await this.goodmorning()}"`,
                value: `- ${await this.choose(this.famouspeople)}`
            })

        for (const id of this.goodmorningchannels) {
            let channel = await this.client.channels.fetch(id)
            if(channel instanceof Discord.TextChannel)
                channel.send( {
                    embed: {
                        title: `Let's Get the Bread`,
                        description: `Another morn, another 8 inspirational quotes from famous historical individuals.`,
                        color: 111111,
                        fields: quotes
                    }
                })
        }
    }

    async getData(word:string): Promise<any> {

        if(this.cache.has(word)) {
            return this.cache.get(word);
        }

        let responsiblechars = "abcdefghijklmnopqrstuvwxyz";

        word = word.toLowerCase();

        if(word.startsWith("[")) {
            return word.slice(1,word.length - 1);
        }

        for(const char of word) {
            if(!responsiblechars.includes(char)) {
                return word;
            }
        }
        let response = await nodefetch.default(`https://www.dictionaryapi.com/api/v3/references/thesaurus/json/${word}?key=${this.apikey}`);
        let data = await response.json();

        this.cache.set(word, data);
        return data;
    }

    async getSynonyms(word:string): Promise<string|string[][]> {
        let data = await this.getData(word);
        if (typeof data === "string" ) {
            return data;
        }
        if( typeof data[0] === "string") {
            return word;
        }
        return data.map(def => def.meta.syns.flat());
    }


    choose(arr: any[]) {
        return arr[Math.floor(arr.length *  Math.random())];
    }

    async synonymizeSentence(sentence: string): Promise<string> {
        let words = sentence.split(" ");
        let newwords = [];
        for(const word of words) {
            let syns = await this.getSynonyms(word);
            if(typeof syns === "string") {
                newwords.push(syns);
            } else {
                newwords.push( this.choose( syns[0] ))
            }
        }
        return newwords.join(" ");
    }

    cap(str: string) {
        return str[0].toUpperCase() + str.slice(1);
    }

    async wfbo(): Promise<string> {
        return this.cap( await this.synonymizeSentence("weird boast but ok") )
    }

    async goodmorning(): Promise<string> {
        return this.cap( await this.synonymizeSentence("good morning epic people let's get [the] bread") );
    }
}