
/**
 * @todo God dang it uses so much repetitive code gotta fix that, like for the error checking
 */

const {
    TonyBotAccountant
} = require("./TonyBotAccountant");

const {
    UserObj,
    UserUnitObj,
    UserTRG,
    UserCheckpoint,
    TRG,
    Checkpoint,
    UnitObj,
    DUE
} = require("./tonyclasses");

let moment = require("moment-timezone");

const {
    BioParser
} = require("./BP")


const cron = require("node-cron");
const schedule = require("node-schedule");

// To aid in Intellisense, will comment out when not developing
const Discord = require("discord.js");

class TonyBot extends TonyBotAccountant {
    /**
     * @constructor
     * @param {FirebaseFirestore.Firestore} db
     * @param {Discord.Client} client
     */
    constructor(db,client) {

        super(db);
        this.sectionTitles = ["Take Notes", "Applying the Concepts", "Summary"]
        this.BP = new BioParser();
        this.client = client;

        this.dailyChannels = ["748669830244073536"];
        // this.dailyChannels = ["750804960333135914"] // Redirect

        cron.schedule(`5 15 * * 1-5`, 
        () => {this.sendDailyDose()}, 
        {
            timezone: `America/Los_Angeles`
        })

    }

    async onConstruct() {
        await super.onConstruct();
        return await this.refresh();
    }

    async refresh() {

        let updateembeds = [];

        const sassymessages = [
            "Yes, there's another one.",
            "agioasgASDGLASDg asgASGawLIJliu waLJKfaJLEGQWLIJGkjasfd",
            "Hey, I'm just the messenger.",
            "Look, I'm failing too, ok?",
        ]

        let maps = await this.BP.getTRGandCheckpointsAndUnits();

        let units = maps.UNITS;

        for (const key of units.keys()) {
            let unit = parseInt(key);
            if (!this.unitExists(unit)) {
                await this.setUnit(unit, units.get(key));
                updateembeds.push({
                    title: `ALERT: Unit ${unit}: ${units.get(key).TITLE}`,
                    description: `**Unit ${unit} was posted.** Here's to another month of death!`,
                    fields: this.UnitToFields(unit),
                    ...this.basicEmbedInfo()
                })
            }
            const changes = await this.setUnitInfo(unit, units.get(key));
        }

        let trgs = maps.TRGS;
        let checkpoints = maps.CHECKPOINTS;
        for (const key of trgs.keys()) {
            let [unit, num] = JSON.parse(key);
            if (!this.unitExists(unit)) {
                await this.setUnit(unit, {});
                updateembeds.push({
                    title: `ALERT: Unit ${unit}`,
                    description: `**Unit ${unit} was posted.** Here's to another month of death!`,
                    ...this.basicEmbedInfo()
                })
            }
            if (!this.TRGExists(unit, num)) {
                updateembeds.push({
                    title: `***ALERT:*** **TRG ${unit}-${num}: ${trgs.get(key).TITLE}** POSTED`,
                    description: `**TRG ${unit}-${num}: ${trgs.get(key).TITLE}** was just posted. ${sassymessages[Math.floor(Math.random() * sassymessages.length)]}`,
                    fields: this.TRGtoFields(trgs.get(key)),
                    ...this.basicEmbedInfo()
                })
                await this.setTRG(unit, num, trgs.get(key));
            }
            const changes = await this.setTRGinfo(unit, num, trgs.get(key));
            this.scheduleTRG(this.units.get(""+unit).TRGS.get(""+num));

            if (changes.GRADED && changes.GRADED[1] === true) {
                updateembeds.push({
                    title: `ALERT: TRG ${unit}-${num} GRADED`,
                    description: `TRG ${unit}-${num} was just graded. Go look.`,
                    fields: [{
                            name: "Title",
                            value: `${trgs.get(key).TITLE ? trgs.get(key).TITLE : `No title has been provided`}`
                        },
                        {
                            name: "It was Due",
                            value: this.formatTime(trgs.get(key).DUE)
                        }
                    ],
                    ...this.basicEmbedInfo()
                });
            }
        }

        for (const key of checkpoints.keys()) {
            let [unit, num] = JSON.parse(key);
            if (!this.unitExists(unit)) {
                await this.setUnit(unit,{});
                updateembeds.push({
                    title: `ALERT: Unit ${unit}`,
                    description: `**Unit ${unit} was posted.** Here's to another month of death!`,
                    ...this.basicEmbedInfo()
                })
            }
            if (!this.CheckpointExists(unit, num)) {
                updateembeds.push({
                    title: `***ALERT:*** **Checkpoint ${unit}-${num}: ${checkpoints.get(key).TITLE}** POSTED`,
                    description: `**Checkpoint ${unit}-${num}: ${checkpoints.get(key).TITLE}** was just posted. ${sassymessages[Math.floor(Math.random() * sassymessages.length)]}`,
                    fields: this.CheckpointToFields(checkpoints.get(key)),
                    ...this.basicEmbedInfo()
                })
                await this.setCheckpoint(unit, num, checkpoints.get(key));
            }
            const changes = await this.setCheckpointInfo(unit, num, checkpoints.get(key));
            this.scheduleCheckpoint(this.units.get(""+unit).CHECKPOINTS.get(""+num));

            if (changes.GRADED && changes.GRADED[1] === true) {
                updateembeds.push({
                    title: `ALERT: CHECKPOINT ${unit}-${num} GRADED`,
                    description: `Checkpoint ${unit}-${num} was just graded. Go look.`,
                    fields: [{
                            name: "Title",
                            value: `${checkpoints.get(key).TITLE ? checkpoints.get(key).TITLE : `No title has been provided`}`
                        },
                        {
                            name: "The Date was",
                            value: this.formatTime(checkpoints.get(key).DUE)
                        },
                        {
                            name: "Points",
                            value: checkpoints.get(key).POINTS
                        }
                    ],
                    ...this.basicEmbedInfo()
                });
            }
        }

        await this.completeUsers();

        return updateembeds;
    }

