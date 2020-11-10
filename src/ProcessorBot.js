
const Discord = require("discord.js");

const cron = require("node-cron");

let moment = require("moment-timezone");
const { LittleBot } = require("./LittleBot");
const { TrackerBot } = require("./GroovyTrackerBot");
const { TonyBot } = require("./TonyBot");

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

        this.approvedTonyServers = ["748669830244073533"]

        this.tonyBot = new TonyBot(db,client);
        this.littleBot = new LittleBot(auth, client);
        this.trackerBot = new TrackerBot(auth);

        this.client.on("message", (message) => { this.onMessage(message) });

    }

    async onConstruct(){

        await this.tonyBot.onConstruct();
        await this.littleBot.onConstruct();
        await this.trackerBot.onConstruct();

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
            message.channel.send(`Under construction D:`);
        }
        
    }
}

module.exports = {ProcessorBot};
