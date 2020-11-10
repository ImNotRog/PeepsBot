const { SheetsUser } = require("./SheetsUser");
const { Utilities } = require("./Utilities")

class LittleBot {

    /**
     * @constructor
     * @param {google.auth.OAuth2} auth 
     * @param {Discord.Client} client
     */
    constructor(auth,client){
        let currmap = new Map();
        currmap.set("quotes", "1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM");
        this.sheetsUser = new SheetsUser(auth, currmap);

        this.client = client;

        this.utils = new Utilities();

        this.collectingChannels =  ["754912483390652426", "756698378116530266"]

        this.client.on("messageReactionAdd", (reaction,user) => { this.onReaction(reaction,user) });
        this.client.on("messageReactionRemove", (reaction,user) => { this.onReaction(reaction,user) });

        this.prefix = "--"
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

    async onConstruct(){
        await this.sheetsUser.SetUpSheets();

        for (const id of this.collectingChannels) {

            let channel = await this.client.channels.fetch(id)
            channel.messages.fetch({
                limit: 90
            })

        }
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

    async readLittleQuotes() {

        let rows = (await this.sheetsUser.readSheet("quotes", "Quotes")).slice(1);
        for (const row of rows) {
            row[0] = this.stripQuotes(row[0])
        }
        return rows;
    
    }

    async addLittleQuote(quote,stars) {
        quote = this.stripQuotes(quote);
        this.sheetsUser.addWithoutDuplicates("quotes", "Quotes", [quote,stars], [true, "CHANGE"])
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
    async sendSpreadsheets(message){
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
    async onReaction(reaction, user) {
        
        if (this.collectingChannels.indexOf(reaction.message.channel.id) === -1) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                return;
            }
        }
        
        if (reaction.emoji.name === "👍") {
            this.addLittleQuote(reaction.message.content, reaction.count)
        }

        
    }

}

module.exports = {LittleBot}