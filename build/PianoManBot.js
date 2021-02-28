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
exports.PianoManBot = void 0;
const nodecron = require("node-cron");
class PianoManBot {
    constructor(client) {
        this.pianoManChannel = ['750804960333135914'];
        this.client = client;
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            nodecron.schedule("* * * * *", () => {
                this.pianoMan();
            });
        });
    }
    pianoMan() {
    }
}
exports.PianoManBot = PianoManBot;
