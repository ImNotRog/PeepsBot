const {SheetsUser} = require("./SheetsUser");
const {TonyBot} = require("./TonyBot");
const Discord = require("discord.js");

let moment = require("moment-timezone");

class ProcessorBot {

    /**
     * @constructor
     * @param {google.auth.OAuth2} auth 
     * @param {FirebaseFirestore.Firestore} db
     * @param {Discord.Client} client
     */
    constructor(auth,db,client) {

        this.client = client;

        this.destroyUsers = [];
        this.prefix = "--"

        this.daysmap = new Map();

        let currmap = new Map();
        currmap.set("quotes", "1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM");
        currmap.set("music", "17YiJDj9-IRnP_sPg3HJYocdaDkkFgMKfNC6IBDLSLqU");
        this.sheetsUser = new SheetsUser(auth, currmap);

        this.colors = 
        [
            this.RGBtoObj(255, 0, 0), 
            this.RGBtoObj(255, 255, 0), 
            this.RGBtoObj(0, 255, 0), 
            this.RGBtoObj(0, 255, 255), 
            this.RGBtoObj(0, 0, 255), 
            this.RGBtoObj(255, 0, 255), 
            this.RGBtoObj(255, 150, 0), 
            this.RGBtoObj(0, 0, 0)
        ];

        this.collectingChannels = ["754912483390652426", "756698378116530266"]
        this.updateChannels = ["748669830244073536", "750186902879076433","744415364376559746"]; // Actual
        // this.updateChannels = ["750804960333135914"] // Redirect

        this.musicBots = ["234395307759108106"]

        this.approvedMusicServers = ["748669830244073533"]

        this.approvedTonyServers = ["748669830244073533"]

        this.tonyBot = new TonyBot(db);

        this.reference = {};

        this.interval = 150000;

        this.client.on("message", (message) => { this.onMessage(message) });
        this.client.on("messageReactionAdd", (reaction,user) => { this.onReaction(reaction,user) });
        this.client.on("messageReactionRemove", (reaction,user) => { this.onReaction(reaction,user) });

    }

    /**
     * 
     * @param {Discord.Client} client 
     */
    async onConstruct(client){

        let embeds = await this.tonyBot.onConstruct();
        await this.sheetsUser.SetUpSheets();

        for (const id of this.collectingChannels) {

            let channel = await client.channels.fetch(id)
            channel.messages.fetch({
                limit: 90
            })

        }

        for (const id of this.updateChannels) {
            let channel = await client.channels.fetch(id)
            for(const embed of embeds) {
                await channel.send({embed});
            }
        }
        
        let currinterval = setInterval(() => {
            this.refresh();
        }, this.interval);
    }

    async refresh() {
        console.log("Refreshing...")
        let embeds = await this.tonyBot.refresh();
        for (const id of this.updateChannels) {
            let channel = await this.client.channels.fetch(id);
            for(const embed of embeds) {
                await channel.send({embed});
            }
        }
    }

    RGBtoObj(r, g, b) {
        return {
            red: r / 255,
            green: g / 255,
            blue: b / 255
        }
    }

    getDay() {
        return moment.tz("America/Los_Angeles").day();
    }

    getTodayStr(){
        return moment.tz("America/Los_Angeles").format("ddd MM/DD/YYYY");
    }

    async readList() {
        return this.sheetsUser.readSheet("music", "Groovy");
    }

    async addGroovyEntry(title,link) {
        this.sheetsUser.addWithoutDuplicates("music", "Groovy", [title,link,1,this.getTodayStr()], [true,true, (x) => parseInt(x)+1, "CHANGE"]);
    }

    /**
     * @param {String} txt 
     */
    async processPlayMessage(txt){
        if (txt && txt.startsWith("[")) {
            let endtitle = txt.indexOf("](");
            let title = txt.slice(1, endtitle);

            let startlink = endtitle + 2;
            let endlink = txt.indexOf(") [<@")
            let link = txt.slice(startlink, endlink);

            await this.addGroovyEntry(title, link)
        }
        
    }

