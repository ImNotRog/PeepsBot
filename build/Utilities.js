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
            });
            yield message.react(emote);
            yield message.react(downemote);
            yield message.react("❌");
            const filter = (reaction, user) => {
                let gmember = (message.guild.member(user));
                return ([emote, downemote].includes(reaction.emoji.name)) ||
                    (["❌"].includes(reaction.emoji.name) && gmember.hasPermission("ADMINISTRATOR"));
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
    /**
     * @param {Discord.Message|Discord.TextChannel} origmessage
     */
    static sendClosableEmbed(origmessage, embed) {
        return __awaiter(this, void 0, void 0, function* () {
            if (origmessage instanceof Discord.Message) {
                let message = yield origmessage.channel.send({
                    embed
                });
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
            const message = yield origmessage.channel.send(embeds[0]);
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
    static basicEmbedInfoForCal() {
        return {
            "color": 111111,
            "timestamp": Utilities.now(),
            "author": {
                "name": "F Period Bio",
                "icon_url": "https://cdn.discordapp.com/embed/avatars/2.png"
            },
        };
    }
    static embedInfo(message) {
        return Object.assign(Object.assign({}, Utilities.basicEmbedInfoForCal()), { "footer": {
                "text": `Requested by ${message.author.username}`,
                "icon_url": message.author.displayAvatarURL()
            } });
    }
}
exports.Utilities = Utilities;
