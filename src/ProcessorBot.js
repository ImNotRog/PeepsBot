
const Discord = require("discord.js");

const cron = require("node-cron");

let moment = require("moment-timezone");
const { LittleBot } = require("./LittleBot");
const { TrackerBot } = require("./GroovyTrackerBot");
const { TonyBot } = require("./TonyBot");
const { Utilities } = require("./Utilities")

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

        this.approvedMusicServers = ["748669830244073533"]
        this.approvedTonyServers = ["748669830244073533", "568220839590494209"];

        this.tonyBot = new TonyBot(db,client);
        this.littleBot = new LittleBot(auth, client);
        this.trackerBot = new TrackerBot(auth);

        this.helpEmbed = {
            title: `Help - General`,
            description: [ 
                `This is a very long help section, much like the girthy substance of a complete TRG.`,
                `I do a lot of things, from quotes to alerts. You can use those arrows down there to scroll around,`,
                `which I don't think I really have to say, but the brick to human ratio is surprisingly high.`,
                `Alright, go read and exercise that 3 second attention span. GLHF`
            ].join(` `)
        }

        this.helpTechnicalEmbed = {
            title: `Help - Details for Nerds`,
            description: `If you're a CS nerd, here's all you need to know.`,
            fields: [
                {
                    name: `Contact Me!`,
                    value: `Rog#7499 is the owner of this bot. Contact him to add to your server or sign channels up for alerts.`
                },
                {
                    name: `Invite Link`,
                    value: `Not available, ask Rog#7499 for one. This is a mainly private bot.`
                },
                {
                    name: `Github`,
                    value: `All my code is on Github: https://github.com/BubbyBabur/PeepsBot`
                },
                {
                    name: `NodeJS`,
                    value: [
                        `Built using NodeJS, and if you use any other language, I *will* block you.`,
                        `Node Packages can be found in the Github.`,
                        `I use Heroku to host the bot and use Firebase's Firestore service to store data. It's a straight pain in the butt, but it gets the job done.`,
                        `I also use Google API to store some data in Google spreadsheets, which is sick.`
                    ].join(`\n`)
                },
            ]
        }

        this.utils = new Utilities();

        this.client.on("message", (message) => { this.onMessage(message) });

    }

    async onConstruct(){

        await this.tonyBot.onConstruct();
        await this.littleBot.onConstruct();
        await this.trackerBot.onConstruct();

    }

    getHelpEmbeds(serverid) {
        const embeds = [];
        embeds.push(this.helpEmbed)
        embeds.push(this.littleBot.helpEmbed);
        if(this.approvedMusicServers.indexOf(serverid) !== -1) {
            embeds.push(this.trackerBot.helpEmbed)
        }
        if(this.approvedTonyServers.indexOf(serverid) !== -1) {
            embeds.push(this.tonyBot.helpEmbed)
            embeds.push(this.tonyBot.helpCommandsEmbed)
        }
        embeds.push(this.helpTechnicalEmbed)
        return embeds;
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
            if(this.approvedMusicServers.indexOf(message.guild.id) !== -1){
                this.trackerBot.process(message);
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
            await this.littleBot.sendSpreadsheets(message);
        }

        if(command === "groovy" && this.approvedMusicServers.indexOf(message.guild.id) !== -1) {
            this.trackerBot.sendSpreadsheets(message);
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

        if(command === "up" || command === "upcoming" || command === "daily") {
            this.tonyBot.dailyDose(message.channel);
        } 

        if(command === "little") {
            message.channel.send(await this.littleBot.randomLittleQuote());
        }

        if(command === "littler") {
            message.channel.send(await this.littleBot.notRandomLittleQuote(args.join(" ")))
        }
        
        if (command === "profile") {
            message.channel.send("Hi wonderful biologists! I'm Mr. Little, biology teacher, TOSA, and SELF mentor!");
        }

        if(command === "help") {
            // message.channel.send(`Under construction D:`);
            this.utils.sendCarousel(message,this.getHelpEmbeds(message.guild.id));
        }
        
    }
}

module.exports = {ProcessorBot};