    /* ACCESSORS */

    /* LOW LEVEL */

    basicEmbedInfo() {
        return {
            "color": 1111111,
            "timestamp": this.now(),
            "author": {
                "name": "Mr. Little",
                "url": "https://pausd.schoology.com/user/52984930/info",
                "icon_url": "https://cdn.discordapp.com/embed/avatars/2.png"
            },
        }
    }

    embedInfo(message) {
        return {
            ...this.basicEmbedInfo(),
            "footer": {
                "text": `Requested by ${message.author.username}`,
                "icon_url": message.author.displayAvatarURL()
            }
        }
    }

    /* MORE EMBED STUFF */
    TRGtoFields(trg) {

        let docfield = [];
        if (trg.DOCURL) {
            docfield.push({
                name: "Google Doc URL",
                value: `[Google Doc URL](${trg.DOCURL})`,
                inline: true
            })
        }

        return [{
                name: "Due",
                value: this.formatTime(trg.DUE),
                inline: true
            },
            {
                name: "Has Been Graded",
                value: trg.GRADED ? "Yes" : "Not yet",
                inline: true
            },
            {
                name: "Points",
                value: trg.POINTS,
                inline: true
            },
            {
                name: "Description",
                value: trg.DESCRIPTION
            },
            ...docfield,
            {
                name: "Schoology URLs",
                value: `${trg.OTHERURL ? `[Original Link](${trg.OTHERURL}), ` : ""}` +
                    `${trg.SUBMITURL ? `[Submission Link](${trg.SUBMITURL})` : ""}`,
                inline: true
            }
        ]
    }

    CheckpointToFields(checkpoint) {
        return [{
                name: "Due",
                value: this.formatTime(checkpoint.DUE),
                inline: true
            },
            {
                name: "Has Been Graded",
                value: checkpoint.GRADED ? "Yes" : "Not Yet",
                inline: true
            },
            {
                name: "Points",
                value: checkpoint.POINTS,
                inline: true
            },
        ]
    }

