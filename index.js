
const Discord = require("discord.js");

require("dotenv").config();

const config = process.env.BOT_TOKEN

const admin = require('firebase-admin');
serviceAccount = process.env;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://games-ff9af.firebaseio.com'
});
const db = admin.firestore();

const client = new Discord.Client();

const { google } = require('googleapis');

let moment = require("moment-timezone");
const { max } = require("moment-timezone");
// const { title } = require("process");

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    oAuth2Client.setCredentials({
        access_token: process.env.access_token,
        refresh_token: process.env.refresh_token,
        scope: process.env.scope,
        token_type: process.env.token_type,
        expiry_date: parseInt( process.env.expiry_date )
    });
    return (oAuth2Client);
}

class SheetsUser {
    SheetsUser() {
        
    }
}

class ProcessorBot {

    /**
     * @constructor
     * @param {google.auth.OAuth2} auth 
     */
    constructor(auth) {

        this.sheets = google.sheets({ version: 'v4', auth });

        this.destroy = [];
        this.prefix = "--"

        this.daysmap = new Map();

        this.groovySheetID = "1dBQuwHZ35GSpFDuwT_9xQRErFRwCuAO6ePiH_aAIOyU"
        this.todaySheetID = ""

        this.quoteID = "1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM"
        this.quoteSheetID = ""

        this.colors = [this.RGBtoObj(255, 0, 0), this.RGBtoObj(255, 255, 0), this.RGBtoObj(0, 255, 0), this.RGBtoObj(0, 255, 255), this.RGBtoObj(0, 0, 255), this.RGBtoObj(255, 0, 255), this.RGBtoObj(255, 150, 0), this.RGBtoObj(0, 0, 0)]
    
        this.getSheetIDs();

        this.collectingChannels = ["754912483390652426", "756698378116530266"]
        this.updateChannels = [];

        this.musicBots = ["234395307759108106"]

        this.approvedMusicServers = ["748669830244073533"]

    }

