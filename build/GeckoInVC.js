"use strict";
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
exports.GeckoInVCBot = void 0;
const Discord = require("discord.js");
const ProcessMessage_1 = require("./ProcessMessage");
class GeckoInVCBot {
    constructor(client) {
        this.LogChannel = "755528072597471243";
        this.GECKO = "526863414635790356";
        this.FPERBIO = "748669830244073533";
        this.geckostatus = 0;
        this.client = client;
        this.client.on("voiceStateUpdate", (a, b) => {
            this.handleVoiceUpdate(a, b);
        });
    }
    handleVoiceUpdate(before, after) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield this.client.users.fetch(before.id);
            if (before.channelID === after.channelID) {
                return;
            }
            let bchannel;
            let achannel;
            if (before.channel != null && before.channel.guild.id !== this.FPERBIO) {
                bchannel = null;
            }
            else {
                bchannel = before.channel;
            }
            if (after.channel != null && after.channel.guild.id !== this.FPERBIO) {
                achannel = null;
            }
            else {
                achannel = after.channel;
            }
            let messages = [];
            if (bchannel == null) {
                // Joined channel
                messages =
                    [
                        `Fek ${user.username}#${user.discriminator}!`,
                        `<:doggowave:811022887577976843>`
                    ];
            }
            else if (achannel == null) {
                // Left channel
                messages =
                    [
                        `Bofek ${user.username}#${user.discriminator}! <:lemonpensive:806262605752434699>`,
                    ];
                if (user.id === this.GECKO) {
                    this.geckostatus = 0;
                }
            }
            else {
                // Moved channel
            }
            for (const channel of [bchannel, achannel]) {
                if (channel != null && channel instanceof Discord.VoiceChannel) {
                    let arr = channel.members.array();
                    if (arr.length === 1) {
                        if (channel.members.has(this.GECKO)) {
                            messages.push("Gecko alone in the VC\nWhat will he do?");
                            messages.push("<:owo:808895647108825109>");
                            this.geckostatus = 1;
                        }
                    }
                    if (arr.length > 1) {
                        if (channel.members.has(this.GECKO)) {
                            this.geckostatus = 2;
                        }
                    }
                }
            }
            let channel = yield this.client.channels.fetch(this.LogChannel);
            if (channel instanceof Discord.TextChannel) {
                for (const message of messages) {
                    yield channel.send(message);
                }
            }
        });
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                if (result.command === "isgeckointhevc") {
                    message.channel.send(this.isGeckoInTheVC());
                }
            }
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getGeckoInVC();
        });
    }
    isGeckoInTheVC() {
        switch (this.geckostatus) {
            case 0:
                return "Gecko is not in the VC.";
            case 1:
                return "Gecko alone in the VC\nWhat will he do?";
            case 2:
                return "Gecko not alone in the VC\nWhat will he do?";
            default:
                return "Something went wrong...";
        }
    }
    getGeckoInVC() {
        return __awaiter(this, void 0, void 0, function* () {
            this.geckostatus = 0;
            let guild = yield this.client.guilds.fetch(this.FPERBIO);
            for (const channel of guild.channels.cache.array()) {
                if (channel instanceof Discord.VoiceChannel) {
                    if (channel.members.size === 1) {
                        if (channel.members.has(this.GECKO)) {
                            this.geckostatus = 1;
                        }
                    }
                    if (channel.members.size > 1) {
                        if (channel.members.has(this.GECKO)) {
                            this.geckostatus = 2;
                        }
                    }
                }
            }
        });
    }
    available(message) {
        return message.guild.id === "748669830244073533";
    }
}
exports.GeckoInVCBot = GeckoInVCBot;