    UnitToFields(unit) {
        let fields = []

        if (unit.LINK) {
            fields.push({
                name: "Folder",
                value: `[Link](${unit.LINK})`,
                inline: true
            })
        }

        if (unit.CALENDAR) {
            fields.push({
                name: "Calendar",
                value: `[Link](${unit.CALENDAR})`,
                inline: true
            })
        }

        if (unit.SLIDES) {
            fields.push({
                name: "Slides",
                value: `[Link](${unit.SLIDES})`,
                inline: true
            })
        }

        if (unit.DISCUSSION) {
            fields.push({
                name: "Help Discussion",
                value: `[Link](${unit.DISCUSSION})`
            })
        }

        return fields;
    }

    /**
     * 
     * @param {string} str
     * @returns {number[] | boolean} 
     */
    dashNotationToNums(str) {
        let splits = str.split("-");
        if (splits.length !== 2) return false;

        let unit = parseInt(splits[0]);
        if (isNaN(unit)) return false;

        let num = parseInt(splits[1]);
        if (isNaN(num)) return false;

        return [unit, num];
    }

    /* ALERT */
    /**
     * 
     * @param {Discord.TextChannel} channel 
     */
    dailyDose(channel) {
        // diff > 0 => due soon
        /**
         * @type {DUE[]}
         */
        let all = []
        for(const unit of this.units.keys()) {
            for(const trgkey of this.units.get(unit).TRGS.keys()) {
                const trg = this.units.get(unit).TRGS.get(trgkey);
                if(trg.diff("milliseconds") > 0 && trg.diff("days") < 21) {
                    all.push(trg);
                }
            }
            for(const checkpointkey of this.units.get(unit).CHECKPOINTS.keys()) {
                const checkpoint = this.units.get(unit).CHECKPOINTS.get(checkpointkey);
                if(checkpoint.diff("milliseconds") > 0 && checkpoint.diff("days") < 21) {
                    all.push(checkpoint);
                }
            }
        }

        all.sort((a, b) => {
            return a.diff("milliseconds") - b.diff("milliseconds");
        })

        const fields = all.map( (due) => {
            return { 
                name: `**${due.full()}**`,
                value: `Due in *${this.longFormatTime(due.DUE)}*`
            }
        })

        fields.push({
            name: `Well, get cracking.`,
            value: `Your time is running out.`
        })

        channel.send({
            embed: {
                title: `Daily Dose of Bio H`,
                description: `This is *your* daily dose of Biology Honors. Don't forget to like and subscribe!`,
                fields,
                ...this.basicEmbedInfo()
            }
        })
    }

    async sendDailyDose() {
        for (const id of this.dailyChannels) {
            let channel = await this.client.channels.fetch(id)
            this.tonyBot.dailyDose(channel)
        }
    }

    /**
     * 
     * @param {TRG} trg 
     */
    scheduleTRG(trg) {
        schedule.scheduleJob(moment.tz(trg.DUE, "America/Los_Angeles").toDate(), async () => {
            for (const id of this.dailyChannels) {
                const channel = await this.client.channels.fetch(id)
                channel.send({
                    embed: {
                        title: `**${trg.full()} DUE NOW**`,
                        description: `<:TRG:753777853266526309> <:gunn2:765261683362627635> <:fperbio:774026168072142889>`,
                        fields: this.TRGtoFields(trg), 
                        ...this.basicEmbedInfo()
                    }
                })
            }
        }) 
    }

    /**
     * 
     * @param {Checkpoint} checkpoint 
     */
    scheduleCheckpoint(checkpoint) {
        schedule.scheduleJob(moment.tz(checkpoint.DUE, "America/Los_Angeles").toDate(), async () => {
            for (const id of this.dailyChannels) {
                const channel = await this.client.channels.fetch(id)
                channel.send({
                    embed: {
                        title: `**${checkpoint.full()} DUE NOW**`,
                        description: `<:checkpoint:754059847326236705> <:gunn2:765261683362627635> <:fperbio:774026168072142889>`,
                        fields: this.CheckpointToFields(checkpoint), 
                        ...this.basicEmbedInfo()
                    }
                })
            }
        }) 
    }
    
    /* MODIFIERS */

