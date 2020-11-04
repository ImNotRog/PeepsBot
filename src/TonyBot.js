const {TonyBotDB} = require("./TonyBotDB");

const {BioParser} = require("./BP")

// To aid in Intellisense, will comment out when not developing
const Discord = require("discord.js");

class TonyBot extends TonyBotDB {
    /**
     * @constructor
     * @param {FirebaseFirestore.Firestore} db
     */
    constructor(db) {
        super(db);
        this.sectionTitles = ["Take Notes", "Applying the Concepts", "Summary"]
        this.BP = new BioParser();
    }
    
    async onConstruct() {
        await super.onConstruct();
        return await this.refresh();
    }

    async refresh(){

        let updateembeds = [];

        const sassymessages = 
        [
            "Yes, there's another one.",
            "agioasgASDGLASDg asgASGawLIJliu waLJKfaJLEGQWLIJGkjasfd",
            "Well, Bio is like a firing squad, with 15 TRGs pointed at you as you desperately look the other way.",
            "Hey, I'm just the messenger.",
            "Look, I'm failing too, ok?",
        ]

        let maps = await this.BP.getTRGandCheckpoints();
        let trgs = maps.TRGS;
        let checkpoints = maps.CHECKPOINTS;
        for(const key of trgs.keys()) {
            let [unit, num] = JSON.parse(key);
            if(!this.unitExists(unit)) {
                await this.createUnit(unit);
                updateembeds.push({
                    title: `ALERT: Unit ${unit}`,
                    description: `**Unit ${unit} was posted.** Here's to another month of death!`,
                    ...this.basicEmbedInfo()
                })
            }
            if(!this.TRGExists(unit, num)) {
                updateembeds.push({
                    title: `ALERT: TRG ${unit}-${num} POSTED`,
                    description: `TRG ${unit}-${num} was just posted. ${sassymessages[Math.floor(Math.random() * sassymessages.length)]}.`,
                    fields: this.TRGtoFields(trgs.get(key)),
                    ...this.basicEmbedInfo()
                })
                await this.createTRG(unit,num);
            }
            const changes = await this.setTRGinfo(unit,num,trgs.get(key));

            if(changes.GRADED && changes.GRADED[1] === true) {
                updateembeds.push({
                    title: `ALERT: TRG ${unit}-${num} GRADED`,
                    description: `TRG ${unit}-${num} was just graded. Go look.`,
                    fields: [
                        {
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

        for(const key of checkpoints.keys()) {
            let [unit, num] = JSON.parse(key);
            if(!this.unitExists(unit)) {
                await this.createUnit(unit);
                updateembeds.push({
                    title: `ALERT: Unit ${unit}`,
                    description: `**Unit ${unit} was posted.** Here's to another month of death!`,
                    ...this.basicEmbedInfo()
                })
            }
            if(!this.CheckpointExists(unit, num)) {
                updateembeds.push({
                    title: `ALERT: Checkpoint ${unit}-${num} POSTED`,
                    description: `Checkpoint ${unit}-${num} was just posted. ${sassymessages[Math.floor(Math.random() * sassymessages.length)]}.`,
                    fields: [
                        {
                            name: "Title",
                            value: `${checkpoints.get(key).TITLE ? checkpoints.get(key).TITLE : `No title has been provided`}`
                        },
                        {
                            name: "Date",
                            value: this.formatTime(checkpoints.get(key).DUE)
                        },
                        {
                            name: "Points",
                            value: checkpoints.get(key).POINTS
                        }
                    ],
                    ...this.basicEmbedInfo()
                })
                await this.createCheckpoint(unit,num);
            }
            const changes = await this.setCheckpointInfo(unit,num,checkpoints.get(key));

            if(changes.GRADED && changes.GRADED[1] === true) {
                updateembeds.push({
                    title: `ALERT: CHECKPOINT ${unit}-${num} GRADED`,
                    description: `Checkpoint ${unit}-${num} was just graded. Go look.`,
                    fields: [
                        {
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
    TRGtoFields(trg){
        return [
            {
                name: "Title",
                value: `${trg.TITLE ? trg.TITLE : `No title has been provided`}`
            },
            {
                name: "Due",
                value: this.formatTime(trg.DUE)
            },
            {
                name: "Description",
                value: trg.DESCRIPTION
            },
            {
                name: "URLs",
                value: `${trg.OTHERURL ? `[Original Link](${trg.OTHERURL}), ` : ""}` +
                        `${trg.SUBMITURL ? `[Submission Link](${trg.SUBMITURL})` : ""}`
            }
        ]
    }

    /**
     * 
     * @param {string} str
     * @returns {number[] | boolean} 
     */
    dashNotationToNums(str) {
        let splits = str.split("-");
        if(splits.length !== 2) return false;

        let unit = parseInt( splits[0] );
        if(isNaN(unit)) return false;

        let num = parseInt( splits[1] );
        if(isNaN(num)) return false;

        return [unit, num];
    }

    /* MODIFIERS */

    /* LOW LEVEL */
    /**
     * @param {Discord.Message} origmessage
     */
    async sendClosableEmbed(origmessage, embed) {
        let message = await origmessage.channel.send({embed});
        await message.react("❌");

        const filter = (reaction, user) => {
            return ['❌'].includes(reaction.emoji.name) && user.id === origmessage.author.id;
        };

        let collected;
        try {
            collected = await message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
        } catch(err) {
            await message.reactions.removeAll();
            return false;
        }
        const reaction = collected.first();

        try {
            await reaction.users.remove(origmessage.author.id);
        } catch { }
        finally {
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
            collected = await m.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
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
        } else{
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
        if(args[0].toLowerCase() === "trg"){
            // If user doesn't exist, make them exist or resolve
            if(!(await this.userExists(message.author.id))){ 
                if(!(await this.createUser(message))) {
                    return false;
                }
            }

            // Get TRG numbers, check for errors
            let nums = this.dashNotationToNums(args[1]);
            if(nums === false) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Your TRG number, TRG ${args[1]}, was invalid. Try **TRG #-#** instead, e.g. TRG 3-1.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            let [unit, num] = nums;

            // Check if the TRG exists
            if(!this.TRGExists(unit, num)) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `TRG ${args[1]} does not exist.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            if(!(await this.unitExistsForUser(message.author.id, unit))) {
                await this.createUnitForUser(message.author.id, unit);
            }
            
            // If the TRG exists, but the user doesn't have an entry, add it
            if(!(await this.TRGExistsForUser(message.author.id, unit, num))){
                await this.createTRGForUser(message.author.id, unit, num)
            }

            // Parse the last two parameters, either SEC # or ALL
            let tochange = [false,false,false];
            if(!args[2]){
                tochange = [true,true,true];
            } else if(args[2].toLowerCase() === "sec") {
                let secnum = parseInt(args[3]);
                if(isNaN(secnum) || !(secnum <= 3 && secnum >= 1)) {
                    this.sendClosableEmbed(message,{
                        title: `Invalid`,
                        description: `You sent SEC ${args[3]}, but ${args[3]} is not a valid section. Try 1,2, or 3.`,
                        ...this.embedInfo(message)
                    })
                    return false;
                }

                tochange[secnum - 1] = true;
            } else if(args[2].toLowerCase() === "all") {
                tochange = [true,true,true];
            } else {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `You sent ${args[2]}, but only **SEC #** or **ALL** are accepted.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // Complete!
            let data = await this.updateTRG(message.author.id, unit, num, tochange);

            if(!data.CHANGED) {
                this.sendClosableEmbed(message, {
                    title: `Complete TRG ${unit}-${num}`,
                    description: `You've already completed that.`,
                    ...this.embedInfo(message)
                })
                return false;
            }
            
            // Parse the data into a Discord embed
            let fields = [];
            for(let i = 0; i < data.CHANGEDARRAY.length; i++) {
                if(data.CHANGEDARRAY[i]){
                    fields.push({
                        name: `Section ${i+1}: ${this.sectionTitles[i]}`,
                        value: "Just completed at " + this.formatTime(this.now())
                    })
                }
            }

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
        if(args[0].toLowerCase() === "trg"){

            // If user doesn't exist, make them exist or resolve
            if(!(await this.userExists(message.author.id))){ 
                if(!(await this.createUser(message))) {
                    return false;
                }
            }

            // Get TRG numbers, check for errors
            let nums = this.dashNotationToNums(args[1]);
            if(nums === false) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Your TRG number, TRG ${args[1]}, was invalid. Try TRG #-# instead, e.g. TRG 3-1.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            let [unit, num] = nums;

            // Check if the TRG exists
            if(!this.TRGExists(unit, num)) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `TRG ${args[1]} does not exist.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            if(!(await this.unitExistsForUser(message.author.id, unit))) {
                await this.createUnitForUser(message.author.id, unit);
            }

            // If the TRG exists, but the user doesn't have an entry, add it
            if(!(await this.TRGExistsForUser(message.author.id, unit, num))){
                await this.createTRGForUser(message.author.id, unit, num)
            }

            // Get data
            let data = await this.getUserTRG(message.author.id, unit, num);
            
            // Parse the data into a Discord embed
            let userfields = [];
            for(let i = 0; i < data.SECTIONS.length; i++) {
                userfields.push({
                    name: `Section ${i+1}: ${this.sectionTitles[i]}`,
                    value: data.SECTIONS[i] ? "Complete at " + this.formatTime(data.SECTIONTIMESTAMPS[i]) : "Incomplete"
                })
            }

            let trg = this.units.get(unit+"").TRGS.get(num+"");
            let infofields = this.TRGtoFields(trg);

            let fields = [];
            fields = [...infofields, ...userfields]

            // Send it!
            this.sendClosableEmbed(message, {
                fields,
                title: `TRG ${unit}-${num} Status`,
                description: `Your TRG ${unit}-${num} status, as listed in the database.`,
                ...this.embedInfo(message)
            })
        } else if(args[0].toLowerCase() === "all") {
            if(args[1].toLowerCase() === "trgs") {
                let alltrgs = [];
                for(const unit of this.units.keys()){
                    for(const num of this.units.get(unit).TRGS.keys()){
                        alltrgs.push(`TRG ${unit}-${num}`);
                    }
                }
                this.sendClosableEmbed(message, {
                    title: "All TRGs",
                    description: alltrgs.join("\n"),
                    ...this.embedInfo(message)
                })
            } else if(args[1].toLowerCase() === "units") {
                let allunits = [];
                for(const unit of this.units.keys()){
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
    async onCreate(message,args){
        if(args[0].toLowerCase() === "trg") {

            // They must be admin
            if(!message.member.hasPermission("ADMINISTRATOR")){
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Only admins can create global TRGs. Ask them to create it for you.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // If user doesn't exist, make them exist or resolve
            if(!(await this.userExists(message.author.id))){ 
                if(!(await this.createUser(message))) {
                    return false;
                }
            }

            // Get TRG numbers, check for errors
            let nums = this.dashNotationToNums(args[1]);
            if(nums === false) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Your TRG number, TRG ${args[1]}, was invalid. Try TRG #-# instead, e.g. TRG 3-1.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            let [unit, num] = nums;

            // Check if the unit exists
            if(!this.unitExists(unit)) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Unit ${unit} does not exist. To avoid errors, please explicitly create that unit using create unit ${unit}.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // Check if the TRG exists
            if(this.TRGExists(unit, num)) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `TRG ${args[1]} already exists.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // Create the TRG
            await this.createTRG(unit, num)

            // Send the success message
            this.sendClosableEmbed(message, {
                title: `Create TRG ${args[1]}`,
                description: `TRG ${args[1]} has been successfully created.`,
                ...this.embedInfo(message)
            })

        } else if(args[0].toLowerCase() === "unit"){
            // They must be admin
            if(!message.member.hasPermission("ADMINISTRATOR")){
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Only admins can create global units. Ask them to create it for you.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // If user doesn't exist, make them exist or resolve
            if(!(await this.userExists(message.author.id))){ 
                if(!(await this.createUser(message))) {
                    return false;
                }
            }

            let unit = parseInt(args[1]);
            if(isNaN(unit)){
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `${args[1]} is not a valid unit. Try unit # instead, like unit 3.`,
                    ...this.embedInfo(message)
                })
            }

            // Check if the unit exists
            if(this.unitExists(unit)) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Unit ${unit} already exists.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // Create Unit
            await this.createUnit(unit);
            this.sendClosableEmbed(message,{
                title: `Created Unit ${unit}`,
                description: `Unit ${unit} was created.`,
                ...this.embedInfo(message)
            })

        } else {
            this.createUser(message);
        }
    }

}

module.exports = {TonyBot};
