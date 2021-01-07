
const Discord = require("discord.js");

const { LittleBot } = require("./LittleBot");
const { TrackerBot } = require("./GroovyTrackerBot");
const { TonyBot } = require("./TonyBot");
const { CalendarBot } = require("./CalBot");
const { ReactBot } = require("./ReactBot");
const { NameChangerBot } = require("./NameChanger")
const { RoleManagerBot } = require("./RoleManager")
const { ScremBot } = require("./screm");
const { SynonymBot } = require("./SynonymBot")
const { CountdownBot } = require("./CountdownBot")
const { Utilities } = require("./Utilities")

class ProcessorBot {

    /**
     * @constructor
     * @param {google.auth.OAuth2} auth 
     * @param {FirebaseFirestore.Firestore} db
     * @param {Discord.Client} client
     * @param {string} MW
     */
    constructor(auth, db, client, MW) {

        this.destroyUsers = [];
        this.prefix = "--"

        this.approvedMusicServers = ["748669830244073533"]

        this.approvedTonyServers = ["748669830244073533", "568220839590494209"];
        this.FPERBIO = "748669830244073533";

        this.tonyActive = true;
        this.littleActive = true;
        this.trackerActive = true;
        this.bdayActive = true;
        this.reactActive = true;
        this.nameChangerActive = true;
        this.roleManagerActive = true;
        this.scremActive = true;
        this.synonymActive = true;
        this.countdownActive = true;
        this.helpActive = true;

        // this.tonyActive = false;
        // this.littleActive = false;
        // this.trackerActive = false;
        // this.bdayActive = false;
        // this.reactActive = false;
        // this.nameChangerActive = false;
        // this.roleManagerActive = false;
        // this.scremActive = false;
        // this.synonymActive = false;
        // this.countdownActive = false;
        // this.helpActive = false;
        

        if (this.tonyActive) this.tonyBot = new TonyBot(db, client);
        if (this.littleActive) this.littleBot = new LittleBot(auth, client);
        if (this.trackerActive) this.trackerBot = new TrackerBot(auth);
        if (this.bdayActive) this.calBot = new CalendarBot(auth, client);
        if (this.reactActive) this.reactBot = new ReactBot();
        if (this.nameChangerActive) this.nameChangerBot = new NameChangerBot(auth, client);
        if (this.roleManagerActive) this.roleManagerBot = new RoleManagerBot(client);
        if (this.scremActive) this.scremBot = new ScremBot();
        if (this.synonymActive) this.synonymBot = new SynonymBot(MW, client);
        if (this.countdownActive) this.countdownBot = new CountdownBot(client);

        this.client = client;

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

    async onConstruct() {

        if (this.tonyActive) await this.tonyBot.onConstruct();
        if (this.littleActive) await this.littleBot.onConstruct();
        if (this.trackerActive) await this.trackerBot.onConstruct();
        if (this.bdayActive) await this.calBot.onConstruct();
        if (this.nameChangerActive) await this.nameChangerBot.onConstruct();
        if (this.roleManagerActive) await this.roleManagerBot.onConstruct();
        if (this.synonymActive) await this.synonymBot.onConstruct();
        if (this.countdownActive) await this.countdownBot.onConstruct();

    }

    getHelpEmbeds(serverid) {
        const embeds = [];
        embeds.push(this.helpEmbed)
        embeds.push(this.littleBot.helpEmbed);
        if (this.approvedMusicServers.indexOf(serverid) !== -1) {
            embeds.push(this.trackerBot.helpEmbed)
        }
        if (this.tonyActive && this.approvedTonyServers.indexOf(serverid) !== -1) {
            embeds.push(this.tonyBot.helpEmbed)
            embeds.push(this.tonyBot.helpCommandsEmbed)
        }
        if (serverid === this.FPERBIO) {
            embeds.push(this.nameChangerBot.helpEmbed);
        }
        if(serverid === this.FPERBIO) {
            embeds.push(this.roleManagerBot.helpEmbed);
        }
        embeds.push(this.helpTechnicalEmbed)
        return embeds;
    }

    /**
     * 
     * @param {Discord.Message} message
     */
    async onMessage(message) {

        for (const id of this.destroyUsers) {
            if (message.author.id === id) {
                message.delete();
            }
        }

        if (message.author.bot) {
            if (this.trackerActive && this.approvedMusicServers.indexOf(message.guild.id) !== -1) {
                this.trackerBot.process(message);
            }

            return;
        };

        if (message.content.startsWith("!little")) {
            message.channel.send(`It's ${this.prefix}little now. I had to change it to something less generic.`)
        } else if (message.content.includes("<@!750573267026182185>") && this.littleActive) {
            message.channel.send(await this.randomLittleQuote());
        }


        if (!message.content.startsWith(this.prefix)) {
            if (this.reactActive) {
                this.reactBot.onMessage(message);
            }
            return;
        };

        const commandBody = message.content.slice(this.prefix.length);
        const args = commandBody.split(' ');
        const command = args.shift().toLowerCase();

        if (this.littleActive) {
            if (command === "spreadsheets") {
                await this.littleBot.sendSpreadsheets(message);
            }

            if (command === "little") {
                message.channel.send(await this.littleBot.randomLittleQuote());
            }

            if (command === "littler") {
                message.channel.send(await this.littleBot.notRandomLittleQuote(args.join(" ")))
            }
        }

        if (this.trackerActive) {
            if (command === "groovy" && this.approvedMusicServers.indexOf(message.guild.id) !== -1) {
                this.trackerBot.sendSpreadsheets(message);
            }
        }

        if (this.tonyActive) {
            if (command === "complete") {
                this.tonyBot.onComplete(message, args);
            }

            if (command === "get") {
                this.tonyBot.onGet(message, args);
            }

            if (command === "create") {
                this.tonyBot.onCreate(message, args);
            }

            if (command === "up" || command === "upcoming" || command === "daily") {
                this.tonyBot.dailyDose(message.channel);
            }
        }

        if (this.nameChangerActive) {
            if (command === "rename") {
                this.nameChangerBot.onChange(message, args);
            }
            if (command === "themesheet") {
                this.nameChangerBot.sendSpreadsheets(message);
            }
            if (command === "themes") {
                this.nameChangerBot.sendThemes(message);
            }
        }

        if(this.roleManagerActive) {
            if(command === "role" || command === "roles") {
                this.roleManagerBot.onRole(message);
            }
            if(command === "addrole") {
                this.roleManagerBot.addRole(message, args);
            }
            if(command === "deleterole") {
                this.roleManagerBot.deleteRole(message, args);
            }
            if (command === "editrole") {
                this.roleManagerBot.editRole(message, args);
            }
            if(command === "recacheroles") {
                this.roleManagerBot.cacheRoles();
            }
        }

        if(this.scremActive) {
            if(command === "scream" || command === "screm") {
                this.scremBot.scream(message,args);
            }
            if(command === "cursedscrem") {
                this.scremBot.scream(message,args,true);
            }
            if(command === "void" || command === "screamintothevoid" || command === "scremintothevoid") {
                this.scremBot.void(message);
            }
        }

        if(this.synonymActive) {
            if (command === "wfbo") {
                message.channel.send(await this.synonymBot.wfbo());
            }
            if (command === "bread") {
                message.channel.send(await this.synonymBot.goodmorning());
            }
        }

        if (this.helpActive) {
            if (command === "help") {
                this.utils.sendCarousel(message, this.getHelpEmbeds(message.guild.id));
            }
        }



    }
}

module.exports = { ProcessorBot };
