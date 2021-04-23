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
                    let allchildren = this.self.baseFolder.wordSearch(str);
                    let maxchild = allchildren[0];
                    let max = Utilities_1.Utilities.RatcliffObershelpCustom(str, maxchild.data.title);
                    message.channel.send({
                        embed: Object.assign({ title: `Search for "${str.toUpperCase()}"`, fields: [
                                ...yield maxchild.toEmbedFields(),
                                {
                                    name: `Similar Results`,
                                    value: `The above result was ${Math.round(max * 100)}% similar.\n${allchildren.slice(1, 5).map(a => `${Math.round(Utilities_1.Utilities.RatcliffObershelpCustom(str, a.data.title) * 100)}% - ${a.toString()}`).join('\n')}`
                                }
                            ] }, Utilities_1.Utilities.embedInfo(message))
                    });
                }
                else if (result.command === "get") {
                    let id = result.args[0];
                    let getid = this.self.baseFolder.findall((sfile) => parseInt(sfile.data.id) === parseInt(id));
                    if (getid.length === 0) {
                        message.channel.send({
                            embed: Object.assign({ title: `No file found with ID ${id}`, description: `Make sure you're using this command correctly!` }, Utilities_1.Utilities.embedInfo(message))
                        });
                    }
                    else if (getid.length > 1) {
                        message.channel.send({
                            embed: Object.assign({ title: `More than one file found with ID ${id}`, description: `Report to Rog#2597 immediately. This is actually kind of importnat.` }, Utilities_1.Utilities.embedInfo(message))
                        });
                        console.log(`Duplicate id ${id}`);
                    }
                    else {
                        message.channel.send({
                            embed: Object.assign({ title: `Search for ID ${id}`, fields: [
                                    ...yield getid[0].toEmbedFields(),
                                ] }, Utilities_1.Utilities.embedInfo(message))
                        });
                    }
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
    available(guild) {
        return guild && guild.id === '748669830244073533';
    }
}
exports.SqualolBot = SqualolBot;
