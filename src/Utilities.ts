
// change to static

import moment = require("moment-timezone");

// For Intellisense
import Discord = require("discord.js");
import { SchoologyAccessor } from "./SA";

export class Utilities {
    private constructor(){
    }

    /* String Utilities */
    public static BigramsOf(str:string) {
        let returnobj = [];
        for(let i = 0; i < str.length - 1; i++) {
            returnobj.push(str.slice(i,i+2));
        }
        return returnobj;
    }

    public static SimilarBigramsOf(str1:string,str2:string) {
        let bigrams1 = Utilities.BigramsOf(str1);
        let bigrams2 = Utilities.BigramsOf(str2);

        let bigramsset = new Set(bigrams1);
        let incommon = 0;
        for(const bigram of bigramsset) {
            for(const secondbigram of bigrams2) {
                if(bigram === secondbigram) {
                    incommon ++;
                }
            }
        }
        return incommon;
    }

    public static SorensonDice(str1:string,str2:string) {
        return 2 * (Utilities.SimilarBigramsOf(str1.toLowerCase(),str2.toLowerCase())) / (str1.length - 1 + str2.length - 1);
    }

    public static LongestCommonSubstring(str1:string, str2:string) {

        let longest = 0;
        let longestsubstr = "";
        let start1 = 0;
        let end1 = 0;
        let start2 = 0;
        let end2 = 0;

        for (let start1t = 0; start1t < str1.length; start1t++) {
            for(let end1t = start1t+1; end1t <= str1.length; end1t++) {
                let substr = str1.slice(start1t,end1t);
                if(str2.includes(substr) && substr.length > longest) {
                    longest = substr.length;
                    start2 = str2.indexOf(substr);
                    end2 = start2 + substr.length;
                    longestsubstr = substr;
                    start1 = start1t;
                    end1 = end1t;
                }
            }
        }

        return {
            longest,
            longestsubstr,
            start1,
            end1,
            start2,
            end2
        }
    }

    public static RatcliffObershelpRaw(str1:string,str2:string) {
        if(str1.length * str2.length === 0) return 0;
        let common = Utilities.LongestCommonSubstring(str1,str2);
        if(common.longest === 0) return 0;

        let left = Utilities.RatcliffObershelpRaw(str1.slice(0, common.start1), str2.slice(0, common.start2));
        let right = Utilities.RatcliffObershelpRaw(str1.slice(common.end1), str2.slice(common.end2));

        return common.longest + left + right - Math.abs(common.start1 - common.start2) / 200;
    }

    public static RatcliffObershelpCustom(str1: string, str2: string) {
        return Utilities.RatcliffObershelpRaw(str1.toLowerCase(), str2.toLowerCase()) / (str1.length + str2.length / 100);
    }

    public static RatcliffObershelp(str1:string,str2:string){
        return 2 * Utilities.RatcliffObershelpRaw(str1.toLowerCase(), str2.toLowerCase()) / (str1.length + str2.length);
    }

    /* Moment Utilities */

    public static now() {
        return moment.tz("America/Los_Angeles").format();
    }

    public static getTodayStr(){
        return moment.tz("America/Los_Angeles").format("MM/DD/YYYY");
    }

    public static formatTime(t) {
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

    public static timediff(momentobj: moment.Moment): number {
        let now = moment.tz("America/Los_Angeles");
        return momentobj.diff(now, 'days');
    }


    /* Discord Utilities */

    public static async sendEmoteCollector(origmessage: Discord.Message,embed:(boolean) => Object,num: number,millis: number) {

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
                (["❌"].includes(reaction.emoji.name) && gmember.hasPermission("ADMINISTRATOR") && !user.bot);
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
    public static async sendClosableEmbed(origmessage: Discord.Message | Discord.TextChannel, embed) {

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

    public static async sendCarousel(origmessage: Discord.Message, embeds: { embed: object; }[]) {

        // Remap embeds
        embeds = embeds.map( (e) => {
            if(e.embed) {
                return { 
                    ...e,
                    ...Utilities.embedInfo(origmessage)
                };
            } else {
                return {
                    embed: {
                        ...e,
                        ...Utilities.embedInfo(origmessage)
                    }
                }
            }
        })

        const message = await origmessage.channel.send(embeds[0]);
        // ⬅️ ❌ ➡️
        await message.react("⬅️")
        await message.react("❌")
        await message.react("➡️")

        Utilities.carouselPage(message, embeds, 0, origmessage);
    }

    public static async carouselPage(message: Discord.Message, embeds: { embed: object; }[], curr: number, origmessage: Discord.Message) {

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


    public static basicEmbedInfo() {
        return {
            "color": 111111,
            "timestamp": Utilities.now(),
        }
    }

    public static embedInfo(message:Discord.Message) {
        return {
            ...Utilities.basicEmbedInfo(),
            "footer": {
                "text": `Requested by ${message.author.username}`,
                "icon_url": message.author.displayAvatarURL()
            }
        }
    }
}