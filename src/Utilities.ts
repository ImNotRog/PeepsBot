
import moment = require("moment-timezone");

// For Intellisense
import Discord = require("discord.js");

export class Utilities {
    constructor(){
    }

    /* Moment Utilities */
    now() {
        return this.nowObj().format();
    }

    nowObj(){
        return moment.tz("America/Los_Angeles");
    }

    getDay() {
        return moment.tz("America/Los_Angeles").day();
    }

    getTodayStr(){
        return moment.tz("America/Los_Angeles").format("MM/DD/YYYY");
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
    timediff(momentobj): number {
        let now = moment.tz("America/Los_Angeles");
        return momentobj.diff(now, 'days');
    }


    /* Discord Utilities */

    async sendEmoteCollector(origmessage: Discord.Message,embed:(boolean) => Object,num: number,millis: number) {

        const emote = "👍"
        const downemote = "👎"

        let message = await origmessage.channel.send({
            embed: embed(false)
        });
        await message.react(emote);
        await message.react(downemote);
        await message.react("❌");

        const filter = (reaction, user) => {
            let gmember = (message.guild.member(user));
            return ([emote,downemote].includes(reaction.emoji.name)) || 
                (["❌"].includes(reaction.emoji.name) && gmember.hasPermission("ADMINISTRATOR"));
        };


        while(true) {

            try {
                await message.awaitReactions(filter, {
                    max: 1,
                    time: millis,
                    errors: ['time']
                })
            } catch (err) {
                await message.reactions.removeAll();
                message.delete();
                return false;
            }

            let count = message.reactions.cache;

            if (count.has("❌")) {
                let xppl = count.get("❌").users.cache;

                let adminxed = 0;
                for (const id of xppl.keyArray()) {
                    const gmember = (message.guild.member(xppl.get(id)));
                    adminxed += !xppl.get(id).bot && gmember.hasPermission("ADMINISTRATOR") ? 1 : 0;
                }

                if (adminxed) {
                    await message.delete();
                    return false;
                }

            }
            
            let votestrue = count.has(emote) ? count.get(emote).count : 0;
            let votesfalse = count.has(downemote) ? count.get(downemote).count : 0;
            if(votestrue - votesfalse + 1 > num) {
                await message.reactions.removeAll();
                await message.edit({embed: embed(true) });
                return true;
            }

        }

    }

    /**
     * @param {Discord.Message|Discord.TextChannel} origmessage
     */
    async sendClosableEmbed(origmessage: Discord.Message | Discord.TextChannel, embed) {

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

    /**
     * @param {Discord.Message} origmessage
     * @param {{embed: Object}[]} embeds
     */
    async sendCarousel(origmessage: Discord.Message, embeds: { embed: object; }[]) {

        // Remap embeds
        embeds = embeds.map( (e) => {
            if(e.embed) {
                return { 
                    ...e,
                    ...this.embedInfo(origmessage)
                };
            } else {
                return {
                    embed: {
                        ...e,
                        ...this.embedInfo(origmessage)
                    }
                }
            }
        })

        const message = await origmessage.channel.send(embeds[0]);
        // ⬅️ ❌ ➡️
        await message.react("⬅️")
        await message.react("❌")
        await message.react("➡️")

        this.carouselPage(message, embeds, 0, origmessage);
    }

    /**
     * @param {Discord.Message} message
     * @param {{embed: Object}[]} embeds
     * @param {number} curr
     * @param {Discord.Message} origmessage
     */
    async carouselPage(message: Discord.Message, embeds: { embed: object; }[], curr: number, origmessage: Discord.Message) {

        const filter = (reaction, user) => {
            return ['❌','⬅️','➡️'].includes(reaction.emoji.name) && user.id === origmessage.author.id;
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

        await reaction.users.remove(origmessage.author.id);
        
        if(reaction.emoji.name === '❌') {
            await message.delete();
            return true;
        } else if(reaction.emoji.name === '⬅️') {
            curr--;
            while(curr < 0) {
                curr += embeds.length;
            }
            await message.edit(embeds[curr]);
            this.carouselPage(message, embeds, curr, origmessage);
        } else if(reaction.emoji.name === '➡️') {
            curr++;
            while(curr >= embeds.length) {
                curr -= embeds.length;
            }
            await message.edit(embeds[curr]);
            this.carouselPage(message, embeds, curr, origmessage);
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

    basicEmbedInfoForCal() {
        return {
            "color": 111111,
            "timestamp": this.now(),
            "author": {
                "name": "F Period Bio",
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
}