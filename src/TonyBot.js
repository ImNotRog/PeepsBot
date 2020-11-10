
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

        this.updateChannels = ["748669830244073536", "750186902879076433", "744415364376559746"]; // Actual
        // this.updateChannels = ["750804960333135914"] // Redirect

        cron.schedule(`5 15 * * 1-5`,
        () => {this.sendDailyDose()}, 
        {
            timezone: `America/Los_Angeles`
        })

        this.interval = 150000;

        let currinterval = setInterval(() => {
            console.log("Refreshing...");
            this.refresh();
        }, this.interval);

        this.prefix = "--";

        this.helpCommandsEmbed = {
            title: `Help - Tony Bot Commands`,
            description: `Commands List for Tony Bot`,
            fields: [
                {
                    name: `${this.prefix}create`,
                    value: `Creates an account in the database! This is done implicitly whenever you first use another command too.`
                },
                {
                    name: `${this.prefix}get`,
                    value: [
                        `Gets your user information, such as your LitCoins and EXP, as listed in the database.`
                    ].join(`\n`)
                },
                {
                    name: `${this.prefix}get all [trgs or checkpoints]`,
                    value: [
                        `Gets all the trgs or checkpoints currently listed on Schoology.`
                    ].join(`\n`)
                },
                {
                    name: `${this.prefix}get TRG #-# [*optional*: info or progress]`,
                    value: [
                        `Gets the info for TRG #-#.`,
                        `If you specify info, you only get information about the TRG.`,
                        `If you specify progress, you only get information about your progress on the TRG, as listed in PeepsBot's database.`,
                        `If you don't specify either and only state "${this.prefix}get TRG #-#", it gives you both the info and your progress.`
                    ].join(`\n`)
                },
                {
                    name: `${this.prefix}complete TRG #-# [*optional*: ALL or SEC #]`,
                    value: [
                        `Completes TRG #-#`,
                        `If you specify ALL, it completes all the sections for that TRG. If you don't specify anything, it also completes the entire thing.`,
                        `If you specify SEC #, where the number is 1, 2, or 3, it will complete that TRG section only.`
                    ].join(`\n`)
                },
                {
                    name: `${this.prefix}[DAILY UP or UPCOMING]`,
                    value: [
                        `Gets *your* daily dose of Biology by showing what assignments are due soon.`
                    ].join(`\n`)
                }
            ]
        }

        this.helpEmbed = {
            title: `Help - Tony Bot General Info`,
            description: [
                `Tony is a fictional character who supposedly lives in the sewers,`,
                `Through flawless and entirely legitimate deduction, FPERBIO has concluded `,
                `Tony is none other than our lord and savior Mr.Little. `,
                `Through his good graces, you can exchange your IRL TRGs for in-game LitCoin, `,
                `which you can then spend to get more LitCoin, which is the point of most games, `,
                `if you really think about it. `,
                `Tony Bot will also provide alerts for quality of life of all period bio gangers.`
            ].join(``),
            fields: [
                {
                    name: `Alerts`,
                    value: [
                        `Whenever a TRG or Checkpoint is posted or graded, TonyBot will alert select channels.`,
                        `Want your channel to be alerted? Contact Rog#7499.`
                    ].join(`\n`)
                },
                {
                    name: `Daily Dose of Bio`,
                    value: [
                        `A select set of channels will also receive Tony's Daily Dose of Bio H, `,
                        `which includes upcoming TRGs and Checkpoints.`
                    ].join(``)
                },
                {
                    name: `Information`,
                    value: [
                        `Tony Bot can give information about all sorts of TRGs and Checkpoints.`,
                        `Go to the next help slides to figure out how.`
                    ].join(`\n`)
                },
                {
                    name: `How?`,
                    value: [
                        `Tony says his source is the Schoology API, but we're pretty sure he uses black magic.`
                    ].join(`\n`)
                },
            ]
        }

    }

    async onConstruct() {
        await super.onConstruct();
        await this.refresh(true);
    }

    async refresh(construct) {

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
                await this.createUnit(unit, units.get(key));
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

            if(construct) {
                this.scheduleTRG(this.units.get(""+unit).TRGS.get(""+num));
            }
            

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
            

            if(construct) {
                this.scheduleCheckpoint(this.units.get(""+unit).CHECKPOINTS.get(""+num));
            }

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

        let embeds = updateembeds;
        for (const id of this.updateChannels) {
            let channel = await this.client.channels.fetch(id)
            for(const embed of embeds) {
                await channel.send({embed});
            }
        }
    }

    /* ACCESSORS */

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
            this.dailyDose(channel)
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

    /* ON BLANK */

    /**
     * 
     * @param {Discord.Message} message 
     */
    async createUser(message) {
        let m = await message.channel.send({
            embed: {
                title: `Creating a User`,
                description: `It might take a while to auto-complete all the past TRGs and Checkpoints.`,
                ...this.embedInfo(message)
            }
        })
        await super.createUser(message.author.id);
        await m.delete();
        return true;
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
                    `You currently are rank ${data.USER.RANK}. You have ${data.USER.LC}LC and ${data.USER.EXP} EXP total.`
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