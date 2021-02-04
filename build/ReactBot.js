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
        this.reactmap.set("cer", "788461210609647646");
        this.reactmap.set("pain", "776522384642932766");
        this.reactmap.set("fperbio", "776522302669062154");
        // this.reactmap.set("hw", "755144784083026101");
        this.reactmap.set("jack", "783125462045032498");
        this.reactmap.set("tired", "783452754625429504");
        this.chainmap = new Map();
        this.chainmap.set("🥕", [
            {
                value: "^",
                method: "CONTAINS"
            }
        ]);
        this.chainmap.set("776525118330503189", [
            {
                value: "f",
                method: "ONLY"
            }
        ]);
        // More code here
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
    onMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const key of this.reactmap.keys()) {
                if (msg.content.toLowerCase().split(" ").includes(key)) {
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
