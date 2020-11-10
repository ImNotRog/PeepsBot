const { SheetsUser } = require("./SheetsUser");
const { TonyBot } = require("./TonyBot");
const Discord = require("discord.js");

const cron = require("node-cron");

let moment = require("moment-timezone");
const { LittleBot } = require("./LittleBot");

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

        this.musicBots = ["234395307759108106"]

        this.approvedMusicServers = ["748669830244073533"]

        this.approvedTonyServers = ["748669830244073533"]

        this.tonyBot = new TonyBot(db,client);
        this.littleBot = new LittleBot(auth, client);

        this.interval = 150000;

        this.client.on("message", (message) => { this.onMessage(message) });

    }

    async onConstruct(){

        await this.tonyBot.onConstruct();
        await this.littleBot.onConstruct();

        await this.sheetsUser.SetUpSheets();

        let currinterval = setInterval(() => {
            this.refresh();
        }, this.interval);
    }

    async refresh() {
        console.log("Refreshing...")
        await this.tonyBot.refresh();
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
    
    now() {
        return moment.tz("America/Los_Angeles").format();
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
            await this.littleBot.sendSpreadsheets(message);
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