    stripQuotes(txt) {
        if(txt.startsWith('"')) {
            txt = txt.slice(1,txt.length - 1)
        }
        return txt;
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
        max > 0 ? console.log(`My brilliant wisdom was summoned, and I responded with ${maxmsg}.`) : "";
        return max > 0 ? maxmsg : "Sorry, I'm not sure what to think about that.";
    }
    
    now() {
        return moment.tz("America/Los_Angeles").format();
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async help(message) {
        let m = await message.channel.send(this.helpEmbed(message,0))

        if(this.approvedTonyServers.indexOf( message.guild.id ) === -1) {
            await m.react("❌");

            const filter = (reaction, user) => {
                return ['❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };

            try {
                await m.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] });
            } catch(err) {}

            m.delete();

            return true;
            
        }

        await m.react("❌")
        await m.react("➡")
        this.helpMenu(m, 0, message)
        
    }

    /**
     * 
     * @param {Discord.message} message 
     * @param {*} num 
     */
    helpEmbed(message,num) {
        if(num === 0){
            return {
                "embed": {
                    "title": "Help",
                    "description": "I'm a bot that spews out random tidbits of Mr.Little's wisdom.",
                    "color": 1111111,
                    "timestamp": this.now(),
                    "author": {
                    "name": "Mr. Little",
                    "url": "https://pausd.schoology.com/user/52984930/info",
                    "icon_url": "https://cdn.discordapp.com/embed/avatars/2.png"
                    },
                    "fields": [
                        {
                            "name": this.prefix+"little",
                            "value": "A completely random Mr.Little quote."
                        },
                        {
                            "name": this.prefix+"littler [sentence]",
                            "value": "A less random Mr.Little quote that has the most words in common with your sentence."
                        },
                        {
                            "name": this.prefix+"spreadsheets",
                            "value": "Gives the spreadsheet where all the Mr.Little quotes live."
                        }
                    ],
                    "footer": {
                        "text": `Requested by ${message.author.username}`,
                        "icon_url": message.author.displayAvatarURL()
                    }
                    
                }
            }
        } else if(num === 1) {
            return {
                "embed": {
                    "title": "Help",
                    "description": "I'm also a bot that keeps track of your TRGs and converts them to currency.",
                    "color": 1111111,
                    "timestamp": this.now(),
                    "author": {
                    "name": "Mr. Little",
                    "url": "https://pausd.schoology.com/user/52984930/info",
                    "icon_url": "https://cdn.discordapp.com/embed/avatars/2.png"
                    },
                    "fields": [
                        {
                            "name": this.prefix+"create",
                            "value": "Create a profile."
                        },
                        {
                            "name": this.prefix+"get TRG #-#",
                            "value": "Returns the status on your TRG, as stored in the database."
                        },
                        {
                            "name": this.prefix+"complete TRG #-# ['SEC 1' or 'ALL']",
                            "value": "Completes the given TRG."
                        }
                    ],
                    "footer": {
                        "text": `Requested by ${message.author.username}`,
                        "icon_url": message.author.displayAvatarURL()
                    }
                    
                }
            }
        }
    }

