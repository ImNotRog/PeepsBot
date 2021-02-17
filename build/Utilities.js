"use strict";
// change to static
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utilities = void 0;
const moment = require("moment-timezone");
// For Intellisense
const Discord = require("discord.js");
class Utilities {
    constructor() {
    }
    /* String Utilities */
    static BigramsOf(str) {
        let returnobj = [];
        for (let i = 0; i < str.length - 1; i++) {
            returnobj.push(str.slice(i, i + 2));
        }
        return returnobj;
    }
    static SimilarBigramsOf(str1, str2) {
        let bigrams1 = Utilities.BigramsOf(str1);
        let bigrams2 = Utilities.BigramsOf(str2);
        let bigramsset = new Set(bigrams1);
        let incommon = 0;
        for (const bigram of bigramsset) {
            for (const secondbigram of bigrams2) {
                if (bigram === secondbigram) {
                    incommon++;
                }
            }
        }
        return incommon;
    }
    static SorensonDice(str1, str2) {
        return 2 * (Utilities.SimilarBigramsOf(str1.toLowerCase(), str2.toLowerCase())) / (str1.length - 1 + str2.length - 1);
    }
    static LongestCommonSubstring(str1, str2) {
        let longest = 0;
        let longestsubstr = "";
        let start1 = 0;
        let end1 = 0;
        let start2 = 0;
        let end2 = 0;
        for (let start1t = 0; start1t < str1.length; start1t++) {
            for (let end1t = start1t + 1; end1t <= str1.length; end1t++) {
                let substr = str1.slice(start1t, end1t);
                if (str2.includes(substr) && substr.length > longest) {
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
        };
    }
    static RatcliffObershelpRaw(str1, str2) {
        if (str1.length * str2.length === 0)
            return 0;
        let common = Utilities.LongestCommonSubstring(str1, str2);
        if (common.longest === 0)
            return 0;
        let left = Utilities.RatcliffObershelpRaw(str1.slice(0, common.start1), str2.slice(0, common.start2));
        let right = Utilities.RatcliffObershelpRaw(str1.slice(common.end1), str2.slice(common.end2));
        return common.longest + left + right - Math.abs(common.start1 - common.start2) / 200;
    }
    static RatcliffObershelpCustom(str1, str2) {
        return Utilities.RatcliffObershelpRaw(str1.toLowerCase(), str2.toLowerCase()) / (str1.length + str2.length / 100);
    }
    static RatcliffObershelp(str1, str2) {
        return 2 * Utilities.RatcliffObershelpRaw(str1.toLowerCase(), str2.toLowerCase()) / (str1.length + str2.length);
    }
    /* Moment Utilities */
    static now() {
        return moment.tz("America/Los_Angeles").format();
    }
    static getTodayStr() {
        return moment.tz("America/Los_Angeles").format("MM/DD/YYYY");
    }
    static formatTime(t) {
        let time = moment.tz(t, "America/Los_Angeles");
        let diff = time.diff(moment.tz("America/Los_Angeles"), "milliseconds");
        if (diff < 0) {
            return time.format("MM/DD h:mm:ss a");
        }
        else {
            let days = time.diff(moment.tz("America/Los_Angeles"), "days");
            let hrs = time.diff(moment.tz("America/Los_Angeles"), "hours") % 24;
            let mins = time.diff(moment.tz("America/Los_Angeles"), "minutes") % 60;
            return `${days} days, ${hrs} hrs, ${mins} mins, at ${time.format("MM/DD h:mm:ss a")}`;
        }
    }
    static timediff(momentobj) {
        let now = moment.tz("America/Los_Angeles");
        return momentobj.diff(now, 'days');
    }
    /* Discord Utilities */
    static sendEmoteCollector(origmessage, embed, num, millis) {
        return __awaiter(this, void 0, void 0, function* () {
            const emote = "👍";
            const downemote = "👎";
            let message = yield origmessage.channel.send({
                embed: embed(false)
            }, { allowedMentions: { parse: [] } });
            yield message.react(emote);
            yield message.react(downemote);
            yield message.react("❌");
            const filter = (reaction, user) => {
                let gmember = (message.guild.member(user));
                return ([emote, downemote].includes(reaction.emoji.name) && !user.bot) ||
                    (["❌"].includes(reaction.emoji.name) && gmember.hasPermission("ADMINISTRATOR") && !user.bot);
            };
            while (true) {
                try {
                    yield message.awaitReactions(filter, {
                        max: 1,
                        time: millis,
                        errors: ['time']
                    });
                }
                catch (err) {
                    yield message.reactions.removeAll();
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
                        yield message.delete();
                        return false;
                    }
                }
                let votestrue = count.has(emote) ? count.get(emote).count : 0;
                let votesfalse = count.has(downemote) ? count.get(downemote).count : 0;
                if (votestrue - votesfalse + 1 > num) {
                    yield message.reactions.removeAll();
                    yield message.edit({ embed: embed(true) });
                    return true;
                }
            }
        });
    }
    static sendApprove(origmessage, embed, millis) {
        return __awaiter(this, void 0, void 0, function* () {
            const emote = "👍";
            const downemote = "👎";
            let message = yield origmessage.channel.send({
                embed
            }, { allowedMentions: { parse: [] } });
            yield message.react(emote);
            yield message.react(downemote);
            const filter = (reaction, user) => {
                return ([emote, downemote].includes(reaction.emoji.name)) && user.id === origmessage.author.id;
            };
            try {
                let r = yield message.awaitReactions(filter, {
                    max: 1,
                    time: millis,
                    errors: ['time']
                });
                if (r.first().emoji.name === emote) {
                    message.delete();
                    return true;
                }
                else {
                    message.delete();
                    return false;
                }
            }
            catch (err) {
                yield message.reactions.removeAll();
                message.delete();
                return false;
            }
        });
    }
    /**
     * @param {Discord.Message|Discord.TextChannel} origmessage
     */
    static sendClosableEmbed(origmessage, embed) {
        return __awaiter(this, void 0, void 0, function* () {
            if (origmessage instanceof Discord.Message) {
                let message = yield origmessage.channel.send({
                    embed
                }, { allowedMentions: { parse: [] } });
                yield message.react("❌");
                const filter = (reaction, user) => {
                    return ['❌'].includes(reaction.emoji.name) && user.id === origmessage.author.id;
                };
                let collected;
                try {
                    collected = yield message.awaitReactions(filter, {
                        max: 1,
                        time: 60000,
                        errors: ['time']
                    });
                }
                catch (err) {
                    yield message.reactions.removeAll();
                    return false;
                }
                const reaction = collected.first();
                try {
                    yield reaction.users.remove(origmessage.author.id);
                }
                catch (_a) { }
                finally {
                    yield message.delete();
                }
            }
            else if (origmessage instanceof Discord.TextChannel) {
                let message = yield origmessage.send({
                    embed
                });
                yield message.react("❌");
                const filter = (reaction, user) => {
                    return ['❌'].includes(reaction.emoji.name);
                };
                let collected;
                try {
                    collected = yield message.awaitReactions(filter, {
                        max: 1,
                        time: 60000,
                        errors: ['time']
                    });
                }
                catch (err) {
                    yield message.reactions.removeAll();
                    return false;
                }
                yield message.delete();
            }
        });
    }
    static sendCarousel(origmessage, embeds) {
        return __awaiter(this, void 0, void 0, function* () {
            // Remap embeds
            embeds = embeds.map((e) => {
                if (e.embed) {
                    return Object.assign(Object.assign({}, e), Utilities.embedInfo(origmessage));
                }
                else {
                    return {
                        embed: Object.assign(Object.assign({}, e), Utilities.embedInfo(origmessage))
                    };
                }
            });
            const message = yield origmessage.channel.send(embeds[0], { allowedMentions: { parse: [] } });
            // ⬅️ ❌ ➡️
            yield message.react("⬅️");
            yield message.react("❌");
            yield message.react("➡️");
            Utilities.carouselPage(message, embeds, 0, origmessage);
        });
    }
    static carouselPage(message, embeds, curr, origmessage) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = (reaction, user) => {
                return ['❌', '⬅️', '➡️'].includes(reaction.emoji.name) && user.id === origmessage.author.id;
            };
            let collected;
            try {
                collected = yield message.awaitReactions(filter, {
                    max: 1,
                    time: 60000,
                    errors: ['time']
                });
            }
            catch (err) {
                yield message.reactions.removeAll();
                return false;
            }
            const reaction = collected.first();
            yield reaction.users.remove(origmessage.author.id);
            if (reaction.emoji.name === '❌') {
                yield message.delete();
                return true;
            }
            else if (reaction.emoji.name === '⬅️') {
                curr--;
                while (curr < 0) {
                    curr += embeds.length;
                }
                yield message.edit(embeds[curr]);
                this.carouselPage(message, embeds, curr, origmessage);
            }
            else if (reaction.emoji.name === '➡️') {
                curr++;
                while (curr >= embeds.length) {
                    curr -= embeds.length;
                }
                yield message.edit(embeds[curr]);
                this.carouselPage(message, embeds, curr, origmessage);
            }
        });
    }
    static basicEmbedInfo() {
        return {
            "color": 111111,
            "timestamp": Utilities.now(),
        };
    }
    static embedInfo(message) {
        return Object.assign(Object.assign({}, Utilities.basicEmbedInfo()), { "footer": {
                "text": `Requested by ${message.author.username}`,
                "icon_url": message.author.displayAvatarURL()
            } });
    }
}
exports.Utilities = Utilities;
