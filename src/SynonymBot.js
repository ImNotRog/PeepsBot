
const fetch = require('node-fetch')
const Discord = require('discord.js')
const cron = require("node-cron");
// const fs = require("fs");
const famous = require("../data/famous-people.json");

class SynonymBot {
    /**
     * @constructor
     * @param {string} MW API key
     * @param {Discord.Client} client
     */
    constructor(MW, client) {
        this.apikey = MW;
        this.cache = new Map();
        this.client = client;

        this.goodmorningchannels = ["748669830244073536"];

        this.famouspeople = famous;
    }

    async onConstruct(){

        await this.goodmorning();
        await this.wfbo();

        cron.schedule("0 7 * * *", () => {
            this.goodmorningall();
        });
        
    }

    async goodmorningall() {

        let quotes = []
        for(let i = 0; i < 8; i++)
            quotes.push({
                name: `"${await this.goodmorning()}"`,
                value: `- ${await this.choose(this.famouspeople)}`
            })

        for (const id of this.goodmorningchannels) {
            let channel = await this.client.channels.fetch(id)
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

    /**
     * 
     * @param {string} word 
     */
    async getData(word) {

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
        let response = await fetch(`https://www.dictionaryapi.com/api/v3/references/thesaurus/json/${word}?key=${this.apikey}`);
        let data = await response.json();

        this.cache.set(word, data);
        return data;
    }

    async getSynonyms(word) {
        let data = await this.getData(word);
        if (typeof data === "string" ) {
            return data;
        }
        if( typeof data[0] === "string") {
            return word;
        }
        return data.map(def => def.meta.syns.flat());
    }


    /**
     * 
     * @param {any[]} arr 
     */
    choose(arr) {
        return arr[Math.floor(arr.length *  Math.random())];
    }

    /**
     * 
     * @param {string} sentence 
     */
    async synonymizeSentence(sentence) {
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

    cap(str) {
        return str[0].toUpperCase() + str.slice(1);
    }

    async wfbo() {
        return this.cap( await this.synonymizeSentence("weird boast but ok") )
    }

    async goodmorning() {
        return this.cap( await this.synonymizeSentence("good morning epic people let's get [the] bread") );
    }
}
module.exports = { SynonymBot };