    /**
     * 
     * @param {Discord.Message} helpmessage 
     * @param {Discord.Message} origmessage
     */
    async helpMenu(helpmessage,state,origmessage){
        
        const filter = (reaction, user) => {
            return ['➡','❌'].includes(reaction.emoji.name) && user.id === origmessage.author.id;
        };

        let collected;
        try {
            collected = await helpmessage.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] });
        } catch(err) {
            helpmessage.delete();
            return true;
        }
        
        const reaction = collected.first();
        if(reaction.emoji.name === '❌') {
            helpmessage.delete();
        } else {
            await reaction.users.remove(origmessage.author.id);
            if(state === 1){
                await helpmessage.edit(this.helpEmbed(origmessage,0));
                this.helpMenu(helpmessage, 0, origmessage);
            } else {
                await helpmessage.edit(this.helpEmbed(origmessage,1));
                this.helpMenu(helpmessage,1,origmessage)
            }
        }
    }

    /**
     * 
     * @param {Discord.Message} message
     */
    async onMessage(message) {

        for(const id of this.destroyUsers) {
            if(message.author.id === id) {
                message.delete();
            }
        }

        if (message.author.bot) {
            if(this.approvedMusicServers.indexOf(message.guild.id) !== -1 && this.musicBots.indexOf( message.author.id ) !== -1 && message.embeds[0]){

                let prevmsg = await message.channel.messages.fetch({
                    limit: 2
                })
                let keys = prevmsg.keys()
                keys.next();
                let prevmsgkey = keys.next().value;
                let content = prevmsg.get(prevmsgkey).content

                if(!content.startsWith("-np")){
                    (this.processPlayMessage(message.embeds[0].description))
                }

            }
            
            return;
        };

        if(message.content === "!little") {
            message.channel.send(`It's ${this.prefix}little now. I had to change it to something less generic.`)
        } else if(message.content === "<@!750573267026182185>") {
            message.channel.send(await this.randomLittleQuote());
        }

        if (!message.content.startsWith(this.prefix)) return;

        const commandBody = message.content.slice(this.prefix.length);
        const args = commandBody.split(' ');
        const command = args.shift().toLowerCase();

        if(command === "spreadsheets") {
            message.channel.send(new Discord.MessageEmbed({
                "title": "– Spreadsheets –",
                "description": "A list of PeepsBot's spreadsheets.",
                "color": "#00ffff",
                "fields": [
                    {
                        "name": "Little Quotes",
                        "value": "All of our Little Quotes can be found here: [Link](https://docs.google.com/spreadsheets/d/1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM/edit#gid=0,)"
                    },
                ],
                "footer": {
                    "text": `Requested by ${message.author.username}`,
                    "icon_url": message.author.displayAvatarURL()
                }
            }));
        }

        if(command === "groovy" && this.approvedMusicServers.indexOf(message.guild.id) !== -1) {
            message.channel.send(new Discord.MessageEmbed({
                "title": "– Groovy Spreadsheet –",
                "description": "F Period Bio Gang Groovy",
                "color": "#00ffff",
                "fields": [
                    {
                        "name": "Our Groovy History",
                        "value": "All of the Groovy songs played can be found here: [Link](https://docs.google.com/spreadsheets/d/17YiJDj9-IRnP_sPg3HJYocdaDkkFgMKfNC6IBDLSLqU/edit#gid=0)"
                    }
                ],
                "footer": {
                    "text": `Requested by ${message.author.username}`,
                    "icon_url": message.author.displayAvatarURL()
                }
            }));
        }
        
        if(command === "complete") {
            this.tonyBot.onComplete(message,args);
        }

        if(command === "get"){
            this.tonyBot.onGet(message,args);
        }

        if(command === "create") {
            this.tonyBot.onCreate(message,args);
            
        }

        if(command === "little") {
            message.channel.send(await this.randomLittleQuote());
        }

        if(command === "littler") {
            message.channel.send(await this.notRandomLittleQuote(args.join(" ")))
        }
        
        if (command === "profile") {
            message.channel.send("Hi wonderful biologists! I'm Mr. Little, biology teacher, TOSA, and SELF mentor!");
        }

        if(command === "help") {
            this.help(message);
        }
        
    }

    /**
     * 
     * @param {Discord.MessageReaction} reaction 
     * @param {*} user 
     */
    async onReaction(reaction, user) {
        
        if (this.collectingChannels.indexOf(reaction.message.channel.id) === -1) return;

        // When we receive a reaction we check if the reaction is partial or not
        if (reaction.partial) {
            // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                return;
            }
        }

        // // Now the message has been cached and is fully available
        // // The reaction is now also fully available and the properties will be reflected accurately:
        // console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
        
        if (reaction.emoji.name === "👍") {
            this.addLittleQuote(reaction.message.content, reaction.count)
            console.log(`"${reaction.message.content}" has ${reaction.count} thumbs ups!`);
        }

        
    }
}

module.exports = {ProcessorBot};
