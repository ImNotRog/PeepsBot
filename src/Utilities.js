
let moment = require("moment-timezone");
const Discord = require("discord.js");

class Utilities {
    constructor(){
    }

    /* Moment Utilities */
    now() {
        return this.nowObj().format();
    }

    nowObj(){
        return moment.tz("America/Los_Angeles");
    }

    formatTime(t) {
        let time = moment.tz(t, "America/Los_Angeles")
        let diff = time.diff(moment.tz("America/Los_Angeles"), "milliseconds");
        if(diff < 0) {
            return time.format("MM/DD h:mm:ss a")
        } else {
            let days = time.diff(moment.tz("America/Los_Angeles"), "days");
            let hrs = time.diff(moment.tz("America/Los_Angeles"), "hours") % 24;
            let mins = time.diff(moment.tz("America/Los_Angeles"), "minutes") % 60;

            if(days > 3) {
                return `${time.format("MM/DD h:mm:ss a")}`;
            } else {
                return `${days} days, ${hrs} hrs, ${mins} mins`
            }
        }
    }

    longFormatTime(t) {
        let time = moment.tz(t, "America/Los_Angeles")
        let diff = time.diff(moment.tz("America/Los_Angeles"), "milliseconds");
        if(diff < 0) {
            return time.format("MM/DD h:mm:ss a")
        } else {
            let days = time.diff(moment.tz("America/Los_Angeles"), "days");
            let hrs = time.diff(moment.tz("America/Los_Angeles"), "hours") % 24;
            let mins = time.diff(moment.tz("America/Los_Angeles"), "minutes") % 60;

            return `${days} days, ${hrs} hrs, ${mins} mins, at ${time.format("MM/DD h:mm:ss a")}`;
            
        }
    }

    /**
     * @param {moment.Moment}
     * @returns {number}
     */
    timediff(momentobj) {
        let now = moment.tz("America/Los_Angeles");
        return momentobj.diff(now, 'days');
    }


    /* Discord Utilities */
    
    /**
     * @param {Discord.Message|Discord.TextChannel} origmessage
     */
    async sendClosableEmbed(origmessage, embed) {

        if(origmessage instanceof Discord.Message) {
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
        } else if(origmessage instanceof Discord.TextChannel) {

            let message = await origmessage.send({
                embed
            });
            await message.react("❌");

            const filter = (reaction, user) => {
                return ['❌'].includes(reaction.emoji.name)
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
            await message.delete();
            
        }
        
    }

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
}

module.exports = {Utilities}