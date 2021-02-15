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
exports.SqualolBot = void 0;
const SA_1 = require("./SA");
const Utilities_1 = require("./Utilities");
const ProcessMessage_1 = require("./ProcessMessage");
/**
 * @todo Build another layer of abstraction between SqualolBot and SA.ts
 */
class SqualolBot {
    constructor() {
        this.helpEmbed = {
            title: "Help Squalol Bot",
            description: `In progress!`,
            fields: []
        };
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                if (result.command === "search") {
                    let str = result.args.join(' ');
                    let allchildren = (this.self.baseFolder.listAllChildren());
                    let max = 0;
                    let maxchild = null;
                    for (const child of allchildren) {
                        let num = Utilities_1.Utilities.RatcliffObershelpRaw(child.data.title.toLowerCase(), str.toLowerCase());
                        if (num > max) {
                            maxchild = child;
                            max = num;
                        }
                    }
                    message.channel.send({
                        embed: Object.assign({ title: `Search for "${str}"`, fields: yield maxchild.toEmbedFields() }, Utilities_1.Utilities.embedInfo(message))
                    });
                }
            }
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            let stuff = new SA_1.Course((yield SA_1.SchoologyAccessor.listCourses("2016549"))[5]);
            yield stuff.onConstruct();
            this.self = stuff;
            // console.log(Utilities.RatcliffObershelp("i am going home", "gone home"));
            // console.log(Utilities.SimilarBigramsOf("Week 15", "Week 15 : November 16 - 20 [tk]"));
            // console.log(Utilities.SimilarBigramsOf("Week 15", "Week"));
            // fs.writeFileSync('./day1.json', JSON.stringify(await SchoologyAccessor.getFolder('2772305484', '398147550')))
            // fs.writeFileSync('./temp/assignmentslist.json', JSON.stringify( await (await SchoologyAccessor.get('/sections/2772305484/assignments?limit=1000')).json()) );
        });
    }
    available(message) {
        return message.guild.id === '748669830244073533';
    }
}
exports.SqualolBot = SqualolBot;
