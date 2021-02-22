import { SheetsUser } from "./SheetsUser";
import { Utilities } from "./Utilities";
import Discord = require("discord.js");
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";

export class LittleBot implements Module {
    private sheetsUser: SheetsUser;
    private client: Discord.Client;
    private cache: Map<string, any[][]>;
    private readonly collectingChannels = ["754912483390652426", "756698378116530266", "811357805444857866", "811418821205819393"]
    private readonly prefix: string = "--";
    public helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

    constructor(auth, client: Discord.Client) {

        let currmap = new Map();
        currmap.set("quotes", "1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM");
        this.sheetsUser = new SheetsUser(auth, currmap);

        this.client = client;

        this.cache = new Map();

        this.client.on("messageReactionAdd", (reaction, user) => { this.onReaction(reaction, user) });
        this.client.on("messageReactionRemove", (reaction, user) => { this.onReaction(reaction, user) });

        this.helpEmbed = {
            title: `Help - Quotes Bot`,
            description: `A bot for keeping teacher quotes, often horribly out of context.`,
            fields: [
                {
                    name: `${this.prefix}[teacher name]`,
                    value: `Spews out a random quote from that teacher.`
                },
                {
                    name: `How to Add Quotes`,
                    value: `In a designated channel specifically on select servers, you can enter a quote of the format: \n` +
                        `"[Quote Content]" - [Teacher Last Name Only, no Shenanigans]\n` + 
                        `Then, react to quotations with 👍 to add them. (The more 👍s a quote has, the higher probability it's chosen.)`
                }
            ]
        }
    }
    
    available(message: Discord.Message): boolean {
        return true;
    }

    async onMessage(message: Discord.Message): Promise<void> {
        const result = PROCESS(message);
        if(result) {
            let teach = result.command[0].toUpperCase() + result.command.slice(1).toLowerCase();
            if(this.cache.has(teach)) {
                if (teach === "Little" || message.guild.id === '748669830244073533') {
                    let q = this.randomQuote(teach);

                    message.channel.send(q.length < 400 ? q : q.slice(0, 400) + '... [quote truncated]', { allowedMentions: { parse: [] } });
                }
            }

            if(result.command === "quotescache" && result.args.length === 1) {
                const a = Utilities.capitilize(result.args[0]);
                if(this.cache.has(a)) {
                    let str = this.cache.get(a).map(a => a.map(b => b.slice(0, 100)).join(' - ')).join('\n');
                    message.channel.send({
                        embed: {
                            title: `Quotes Cache for ${a}`,
                            description: `${str.length < 1000 ? str : str.slice(0,1000) + '... [truncated]'}`,
                            ...Utilities.embedInfo(message)
                        }
                    })
                }
            }

            if (["quotes", "quotesheet", "quotessheet"].includes(result.command) && message.guild.id === '748669830244073533') {
                message.channel.send({
                    embed: {
                        title: `Quotes Sheet`,
                        description: `[Link](https://docs.google.com/spreadsheets/d/1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM/edit#gid=1331218902)`,
                        ...Utilities.embedInfo(message)
                    }
                }) 
            }
        }

    }

    async addQuote(quote:string, teacher:string, stars:number) {
        if(this.cache.has(teacher)) {
            await this.sheetsUser.addWithoutDuplicates("quotes", teacher, [quote, stars], [true, "CHANGE"]);
            this.cache.set(teacher, await this.sheetsUser.readSheet("quotes", teacher));
        } else {
            await this.sheetsUser.createSubsheet( "quotes", teacher, {
                columnResize: [800,100],
                headers: ["Quote", "Number"]
            })
            await this.sheetsUser.addWithoutDuplicates("quotes", teacher, [quote, stars], [true, "CHANGE"]);
            this.cache.set(teacher, await this.sheetsUser.readSheet("quotes", teacher));
        }
    }

    async onConstruct(): Promise<void> {

        await this.sheetsUser.onConstruct();
        let subsheets = (await this.sheetsUser.getSubsheets("quotes"));

        let valueranges = await this.sheetsUser.bulkRead("quotes");

        for (const valuerange of valueranges) {
            let range = valuerange.range;
            if (range) {
                let cat = range.slice(0, range.lastIndexOf('!')).replace(/['"]/g, '');
                this.cache.set(cat, valuerange.values);
            }
        }

        for (const id of this.collectingChannels) {

            let channel = await this.client.channels.fetch(id)

            // @ts-ignore
            const test: Map<string, Discord.Message> = await channel.messages.fetch({
                limit: 90
            })
        }
    }

    async onReaction(reaction: Discord.MessageReaction, user: any) {

        if (this.collectingChannels.indexOf(reaction.message.channel.id) === -1) return;

        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message: ', error);
            return;
        }

        if (reaction.emoji.name === "👍") {

            let content = reaction.message.content;
            let teacher = "Little";

            if(content.includes("-")) {
                let nowhitespace = content.replace(/ /g, '');
                teacher = nowhitespace.slice(nowhitespace.lastIndexOf('-')+1);

                content = content.slice(0, content.lastIndexOf("-"));
            }

            teacher = teacher[0].toUpperCase() + teacher.slice(1).toLowerCase();

            if(content.includes(`"`) && content.indexOf(`"`) !== content.lastIndexOf(`"`)) {
                content = content.slice(content.indexOf(`"`)+1,content.lastIndexOf(`"`));
            }

            console.log(`${content} -- ${teacher} has ${reaction.count} stars.`);

            this.addQuote(content, teacher, reaction.count);
        }


    }
    
    randomQuote(teacher:string):string {
        let total = 0;
        let cache = this.cache.get(teacher);
        for(let i = 1; i < cache.length; i++) {
            total += parseInt(cache[i][1]);
        }

        let rand = Math.random() * total;
        for (let i = 1; i < cache.length; i++) {
            rand -= parseInt(cache[i][1]);
            if(rand < 0) {
                return cache[i][0];
            }
        }
        return "Uh oh, something went wrong."
    }
}