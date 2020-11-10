const { SheetsUser } = require("./SheetsUser");
const { Utilities } = require("./Utilities")

class TrackerBot extends Utilities {
    /**
     * @constructor
     * @param {google.auth.OAuth2} auth
     */
    constructor(auth){
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
        
        this.musicBots = ["234395307759108106"]
    }

    RGBtoObj(r, g, b) {
        return {
            red: r / 255,
            green: g / 255,
            blue: b / 255
        }
    }

    async onConstruct(){
        await this.sheetsUser.SetUpSheets();
    }

    async readList() {
        return this.sheetsUser.readSheet("music", "Groovy");
    }

    async addGroovyEntry(title,link) {
        this.sheetsUser.addWithoutDuplicates("music", "Groovy", [title,link,1,this.getTodayStr()], [true,true, (x) => parseInt(x)+1, "CHANGE"]);
    }

    /**
     * @param {String} txt 
     */
    async processPlayMessage(txt){
        if (txt && txt.startsWith("[")) {
            let endtitle = txt.indexOf("](");
            let title = txt.slice(1, endtitle);

            let startlink = endtitle + 2;
            let endlink = txt.indexOf(") [<@")
            let link = txt.slice(startlink, endlink);

            await this.addGroovyEntry(title, link)
        }
        
    }
    
    async process(message) {
        if(message.embeds[0] && this.musicBots.indexOf( message.author.id ) !== -1){
            let prevmsg = await message.channel.messages.fetch({
                limit: 2
            })
            let keys = prevmsg.keys()
            keys.next();
            let prevmsgkey = keys.next().value;
            let content = prevmsg.get(prevmsgkey).content

            if(!content.startsWith("-np")){
                (this.processPlayMessage(message.embeds[0].description))
            }
        }
        
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async sendSpreadsheets(message){
        message.channel.send({
            embed: {
                "title": "– Groovy Spreadsheet –",
                "description": "F Period Bio Gang Groovy",
                "fields": [
                    {
                        "name": "Our Groovy History",
                        "value": "All of the Groovy songs played can be found here: [Link](https://docs.google.com/spreadsheets/d/17YiJDj9-IRnP_sPg3HJYocdaDkkFgMKfNC6IBDLSLqU/edit#gid=0)"
                    }
                ],
                ...this.embedInfo(message)
            }
            
        });
    }
}

module.exports = {TrackerBot};