    /**
     * 
     * @param {Discord.Client} client 
     */
    async onConstruct(client){
        
        await this.getdays();

        await this.readList(this.getTodayStr())

        for (const id of this.collectingChannels) {

            let channel = await client.channels.fetch(id)
            channel.messages.fetch({
                limit: 90
            })
        }

        for (const id of this.updateChannels) {

            let channel = await client.channels.fetch(id)
            await channel.send("**PeepsBot is now online.**")
        }
        
        let keys = [... this.daysmap.keys()];

        let requests = [];

        for(let key of keys){
            let keyid = this.daysmap.get(key);
            let rows = (await this.readSheet(this.groovySheetID, key));
            let values = [];
            let numdeleted = 0;

            for(let i = 0; i < rows.length; i++){
                let val = rows[i][0];
                if(values.indexOf(val) === -1) {
                    values.push(val);
                } else {
                    
                    requests.push( {
                        deleteDimension: {
                            range: {
                                sheetId: keyid,
                                dimension: "ROWS",
                                startIndex: i-numdeleted,
                                endIndex: i+1-numdeleted
                            }
                        }
                    });

                    numdeleted++;

                }

                
            }
        }

        try {
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.groovySheetID,
                resource: { requests },
            });
        } catch (err){ }
        

        console.log("Cleanup done!")
         
    }

    RGBtoObj(r, g, b) {
        return {
            red: r / 255,
            green: g / 255,
            blue: b / 255
        }
    }

    /**
     * 
     */
    async getdays() {
        let getdata = (await this.sheets.spreadsheets.get({ spreadsheetId: this.groovySheetID }));

        ;const [today, todaystr] = this.getNow();

        this.daysmap.clear();
        for (const curr of getdata.data.sheets) {
            this.daysmap.set(curr.properties.title, curr.properties.sheetId)

            if(curr.properties.title === todaystr) {
                this.todaySheetID = curr.properties.sheetId
            }
        }

        await this.addday();
        await this.formatPage();
    }

    async addday() {

        ;const [today, todaystr] = this.getNow();

        if (!this.daysmap.has(todaystr)) {
            let requests = [];

            requests.push({
                addSheet: {
                    properties: {
                        title: todaystr,
                        tabColor: this.colors[today.day()]
                    }
                }
            })

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.groovySheetID,
                resource: { requests },
            });

            await this.getdays();

        }

    }

    async formatPage() {
        let requests = [];

        requests.push( {
            update_sheet_properties: {
                properties: {
                    sheet_id: this.todaySheetID,
                    grid_properties: {
                        frozen_row_count: 1
                    }
                },
                fields: 'gridProperties.frozenRowCount'
            }
        })

        requests.push({
            "updateDimensionProperties": {
                "range": {
                    "sheetId": this.todaySheetID,
                    "dimension": "COLUMNS",
                    "startIndex": 0,
                    "endIndex": 2
                },
                "properties": {
                    "pixelSize": 600
                },
                "fields": "pixelSize"
            }
        },)

        requests.push({
            updateCells: {
                "rows": [{
                    values: [{
                        userEnteredValue: {
                            stringValue: "Title"
                        }
                    }, {
                        userEnteredValue: {
                            stringValue: "Link"
                        }
                    }]
                }],
                fields: "*",
                range: {
                    "sheetId": this.todaySheetID,
                    "startRowIndex": 0,
                    "endRowIndex": 1,
                    "startColumnIndex": 0,
                    "endColumnIndex": 2
                },
            }
        })

        requests.push({
            repeatCell: {
                range: {
                    sheetId: this.todaySheetID,
                    startRowIndex: 0,
                    endRowIndex: 1
                },
                cell: {
                    userEnteredFormat: {
                        horizontalAlignment: "CENTER",
                        textFormat: {
                            bold: true
                        }
                    }
                },
                "fields": "userEnteredFormat(textFormat,horizontalAlignment)"
            }
        });

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.groovySheetID,
            resource: {
                requests
            },
        });
    }

    getNow() {
        let today = moment.tz("America/Los_Angeles")
        let todaystr = today.format("ddd MM/DD/YYYY")
        
        return [today,todaystr]
    }

    getTodayStr(){
        return this.getNow()[1];
    }

    async readList(listname) {
        if(this.daysmap.has(listname)) {
            let currsheetid = this.daysmap.get(listname)
            let res = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.groovySheetID,
                range: `${listname}!A2:B`
            })
            let rows = res.data.values;
            return rows;
        } else {
            throw "Wait, that's illegal."
        }
    }

    /**
     * 
     * @param {String} listname 
     * @param {Discord.Message} message
     */
    async playList(listname,message) {
        let list = await this.readList(listname);
        await message.channel.send("-play " + list[0][0]);
    }

    async getSheetIDs() {
        this.quoteSheetID = "";
        let getdata = (await this.sheets.spreadsheets.get({ spreadsheetId: this.quoteID }));
        for (const curr of getdata.data.sheets) { 
            this.quoteSheetID = curr.properties.sheetId
        }
    }

    async addGroovyEntry(title,link) {
        let requests = [];

        requests.push({
            appendCells: {
                "sheetId": this.todaySheetID,
                "rows": [
                    { 
                        values: [ {
                            userEnteredValue: {
                                stringValue: title
                            }
                        }, {
                            userEnteredValue: {
                                stringValue: link
                            }
                        }]
                    }
                ],
                fields: "*"
            }
        })

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.groovySheetID,
            resource: {
                requests
            },
        });
    }

    stripQuotes(txt) {
        if(txt.startsWith('"')) {
            txt = txt.slice(1,txt.length - 1)
        }
        return txt;
    }

    async readLittleQuotes() {

        let rows = await this.readSheet(this.quoteID, `Sheet1!A2:B`)
        for (const row of rows) {
            row[0] = this.stripQuotes(row[0])
        }

        return rows;
    
    }

    /**
     * 
     * @param {string} id 
     * @param {string} range 
     */
    async readSheet(id, range) {
        let res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: id,
            range
        })
        return res.data.values;
    }

    async addLittleQuote(quote,stars) {

        quote = this.stripQuotes(quote);

        let alreadydone = await this.readLittleQuotes();
        let line = -1;

        for(let i = 0; i < alreadydone.length; i++ ){
            if(alreadydone[i][0] === quote) {
                line = i+2;
            }
        }

        if(line === -1) {
            let requests = [];

            requests.push({
                appendCells: {
                    "sheetId": this.quoteSheetID,
                    "rows": [{
                        values: [{
                            userEnteredValue: {
                                stringValue: quote
                            }
                        }, {
                            userEnteredValue: {
                                numberValue: stars
                            }
                        }]
                    }],
                    fields: "*"
                }
            })

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.quoteID,
                resource: {
                    requests
                },
            });
        } else {

            let requests = [];

            requests.push({
                updateCells: {
                    "rows": [{
                        values: [{
                            userEnteredValue: {
                                stringValue: quote
                            }
                        }, {
                            userEnteredValue: {
                                numberValue: stars
                            }
                        }]
                    }],
                    fields: "*",
                    range: {
                        "sheetId": this.quoteSheetID,
                        "startRowIndex": line-1,
                        "endRowIndex": line,
                        "startColumnIndex": 0,
                        "endColumnIndex": 2
                    },
                }
            })

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.quoteID,
                resource: {
                    requests
                },
            });
        }
    }

    async randomLittleQuote() {
        let quotes = await this.readLittleQuotes();

        let total = 0;
        for (const row of quotes) {
            total += parseInt(row[1]);
        }
        let randomnum = Math.random() * total;

        for(const row of quotes) {
            randomnum -= parseInt(row[1])
            if(randomnum <= 0) {

                let quote = this.stripQuotes(row[0])
                console.log(`My wisdom was summoned, and I responded with ${quote}.`)
                return quote;
            }
        }
    }

    /**
     * 
     * @param {string} txt1 
     * @param {string} txt2 
     */
    similarities(txt1, txt2) {

        if(txt1.startsWith("\"")) {
            txt1 = txt1.slice(1,txt1.length-1)
        }
        if (txt2.startsWith("\"")) {
            txt2 = txt2.slice(1, txt2.length - 1)
        }

        let words1 = txt1.toLowerCase().split(" ");
        let words2 = txt2.toLowerCase().split(" ");

        let similarities = 0;

        for(const word of words1) {
            if(words2.indexOf(word) !== -1) similarities ++;
        }
        return similarities
    }

    async notRandomLittleQuote(messagecontent) {
        let quotes = await this.readLittleQuotes();

        let probs = [];
        let total = 0;
        for (let i = 0; i < quotes.length; i++) {
            const row = quotes[i];
            probs.push(this.similarities(row[0],messagecontent));
            total += probs[i];
        }

        let currtotal = Math.random() * total;
        if(total === 0){
            return "Sorry, I'm not sure what to think about that."
        }
        for (let i = 0; i < quotes.length; i++) {
            currtotal -= probs[i];
            if(currtotal <= 0) {
                return quotes[i][0]
            }
        }
        return "Error"
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

            await this.addday();

            await this.addGroovyEntry(title, link)
        }
        
    }

    /**
     * 
     * @param {Discord.Message} message
     */
    async onMessage(message) {
        try {
            await this.onMessageDo(message);
        } catch(err) {
            message.channel.send("**There was an error:**\n" + err);
        }
    }

    /**
     * 
     * @param {Discord.Message} message
     */
    async onMessageDo(message) {

        for(const id of this.destroy) {
            if(message.author.id === id) {
                message.delete();
            }
        }

        if (message.author.bot) {
            if(this.approvedMusicServers.indexOf(message.guild.id) !== -1 && this.musicBots.indexOf( message.author.id ) !== -1 && message.embeds[0]){

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
            
            return;
        };

        if(message.content === "!little") {
            message.channel.send(`It's ${this.prefix}little now. I had to change it to something less generic.`)
        } else if(message.content === "<@!750573267026182185>") {
            message.channel.send(await this.randomLittleQuote());
        }

        if (!message.content.startsWith(this.prefix)) return;

        const commandBody = message.content.slice(this.prefix.length);
        const args = commandBody.split(' ');
        const command = args.shift().toLowerCase();

        if(command === "spreadsheets") {
            message.channel.send(new Discord.MessageEmbed({
                "title": "– Spreadsheets –",
                "description": "A list of PeepsBot's spreadsheets.",
                "color": "#00ffff",
                "fields": [
                    {
                        "name": "Little Quotes",
                        "value": "All of our Little Quotes can be found here: [Link](https://docs.google.com/spreadsheets/d/1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM/edit#gid=0,)"
                    },
                    // {
                    //     "name": "Our Groovy History",
                    //     "value": "All of the Groovy songs played can be found here: [Link](https://docs.google.com/spreadsheets/d/1dBQuwHZ35GSpFDuwT_9xQRErFRwCuAO6ePiH_aAIOyU/edit#gid=1430553805)"
                    // }
                ],
                "footer": {
                    "text": `Requested by ${message.author.username}`,
                    "icon_url": message.author.displayAvatarURL()
                }
            }));
        }

        if(command === "little") {
            message.channel.send(await this.randomLittleQuote());
        }

        if(command === "littler") {
            message.channel.send(await this.notRandomLittleQuote(args.join(" ")))
        }
        
        if (command === "profile") {
            
            message.channel.send("Hi wonderful biologists! I'm Mr. Little, biology teacher, TOSA, and SELF mentor!");
            
        }

        if(command === "help") {
            message.channel.send(`This is a relatively new bot. The only command is ${this.prefix}little.`)
        }
        
    }

    /**
     * 
     * @param {Discord.MessageReaction} reaction 
     * @param {*} user 
     */
    async onReaction(reaction, user) {

        
        if (this.collectingChannels.indexOf(reaction.message.channel.id) === -1) return;

        // When we receive a reaction we check if the reaction is partial or not
        if (reaction.partial) {
            // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                return;
            }
        }

        // // Now the message has been cached and is fully available
        // // The reaction is now also fully available and the properties will be reflected accurately:
        // console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
        
        if (reaction.emoji.name === "👍") {
            this.addLittleQuote(reaction.message.content, reaction.count)
            console.log(`"${reaction.message.content}" has ${reaction.count} thumbs ups!`);
        }

        
    }
}

(async () => {
    let sheets = authorize({
        installed: {
            client_id: process.env.client_id_googleoath,
            project_id: process.env.project_id_googleoath,
            auth_uri: process.env.auth_uri_googleoath,
            token_uri: process.env.token_uri_googleoath,
            auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url_googleoath,
            client_secret: process.env.client_secret_googleoath,
            redirect_uris: [process.env.redirect_uris1_googleoath, process.env.redirect_uris2_googleoath]
        }
    });

    let processorbot = new ProcessorBot(sheets);

    console.log("Up now!")

    client.on("message", async function (message) {
        processorbot.onMessage(message)
    });

    client.on("messageReactionAdd", async function(reaction, user){
        await processorbot.onReaction(reaction, user)
    })

    client.on("messageReactionRemove", async function(reaction,user){
        await processorbot.onReaction(reaction,user)
    })
    await client.login(config);
    await processorbot.onConstruct(client);

})();