    /* LOW LEVEL */
    /**
     * @param {Discord.Message} origmessage
     */
    async sendClosableEmbed(origmessage, embed) {
        let message = await origmessage.channel.send({
            embed
        });
        await message.react("❌");

        const filter = (reaction, user) => {
            return ['❌'].includes(reaction.emoji.name) && user.id === origmessage.author.id;
        };

        let collected;
        try {
            collected = await message.awaitReactions(filter, {
                max: 1,
                time: 60000,
                errors: ['time']
            })
        } catch (err) {
            await message.reactions.removeAll();
            return false;
        }
        const reaction = collected.first();

        try {
            await reaction.users.remove(origmessage.author.id);
        } catch {} finally {
            await message.delete();
        }
    }

    /* ON BLANK */

    /**
     * 
     * @param {Discord.Message} message 
     */
    async createUser(message) {
        let m = await message.channel.send({
            "embed": {
                "title": "Create a Profile",
                "description": `You haven't created a profile yet.\nBy creating a profile, you get access to PeepsBot's other features. React with :thumbsup: to continue.`,
                ...this.embedInfo(message),
            }
        })

        await m.react("👍");
        await m.react("❌");

        const filter = (reaction, user) => {
            return ['👍', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };

        let collected;
        try {
            collected = await m.awaitReactions(filter, {
                max: 1,
                time: 60000,
                errors: ['time']
            })
        } catch {
            return false;
        }
        const reaction = collected.first();

        if (reaction.emoji.name === '👍') {
            await super.createUser(message.author.id);
            m.delete();
            this.sendClosableEmbed(message, {
                "title": "Welcome!",
                "description": `Welcome to the underground TRG society. Trade in your TRGs for in game currency. For help, do --help`,
                ...this.embedInfo(message),
            })
            return true;
        } else {
            m.delete();
            return false;
        }
    }

    /**
     * 
     * @param {Discord.Message} message
     * @param {string[]} args 
     */
    async onComplete(message, args) {
        if (args[0].toLowerCase() === "trg") {
            // If user doesn't exist, make them exist or resolve
            if (!(await this.userExists(message.author.id))) {
                if (!(await this.createUser(message))) {
                    return false;
                }
            }

            // Get TRG numbers, check for errors
            let nums = this.dashNotationToNums(args[1]);
            if (nums === false) {
                this.sendClosableEmbed(message, {
                    title: `Invalid`,
                    description: `Your TRG number, TRG ${args[1]}, was invalid. Try **TRG #-#** instead, e.g. TRG 3-1.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            let [unit, num] = nums;

            // Check if the TRG exists
            if (!this.TRGExists(unit, num)) {
                this.sendClosableEmbed(message, {
                    title: `Invalid`,
                    description: `TRG ${args[1]} does not exist.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            if (!(await this.unitExistsForUser(message.author.id, unit))) {
                await this.createUnitForUser(message.author.id, unit);
            }

            // If the TRG exists, but the user doesn't have an entry, add it
            if (!(await this.TRGExistsForUser(message.author.id, unit, num))) {
                await this.createTRGForUser(message.author.id, unit, num)
            }

            // Parse the last two parameters, either SEC # or ALL
            let tochange = [false, false, false];
            if (!args[2]) {
                tochange = [true, true, true];
            } else if (args[2].toLowerCase() === "sec") {
                let secnum = parseInt(args[3]);
                if (isNaN(secnum) || !(secnum <= 3 && secnum >= 1)) {
                    this.sendClosableEmbed(message, {
                        title: `Invalid`,
                        description: `You sent SEC ${args[3]}, but ${args[3]} is not a valid section. Try 1,2, or 3.`,
                        ...this.embedInfo(message)
                    })
                    return false;
                }

                tochange[secnum - 1] = true;
            } else if (args[2].toLowerCase() === "all") {
                tochange = [true, true, true];
            } else {
                this.sendClosableEmbed(message, {
                    title: `Invalid`,
                    description: `You sent ${args[2]}, but only **SEC #** or **ALL** are accepted.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // Complete!
            let data = await this.updateTRG(message.author.id, unit, num, tochange);

            if (!data.CHANGED) {
                this.sendClosableEmbed(message, {
                    title: `Complete TRG ${unit}-${num}`,
                    description: `You've already completed that.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // Parse the data into a Discord embed
            let fields = [];
            for (let i = 0; i < data.CHANGEDARRAY.length; i++) {
                if (data.CHANGEDARRAY[i]) {
                    fields.push({
                        name: `Section ${i+1}: ${this.sectionTitles[i]}`,
                        value: "Just completed at " + this.formatTime(this.now())
                    })
                }
            }

            fields.push({
                name: `Earned`,
                value: `${data.EARNED}LC, ${data.EXP} EXP\n` + 
                    `You currently are rank ${data.USER.RANK}. You have ${data.EARNED}LC and ${data.EXP} EXP total.`
            })

            // Send it!
            this.sendClosableEmbed(message, {
                fields,
                title: `Complete TRG ${unit}-${num}`,
                description: `Completing TRG ${unit}-${num}.`,
                ...this.embedInfo(message)
            })
        }
    }

    /**
     * 
     * @param {Discord.Message} message
     * @param {string[]} args 
     */
    async onGet(message, args) {
        if (!args[0]) {
            // If user doesn't exist, make them exist or resolve
            if (!(await this.userExists(message.author.id))) {
                if (!(await this.createUser(message))) {
                    return false;
                }
            }

            let user = this.users.get(message.author.id);
            // Send message
            this.sendClosableEmbed(message, {
                title: `User ${message.author.tag}`,
                description: `Your status in the database`,
                fields: [
                    {
                        name: `LitCoin`,
                        value: `${user.LC}LC`,
                        inline: true
                    },
                    {
                        name: `Rank`,
                        value: `${user.RANK}`,
                        inline: true
                    },
                    {
                        name: `EXP`,
                        value: `${user.EXP}`,
                        inline: true
                    },
                ],
                ...this.embedInfo(message)
            })
        } else if (args[0].toLowerCase() === "trg") {

            // If user doesn't exist, make them exist or resolve
            if (!(await this.userExists(message.author.id))) {
                if (!(await this.createUser(message))) {
                    return false;
                }
            }

            // Get TRG numbers, check for errors
            let nums = this.dashNotationToNums(args[1]);
            if (nums === false) {
                this.sendClosableEmbed(message, {
                    title: `Invalid`,
                    description: `Your TRG number, TRG ${args[1]}, was invalid. Try TRG #-# instead, e.g. TRG 3-1.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            let [unit, num] = nums;

            // Check if the TRG exists
            if (!this.TRGExists(unit, num)) {
                this.sendClosableEmbed(message, {
                    title: `Invalid`,
                    description: `TRG ${args[1]} does not exist.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            if (!(await this.unitExistsForUser(message.author.id, unit))) {
                await this.createUnitForUser(message.author.id, unit);
            }

            // If the TRG exists, but the user doesn't have an entry, add it
            if (!(await this.TRGExistsForUser(message.author.id, unit, num))) {
                await this.createTRGForUser(message.author.id, unit, num)
            }

            // Get data
            let data = await this.getUserTRG(message.author.id, unit, num);

            // Parse the data into a Discord embed
            let userfields = [];
            for (let i = 0; i < data.SECTIONS.length; i++) {
                userfields.push({
                    name: `Section ${i+1}: ${this.sectionTitles[i]}`,
                    value: data.SECTIONS[i] ? "Complete at " + this.formatTime(data.SECTIONTIMESTAMPS[i]) : "Incomplete"
                })
            }

            let trg = this.units.get(unit + "").TRGS.get(num + "");
            let infofields = this.TRGtoFields(trg);

            let fields = [];
            fields = [...infofields, ...userfields]
            if (!args[2]) {} else if (args[2].toLowerCase() === "info") {
                fields = [...infofields];
            } else if (args[2].toLowerCase() === "progress") {
                fields = [...userfields];
            }

            // Send it!
            this.sendClosableEmbed(message, {
                fields,
                title: `TRG ${unit}-${num}: ${trg.TITLE} Status`,
                description: `Your TRG ${unit}-${num}: ${trg.TITLE} status, as listed in the database.`,
                ...this.embedInfo(message)
            })
        } else if (args[0].toLowerCase() === "checkpoint") {

            // If user doesn't exist, make them exist or resolve
            if (!(await this.userExists(message.author.id))) {
                if (!(await this.createUser(message))) {
                    return false;
                }
            }

            // Get TRG numbers, check for errors
            let nums = this.dashNotationToNums(args[1]);
            if (nums === false) {
                this.sendClosableEmbed(message, {
                    title: `Invalid`,
                    description: `Your Checkpoint number, Checkpoint ${args[1]}, was invalid. Try Checkpoint #-# instead, e.g. Checkpoint 3-1.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            let [unit, num] = nums;

            // Check if the Checkpoint exists
            if (!this.CheckpointExists(unit, num)) {
                this.sendClosableEmbed(message, {
                    title: `Invalid`,
                    description: `Checkpoint ${args[1]} does not exist.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            if (!(await this.unitExistsForUser(message.author.id, unit))) {
                await this.createUnitForUser(message.author.id, unit);
            }

            // If the TRG exists, but the user doesn't have an entry, add it
            if (!(await this.checkpointExistsForUser(message.author.id, unit, num))) {
                await this.createCheckpointForUser(message.author.id, unit, num)
            }

            // Get data
            let data = await this.getUserCheckpoint(message.author.id, unit, num);

            let userfields = [{
                name: "Complete",
                value: `${data.COMPLETE ? "Completed at " + this.formatTime(data.TIMESTAMP) : "Not completed"}`
            }]

            let checkpoint = this.units.get(unit + "").CHECKPOINTS.get(num + "");
            let infofields = this.CheckpointToFields(checkpoint);

            let fields = [];
            fields = [...infofields, ...userfields]
            if (!args[2]) {} else if (args[2].toLowerCase() === "info") {
                fields = [...infofields];
            } else if (args[2].toLowerCase() === "progress") {
                fields = [...userfields];
            }

            // Send it!
            this.sendClosableEmbed(message, {
                fields,
                title: `Checkpoint ${unit}-${num}: ${checkpoint.TITLE} Status`,
                description: `Your Checkpoint ${unit}-${num}: ${checkpoint.TITLE} status, as listed in the database.`,
                ...this.embedInfo(message)
            })

        } else if (args[0].toLowerCase() === "unit") {

            // If user doesn't exist, make them exist or resolve
            if (!(await this.userExists(message.author.id))) {
                if (!(await this.createUser(message))) {
                    return false;
                }
            }

            // Check if Unit Exists
            let unitnum = args[1];
            if (!this.unitExists(unitnum)) {
                this.sendClosableEmbed(message, {
                    title: `Invalid`,
                    description: `Unit ${args[1]} does not exist.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            let unitinfo = this.units.get(unitnum).DATA();
            await this.sendClosableEmbed(message, {
                title: `Unit ${unitnum}: ${unitinfo.TITLE}`,
                fields: this.UnitToFields(unitinfo),
                ...this.embedInfo(message)
            })

        } else if (args[0].toLowerCase() === "all") {
            if (!args[1]) {

            } else if (args[1].toLowerCase() === "trgs") {
                let alltrgs = [];
                for (const unit of this.units.keys()) {
                    for (const num of this.units.get(unit).TRGS.keys()) {
                        alltrgs.push(`TRG ${unit}-${num}`);
                    }
                }
                this.sendClosableEmbed(message, {
                    title: "All TRGs",
                    description: alltrgs.join("\n"),
                    ...this.embedInfo(message)
                })
            }
            if (args[1].toLowerCase() === "checkpoints") {
                let allcheckpoints = [];
                for (const unit of this.units.keys()) {
                    for (const num of this.units.get(unit).CHECKPOINTS.keys()) {
                        allcheckpoints.push(`Checkpoint ${unit}-${num}`);
                    }
                }
                this.sendClosableEmbed(message, {
                    title: "All Checkpoints",
                    description: allcheckpoints.join("\n"),
                    ...this.embedInfo(message)
                })
            } else if (args[1].toLowerCase() === "units") {
                let allunits = [];
                for (const unit of this.units.keys()) {
                    allunits.push(`Unit ${unit}`);
                }
                this.sendClosableEmbed(message, {
                    title: "All Units",
                    description: allunits.join("\n"),
                    ...this.embedInfo(message)
                })
            }
        }

    }

    /**
     * 
     * @param {Discord.Message} message
     * @param {string[]} args 
     */
    async onCreate(message, args) {
        this.createUser(message);
    }

}

module.exports = {
    TonyBot
};