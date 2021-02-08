import { SheetsUser } from "./SheetsUser";
import { Utilities } from "./Utilities";

/**
 * @todo Actually add a functional cache, instead of fetching every time it saves, b/c that is cringe
 */

import Discord = require("discord.js");
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";
import { DriveUser } from "./DriveUser";

export class LittleBot implements Module {
    private sheetsUser: SheetsUser;
    private client: Discord.Client;
    private cache: string[][];
    private utils: Utilities;
    private readonly collectingChannels = ["754912483390652426", "756698378116530266"]
    private readonly prefix: string = "--";
    public helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };
    private driveUser: DriveUser;

    constructor(auth,client: Discord.Client){
        let currmap = new Map();
        currmap.set("quotes", "1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM");
        this.sheetsUser = new SheetsUser(auth, currmap);

        this.driveUser = new DriveUser(auth);

        this.client = client;

        this.cache = [];

        this.utils = new Utilities();

        this.client.on("messageReactionAdd", (reaction,user) => { this.onReaction(reaction,user) });
        this.client.on("messageReactionRemove", (reaction,user) => { this.onReaction(reaction,user) });

        this.helpEmbed = {
            title: `Help - Little Quotes Bot`,
            description: [
                `Little Bot keeps track of all sorts of quotes from Mr.Little.`,
                `Want advice? Mr.Little's got you covered.`
            ].join(` `),
            fields: [
                {
                    name: `${this.prefix}little`,
                    value: `Provides an entirely random little quote. It's often surprisingly accurate.`
                },
                {
                    name: `${this.prefix}littler [a sentence]`,
                    value: `Provides a not entirely random little quote, based off of word similarities.`
                },
                {
                    name: `${this.prefix}spreadsheets`,
                    value: `Provides the Google spreadsheet where the Little Quotes live.`
                },
            ]
        }
    }

    async onMessage(message: Discord.Message) {
        const result = PROCESS(message);
        if(result) {
            if (result.command === "spreadsheets") {
                await this.sendSpreadsheets(message);
            }

            if (result.command === "little") {
                message.channel.send(await this.randomLittleQuote());
            }

            if (result.command === "littler") {
                message.channel.send(await this.notRandomLittleQuote(result.args.join(" ")))
            }
        }
    }

    async onConstruct(){

        console.log(`Setting up Little Bot.`)
        console.log(`Setting up sheets`)
        await this.sheetsUser.onConstruct();
        await this.driveUser.onConstruct();

        this.cache = await this.fetchLittleQuotes();

        console.log(`Fetching messages from Discord channels`)
        for (const id of this.collectingChannels) {

            let channel = await this.client.channels.fetch(id)

            // @ts-ignore
            const test: Map<string, Discord.Message> = await channel.messages.fetch({
                limit: 90
            })

            // Testing why it didn't work
            // for(const key of test.keys()) {
            //     const msg = test.get(key);
            //     if (msg.reactions.cache.has('👍')) {
            //         console.log(`${msg.content} has ${msg.reactions.cache.get('👍').count} thumbs.`)
            //     }
            // }
        

        }

        console.log(`Little Bot Construction Complete!`)
    }

    stripQuotes(txt) {
        if(txt.startsWith('"')) {
            txt = txt.slice(1,txt.length - 1)
        }
        return txt;
    }

    similarities(txt1, txt2) {

        txt1 = txt1.replace(/[\.?!',"]/g, "");
        txt2 = txt2.replace(/[\.?!',"]/g, "");

        let words1 = txt1.toLowerCase().split(" ");
        let words2 = txt2.toLowerCase().split(" ");

        let similarities = 0;

        for(const word of words1) {
            if(words2.indexOf(word) !== -1) similarities ++;
        }
        return similarities
    }

    async fetchLittleQuotes() {

        let rows = (await this.sheetsUser.readSheet("quotes", "Quotes")).slice(1);
        for (const row of rows) {
            row[0] = this.stripQuotes(row[0])
        }
        return rows;
    
    }

    async readLittleQuotes() {
        return this.cache;
    }

    async addLittleQuote(quote,stars) {
        quote = this.stripQuotes(quote);
        await this.sheetsUser.addWithoutDuplicates("quotes", "Quotes", [quote,stars], [true, "CHANGE"])
        this.cache = await this.fetchLittleQuotes();
    }

    async randomLittleQuote() {
        let quotes = await this.readLittleQuotes();

        let total = 0;
        for (const row of quotes) {
            total += parseInt(row[1]);
        }
        let randomnum = Math.random() * total;

        for(const row of quotes) {
            randomnum -= parseInt(row[1])
            if(randomnum <= 0) {

                let quote = this.stripQuotes(row[0])
                console.log(`My wisdom was summoned, and I responded with ${quote}.`)
                return quote;
            }
        }
    }

    async notRandomLittleQuote(messagecontent) {
        let quotes = await this.readLittleQuotes();

        let max = -1;
        let maxmsg = "";
        for (let i = 0; i < quotes.length; i++) {
            const row = quotes[i];
            if (this.similarities(row[0],messagecontent) > max) {
                max = this.similarities(row[0],messagecontent);
                maxmsg = row[0];
            }
            
        }
        return max > 0 ? maxmsg : "Sorry, I'm not sure what to think about that.";
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async sendSpreadsheets(message: Discord.Message){
        message.channel.send({
            embed: {
                "title": "– Spreadsheets –",
                "description": "A list of PeepsBot's spreadsheets.",
                "fields": [
                    {
                        "name": "Little Quotes",
                        "value": "All of our Little Quotes can be found here: [Link](https://docs.google.com/spreadsheets/d/1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM/edit#gid=0,)"
                    },
                ],
                ...this.utils.embedInfo(message)
            }
            
        });
    }

    /**
     * 
     * @param {Discord.MessageReaction} reaction 
     * @param {*} user 
     */
    async onReaction(reaction: Discord.MessageReaction, user: any) {
        
        if (this.collectingChannels.indexOf(reaction.message.channel.id) === -1) return;

        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message: ', error);
            return;
        }
        
        
        if (reaction.emoji.name === "👍") {
            console.log(`${reaction.message.content} has ${reaction.count}`);
            this.addLittleQuote(reaction.message.content, reaction.count)
        }

        
    }

}