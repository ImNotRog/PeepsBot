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
exports.ReactBot = void 0;
class ReactBot {
    constructor() {
        this.reactmap = new Map();
        this.reactmap.set("little", "754075455304499211");
        this.reactmap.set("trg", "788460256052117524");
        this.reactmap.set("checkpoint", "788460631715348480");
        // this.reactmap.set("cer", "788461210609647646");
        // this.reactmap.set("pain", "776522384642932766");
        // this.reactmap.set("fperbio", "776522302669062154");
        // this.reactmap.set("hw", "755144784083026101");
        // this.reactmap.set("jack", "783125462045032498");
        // this.reactmap.set("tired", "783452754625429504");
        this.chainmap = new Map();
        this.chainmap.set("🥕", [
            {
                value: "^",
                method: "CONTAINS"
            }
        ]);
        // this.chainmap.set("776525118330503189",
        //     [
        //         {
        //             value: "f",
        //             method: "ONLY"
        //         }
        //     ]);
        // More code here
        // @todo Carrot steal
        this.helpEmbed = {
            title: 'Help - React Bot',
            description: `Ever wanted your ^ to be an actual carrot? Well, want no more, for this incredibly useless bot now exists! Any time you say ^, TRG, Checkpoint, CER, or more, you'll be rewarded with a custom emoji reaction!`,
            fields: []
        };
        this.commands = [
            {
                name: "ReportTheft",
                description: "Report your carrot theft to the local police. Police as in Peepsbot. As in me.",
                parameters: [],
                available: (guild) => true,
                slashCallback: (invoke, channel, user) => __awaiter(this, void 0, void 0, function* () {
                    invoke(yield this.reportTheft(user.id, channel));
                }),
                regularCallback: (message) => __awaiter(this, void 0, void 0, function* () {
                    message.channel.send(yield this.reportTheft(message.author.id, message.channel));
                })
            }
        ];
    }
    available(guild) {
        return true;
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    isChain(content, chainobj) {
        for (const curr of chainobj) {
            if (curr.method === "ONLY") {
                return (content === curr.value);
            }
            else if (curr.method === "CONTAINS") {
                if (content.includes(curr.value))
                    return true;
            }
        }
        return false;
    }
    reportTheft(theftreporter, channel) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // let theftreporter = msg.author.id;
            let messages = yield channel.messages.fetch({
                limit: 30
            });
            let discoveredcrimescene = false;
            let discoveredculprit = false;
            let culprit = null;
            let caseclosed = false;
            for (const key of messages.keyArray()) {
                let message = messages.get(key);
                if (discoveredculprit) {
                    yield message.react('🥕');
                    caseclosed = true;
                    break;
                }
                if (!discoveredculprit && discoveredcrimescene) {
                    if (message.reactions.cache.has('🥕')) {
                        (_a = message.reactions.cache.get('🥕')) === null || _a === void 0 ? void 0 : _a.remove();
                        discoveredculprit = true;
                        culprit = message.author;
                        continue;
                    }
                }
                if (!discoveredcrimescene && message.author.id === theftreporter && this.isChain(message.content, this.chainmap.get('🥕'))) {
                    discoveredcrimescene = true;
                    continue;
                }
            }
            if (!caseclosed) {
                return `Unfortunately, I was unable to solve the crime.`;
            }
            else {
                return `Theft reported and solved. ${culprit.username}#${culprit.discriminator} was the culprit and is stinky.`;
            }
        });
    }
    onMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const key of this.reactmap.keys()) {
                if (msg.content.toLowerCase().replace(/[,\.!"']/g, '').split(" ").includes(key)) {
                    msg.react(this.reactmap.get(key));
                }
            }
            for (const emoji of this.chainmap.keys()) {
                if (this.isChain(msg.content, this.chainmap.get(emoji))) {
                    let messages = yield msg.channel.messages.fetch({
                        limit: 10
                    });
                    for (const key of messages.keyArray().slice(1)) {
                        if (!this.isChain(messages.get(key).content, this.chainmap.get(emoji))) {
                            messages.get(key).react(emoji);
                            break;
                        }
                    }
                }
            }
        });
    }
}
exports.ReactBot = ReactBot;
