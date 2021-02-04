var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { SheetsUser } = require("./SheetsUser");
const { Utilities } = require("./Utilities");
class TrackerBot extends Utilities {
    /**
     * @constructor
     * @param {google.auth.OAuth2} auth
     */
    constructor(auth) {
        super();
        this.colors =
            [
                this.RGBtoObj(255, 0, 0),
                this.RGBtoObj(255, 255, 0),
                this.RGBtoObj(0, 255, 0),
                this.RGBtoObj(0, 255, 255),
                this.RGBtoObj(0, 0, 255),
                this.RGBtoObj(255, 0, 255),
                this.RGBtoObj(255, 150, 0),
                this.RGBtoObj(0, 0, 0)
            ];
        let currmap = new Map();
        currmap.set("music", "17YiJDj9-IRnP_sPg3HJYocdaDkkFgMKfNC6IBDLSLqU");
        this.sheetsUser = new SheetsUser(auth, currmap);
        this.musicBots = ["234395307759108106"];
        this.prefix = "--";
        this.helpEmbed = {
            title: `Help - Groovy Tracker Bot`,
            description: [
                `Keeps track of all the Groovy songs we've ever played on the FPERBIO server exclusively.`,
                `Why? Unsure, just because I feel like it.`
            ].join(` `),
            fields: [
                {
                    name: `${this.prefix}groovy`,
                    value: `Provides the Google spreadsheet where the data is stored.`
                },
            ]
        };
    }
    RGBtoObj(r, g, b) {
        return {
            red: r / 255,
            green: g / 255,
            blue: b / 255
        };
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Groovy Tracker Bot constructing...`);
            yield this.sheetsUser.SetUpSheets();
            console.log(`Groovy Tracker Bot complete.`);
        });
    }
    readList() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sheetsUser.readSheet("music", "Groovy");
        });
    }
    addGroovyEntry(title, link) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sheetsUser.addWithoutDuplicates("music", "Groovy", [title, link, 1, this.getTodayStr()], [true, true, (x) => parseInt(x) + 1, "CHANGE"]);
        });
    }
    /**
     * @param {String} txt
     */
    processPlayMessage(txt) {
        return __awaiter(this, void 0, void 0, function* () {
            if (txt && txt.startsWith("[")) {
                let endtitle = txt.indexOf("](");
                let title = txt.slice(1, endtitle);
                let startlink = endtitle + 2;
                let endlink = txt.indexOf(") [<@");
                let link = txt.slice(startlink, endlink);
                yield this.addGroovyEntry(title, link);
            }
        });
    }
    process(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.embeds[0] && this.musicBots.indexOf(message.author.id) !== -1) {
                let prevmsg = yield message.channel.messages.fetch({
                    limit: 2
                });
                let keys = prevmsg.keys();
                keys.next();
                let prevmsgkey = keys.next().value;
                let content = prevmsg.get(prevmsgkey).content;
                if (!content.startsWith("-np")) {
                    (this.processPlayMessage(message.embeds[0].description));
                }
            }
        });
    }
    /**
     *
     * @param {Discord.Message} message
     */
    sendSpreadsheets(message) {
        return __awaiter(this, void 0, void 0, function* () {
            message.channel.send({
                embed: Object.assign({ "title": "– Groovy Spreadsheet –", "description": "F Period Bio Gang Groovy", "fields": [
                        {
                            "name": "Our Groovy History",
                            "value": "All of the Groovy songs played can be found here: [Link](https://docs.google.com/spreadsheets/d/17YiJDj9-IRnP_sPg3HJYocdaDkkFgMKfNC6IBDLSLqU/edit#gid=0)"
                        }
                    ] }, this.embedInfo(message))
            });
        });
    }
}
module.exports = { TrackerBot };
