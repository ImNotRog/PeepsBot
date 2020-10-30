
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

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
function authorize(credentials) {
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
    /**
     * 
     * @param {google.auth.OAuth2} auth 
     * @param {Map<string,string>} sheetIdMap 
     */
    constructor(auth, sheetIdMap) {
        this.sheets = google.sheets({version: 'v4', auth});
        this.map = new Map();
        for(const key of sheetIdMap.keys()) {
            this.map.set(key, {
                id: sheetIdMap.get(key),
                sheets: ""
            })
        }
        this.setup = false;
        this.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }

    async SetUpSheets() {
        for(const key of this.map.keys()) {

            let info = await this.getSpreadsheetInfo(key);
            let newmap = new Map();

            for(const sheet of info.data.sheets){
                newmap.set(sheet.properties.title, sheet.properties.sheetId);
            }

            this.map.get(key).sheets = newmap;
        }
    }

    async SetUpSheet(name) {
        let info = await this.getSpreadsheetInfo(name);
        let newmap = new Map();

        for(const sheet of info.data.sheets){
            newmap.set(sheet.properties.title, sheet.properties.sheetId);
        }

        this.map.get(name).sheets = newmap;
    }

    handleSheetId(param) {
        return (this.map.has(param) ? this.map.get(param).id : param);
    }

    async getSubsheets(name) {
        return [...this.map.get(name).sheets.keys()];
    }

    async add(sheetname,subsheetname,row) {
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        let requests = [];

        let mappedrow = row.map((x) => {
            if(typeof x === "string") {
                return {
                    userEnteredValue: {
                        stringValue: x
                    }
                }
            } else if(typeof x === "number") {
                return {
                    userEnteredValue: {
                        numberValue: x
                    }
                }
            }
        })

        requests.push({
            appendCells: {
                "sheetId": subsheetid,
                "rows": [
                    { 
                        values: mappedrow
                    }
                ],
                fields: "*"
            }
        })

        await this.executeRequest(sheetname, requests);
    }

    async bulkAdd(sheetname, subsheetname, rows) {
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        let requests = [];

        let mappedrows = rows.map((y) => {
            return {
                values: y.map((x) => {
                    if(typeof x === "string") {
                        return {
                            userEnteredValue: {
                                stringValue: x
                            }
                        }
                    } else if(typeof x === "number") {
                        return {
                            userEnteredValue: {
                                numberValue: x
                            }
                        }
                    }
                })
            }
        })
        

        requests.push({
            appendCells: {
                "sheetId": subsheetid,
                "rows": mappedrows,
                fields: "*"
            }
        })

        await this.executeRequest(sheetname, requests);
    }

    async updateRow(sheetname, subsheetname, row, num) {
        let requests = [];
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        let mappedrow = row.map((x) => {
            if(typeof x === "string") {
                return {
                    userEnteredValue: {
                        stringValue: x
                    }
                }
            } else if(typeof x === "number") {
                return {
                    userEnteredValue: {
                        numberValue: x
                    }
                }
            }
        })

        requests.push({
            updateCells: {
                rows: [{values: mappedrow }],
                fields: "*",
                range: {
                    "sheetId": subsheetid,
                    "startRowIndex": num,
                    "endRowIndex": num+1,
                    "startColumnIndex": 0,
                    "endColumnIndex": row.length
                },
            }
        })

        await this.executeRequest(sheetname, requests);
    }

    newRow(oldrow,newrow,rowcheck) {
        for(let i = 0; i < rowcheck.length; i++) {
            if(rowcheck[i] === true) { // It matters!
                // Don't change anything
            } else if(rowcheck[i] === "KEEP") {
                // Don't change anything
            } else if(rowcheck[i] === "CHANGE") {
                oldrow[i] = newrow[i];
            } else if(typeof rowcheck[i] === "function") {
                oldrow[i] = rowcheck[i](oldrow[i], newrow[i]);
            }
        }
        return oldrow;
    }

    async addWithoutDuplicates(sheetname, subsheetname, row, check) {
        let rows = await this.readSheet(sheetname, subsheetname);

        let duplicate = false;
        for(let i = 1; i < rows.length; i++) {
            let currrow = rows[i];
            let currisduplicate = true;
            for(let j = 0; j < check.length; j++) {
                if(check[j] === true) {
                    if(currrow[j] !== row[j]) {
                        currisduplicate = false;
                    }
                }
            }
            if(currisduplicate) {
                duplicate = true;
                await this.updateRow(sheetname, subsheetname, this.newRow(currrow.slice(0,row.length),row,check), i);
            }
        }

        if(!duplicate) {
            await this.add(sheetname,subsheetname,row);
        }
    }

    async bulkAddWithoutDuplicates(sheetname, subsheetname, addrows, check) {
        let changes = new Map();
        let rows = await this.readSheet(sheetname, subsheetname);
        let newrows = [];

        for(const row of addrows) {
            let duplicate = false;
            for(let i = 1; i < rows.length+newrows.length; i++) {

                let currrow;

                if(i >= rows.length) currrow = newrows[i - rows.length];
                else currrow = rows[i];

                if(changes.has(i)) currrow = changes.get(i);
                let currisduplicate = true;
                for(let j = 0; j < check.length; j++) {
                    if(check[j] === true) {
                        if(currrow[j] !== row[j]) {
                            currisduplicate = false;
                        }
                    }
                }
                if(currisduplicate) {

                    duplicate = true;
                    if(i < rows.length) {
                        changes.set(i, this.newRow(currrow.slice(0,row.length), row, check));
                    } else {
                        newrows[i - rows.length] = this.newRow(currrow.slice(0,row.length), row, check);
                    }
                    
                }
            }
            if(!duplicate) {
                newrows.push(row);
            }
        }

        await this.bulkAdd(sheetname, subsheetname, newrows);
        for(const key of changes.keys()){
            await this.updateRow(sheetname, subsheetname, changes.get(key), key);
        }

    }

    async getSpreadsheetInfo(name) {
        name = this.handleSheetId(name);
        return await this.sheets.spreadsheets.get({ spreadsheetId: name });
    }

    async readSheet(sheetname,subsheetname,range) {
        let info = this.map.get(sheetname);
        let res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: info.id,
            range: range ? `${subsheetname}!${range}` : subsheetname
        })
        return res.data.values;
    }

    async createSubsheet(sheetname,subsheetname,format) {
        let requests = [];

        requests.push({
            addSheet: {
                properties: {
                    title: subsheetname,
                    tabColor: format.tabColor
                }
            }
        })

        await this.executeRequest(sheetname, requests);
        await this.SetUpSheet(sheetname);
        await this.formatSubsheet(sheetname,subsheetname,format);
    }

    async formatSubsheet(sheetname,subsheetname,format) {
        let requests = [];
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        
        if(format.columnResize) {
            for(let i = 0; i < format.columnResize.length; i++) {
                requests.push({
                    "updateDimensionProperties": {
                        "range": {
                            "sheetId": subsheetid,
                            "dimension": "COLUMNS",
                            "startIndex": i,
                            "endIndex": i + 1
                        },
                        "properties": {
                            "pixelSize": format.columnResize[i]
                        },
                        "fields": "pixelSize"
                    }
                })
            }
            
        }

        
        if(format.headers) {
            let headermap = format.headers.map((x) => {
            return {
                userEnteredValue: {
                    stringValue: x
                }
            }});

            requests.push({
                updateCells: {
                    "rows": [{
                        values: headermap
                    }],
                    fields: "*",
                    range: {
                        "sheetId": subsheetid,
                        "startRowIndex": 0,
                        "endRowIndex": 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": format.headers.length
                    },
                }
            })
            requests.push({
                repeatCell: {
                    range: {
                        sheetId: subsheetid,
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
            requests.push( {
                update_sheet_properties: {
                    properties: {
                        sheet_id: subsheetid,
                        grid_properties: {
                            frozen_row_count: 1
                        }
                    },
                    fields: 'gridProperties.frozenRowCount'
                }
            })
        }
        
        this.executeRequest(sheetname, requests);
        
    }

    async executeRequest(sheetname,requests) {
        if(requests.length === 0) return;
        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.map.get(sheetname).id,
            resource: { requests },
        });
    }
}

class TonyBot {

    /**
     * @constructor
     * @param {FirebaseFirestore.Firestore} db
     */
    constructor(db) {
        this.db = db;
        this.base = this.db.collection("PeepsBot");
        this.sectionTitles = ["Take Notes", "Applying the Concepts", "Summary"]
    }

    async onConstruct() {
        this.TRGref = await this.getUserCollection("KEY", "TRG");
    }

    async createUser(id) {
        if( (await this.base.doc(id).get()).exists ) return false;

        await this.base.doc(id).set({
            BioRank: 0,
            T: 0
        });

        await this.base.doc(id).collection("TRG").doc("0").set({
            sections: [false,false,false],
            sectionTimestamps: [this.now(),this.now(),this.now()]
        })
        await this.base.doc(id).collection("Inventory").doc("0").set({
            poggers: "epic"
        })
        return true;
    }

    dashToNum(str) {

        let unit = parseInt(str.split('-')[0]);
        let num = parseInt(str.split('-')[1]);

        if(isNaN(unit) || isNaN(num)) return {error: true, num: 2, message: "INVALID TRG NUMBER"};

        let tofind = {
            unit,
            num
        }
            
        for(let i = 0; i < this.TRGref.length; i++){
            if(this.TRGref[i].unit === tofind.unit && 
                this.TRGref[i].num === tofind.num){
                return i;
            }
        }

        return {error: true, num: 3, message: "TRG NOT FOUND"};
    }

    now() {
        return moment.tz("America/Los_Angeles").format();
    }

    async updateTRG(id, trgnum, sectionarr) {

        

        let trgdata = await this.getUserCollectionDoc(id,"TRG",trgnum);
        if(!trgdata.error) {
            let newSecArray = [];
            let newSecTimeArray = [];
            let changed = [];
            for(let i = 0; i < 3; i++) {
                if(!trgdata.sections[i] && sectionarr[i]) {
                    newSecArray.push(true);
                    newSecTimeArray.push(this.now());
                    changed.push(true);
                } else {
                    newSecArray.push(trgdata.sections[i])
                    newSecTimeArray.push(trgdata.sectionTimestamps[i]);
                    changed.push(false);
                }
            }
            await this.updateUserCollectionDoc(id, "TRG", trgnum, {
                sections: newSecArray,
                sectionTimestamps: newSecTimeArray
            })

            return changed;
        }

        return trgdata;
    }

    async TRGdata(id,num) {
        return this.getUserCollectionDoc(id, "TRG", num);
    }

    formatTime(t){
        return moment.tz(t, "America/Los_Angeles").format("MM/DD h:mm:ss a")
    }

    async getUser(id) {
        let ref = (await this.base.doc(id).get());
        return (ref.exists) ? ref.data() : {error: true, num: 0, message: "USER DOESN'T EXIST"};;
    }

    async getUserCollection(id, collection) {
        if (!(await this.base.doc(id).get()).exists) return {error: true, num: 0, message: "USER DOESN'T EXIST"};
        return (await this.base.doc("" + id).collection("" + collection).get()).docs.map((x) => x.data());
    }

    async getUserCollectionDoc(id, collection, id2) {
        if (!(await this.base.doc(id).get()).exists) return {error: true, num: 0, message: "USER DOESN'T EXIST"};
        let doc = (await this.base.doc("" + id).collection("" + collection).doc("" + id2).get());
        if(!doc.exists) return {error: true, num: 1, message: "DOC DOESN'T EXIST"};
        return doc.data();
    }

    async userExists(id) {
        return (await this.base.doc(id).get()).exists
    }

    async updateUser(id, info) {
        await this.base.doc("" + id).update(info);
    }

    async updateUserCollectionDoc(id,collection,id2, info) {
        await this.base.doc("" + id).collection("" + collection).doc("" + id2).update(info);
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {string[]} args 
     */
    async onComplete(message, args) {

        if(args.length >= 3 && args[0].toLowerCase() === "trg" && (["sec", "section", "all"].indexOf( args[2].toLowerCase() ) !== -1)) {

            let tochange = [false,false,false];
            if(args[2].toLowerCase() === 'all') {
                tochange = [true,true,true];
            } else {
                tochange[args[3]-1] = true;
            }

            let trgnum = this.dashToNum(args[1]);

            if(trgnum.error && trgnum.num === 2) {
                message.channel.send("Invalid TRG number. Try 3-1.");
                return false;
            }

            if(trgnum.error && trgnum.num === 3) {
                message.channel.send("TRG doesn't exist.");
                return false;
            }

            let changed = await this.updateTRG(message.author.id, trgnum, tochange);

            if(changed.error && changed.num === 0) {
                if(!await this.forceCreate(message)) return false;
                changed = await this.updateTRG(message.author.id, trgnum, tochange);
            }

            if(changed.error && changed.num === 1) {
                await this.createTRGforUser(message.author.id, trgnum);
                changed = await this.updateTRG(message.author.id, trgnum, tochange);
            }

            let changedfields = [];
            for(let i = 0; i < changed.length; i++) {
                if(changed[i]) changedfields.push({
                    name: `Section ${i+1}: ${this.sectionTitles[i]}`,
                    value: "Just completed at " + this.formatTime(this.now())
                })
            }

            message.channel.send({
                "embed": {
                    "title": `Action: Complete TRG ${args[1]}`,
                    "description": "The following changes were made:",
                    ...this.embedInfo(message),
                    "fields": changedfields,
                }
            })

        } else {
            message.channel.send(`Format: --complete TRG 3-1 SEC 1`);
        }
    }

    /**
     * 
     * @param {Discord.Message} message 
    */
    async forceCreate(message) {
        let m = await message.channel.send({
            "embed": {
                "title": "Create a Profile",
                "description": `You haven't created a profile yet.\nBy creating a profile, you get access to PeepsBot's other features. React with :thumbsup: to continue.`,
                ...this.embedInfo(message),
            }
        })

        await m.react("👍");
        await m.react("❌");

        const filter = (reaction, user) => {
            return ['👍', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };

        let collected;
        try {
            collected = await m.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
        } catch {
            return false;
        }
        const reaction = collected.first();

        if (reaction.emoji.name === '👍') {
            await this.createUser(message.author.id);
            m.delete();
            await message.channel.send({
                "embed": {
                    "title": "Welcome!",
                    "description": `Welcome to the underground TRG society. Trade in your TRGs for in game currency. For help, do --help`,
                    ...this.embedInfo(message),
                    
                }
            })
            return true;
        } else{
            m.delete();
            return false;
        }
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {string[]} args 
     */
    async onGet(message, args) {
        if(args[0].toLowerCase() === "trg"){

            let trgnum = this.dashToNum(args[1]);

            if(trgnum.error && trgnum.num === 2) {
                message.channel.send("Invalid TRG number. Try 3-1.");
                return false;
            }

            if(trgnum.error && trgnum.num === 3) {
                message.channel.send("TRG doesn't exist.");
                return false;
            }

            let embed = await message.channel.send({
                 "embed": {
                    "title": "TRG Status",
                    "description": `Loading...`,
                    "color": 1111111
                 }
            });

            embed.react("⬅️");
            embed.react("❌");
            embed.react("➡️");
            
            this.displayGet(embed, trgnum, message);

        }
    }

    embedInfo(message) {
        return {
            "color": 1111111,
            "timestamp": this.now(),
            "author": {
                "name": "Mr. Little",
                "url": "https://pausd.schoology.com/user/52984930/info",
                "icon_url": "https://cdn.discordapp.com/embed/avatars/2.png"
            },
            "footer": {
                "text": `Requested by ${message.author.username}`,
                "icon_url": message.author.displayAvatarURL()
            }
        }
    }

    /**
     * 
     * @param {Discord.message} message 
     * @param {*} id 
     * @param {*} trgnum 
     */
    async createTRGforUser(id,trgnum) {
        await this.base.doc("" + id).collection("TRG").doc("" + trgnum).set({
            sections: [false,false,false],
            sectionTimestamps: [this.now(),this.now(),this.now()]
        })
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {*} trgnum 
     * @param {Discord.Message} origmessage 
     */
    async displayGet(message, trgnum, origmessage, num)  {
        let data = (await this.TRGdata(origmessage.author.id, trgnum));
        
        if(data.error && data.num === 0) {
            if(!await this.forceCreate(origmessage)) return false;
            data = (await this.TRGdata(origmessage.author.id, trgnum));
        }

        let dataunit = this.TRGref["" + trgnum];

        let changed = false;
        if(data.error && data.num === 1 && dataunit) {
            await this.createTRGforUser(origmessage.author.id, trgnum);
            data = (await this.TRGdata(origmessage.author.id, trgnum));
        }
        if(data.error && data.num === 1 && typeof num !== "number") {
            message.edit({
                "embed": {
                    "title": "TRG Status",
                    "description": `The TRG does not currently exist.`,
                    "color": 1111111,
                    "timestamp": this.now(),
                    ...this.embedInfo(origmessage)
                }
            })
            return false;
        } else if(data.error && data.num === 1) {
            trgnum = num;
            data = (await this.TRGdata(origmessage.author.id, trgnum));
            changed = true;
        }

        let dashnotation = this.TRGref["" + trgnum].unit + "-" + this.TRGref["" + trgnum].num
        
        let fields = [];

        if(changed){
            fields.push({
                name: "Error",
                value: "There are no more TRGs in that direction."
            })
        }

        for(let i = 0; i < data.sections.length; i++) {
            
            fields.push({
                name: `Section ${i+1}: ${this.sectionTitles[i]}`,
                value: data.sections[i] ? "Complete at " + this.formatTime(data.sectionTimestamps[i]) : "Incomplete"
            })
        }
        
        await message.edit({
            "embed": {
                "title": `TRG ${dashnotation} Status`,
                "description": `Your TRG ${dashnotation} status, as listed in the database.`,
                ...this.embedInfo(origmessage),
                "fields": fields,
                
            }
        })

        const filter = (reaction, user) => {
            return ['⬅️','➡️','❌'].includes(reaction.emoji.name) && user.id === origmessage.author.id;
        };

        let collected;
        try {
            collected = await message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
        } catch(err) {
            await message.reactions.removeAll();
            return false;
        }
        const reaction = collected.first();

        await reaction.users.remove(origmessage.author.id);
        if(reaction.emoji.name === "❌"){
            message.delete();
        } else if(reaction.emoji.name === "⬅️") {
            this.displayGet(message,trgnum-1,origmessage, trgnum);
        } else if(reaction.emoji.name === "➡️") {
            this.displayGet(message,trgnum+1,origmessage, trgnum);
        }
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {string[]} args 
     */
    async onCreate(message,args) {
        if( !(await this.userExists(message.author.id)) ) {
            await this.forceCreate(message);
        } else {
            message.channel.send("You've already created an account.");
        }
    }

}

class ProcessorBot {

    /**
     * @constructor
     * @param {google.auth.OAuth2} auth 
     * @param {FirebaseFirestore.Firestore} db
     */
    constructor(auth,db) {

        this.destroy = [];
        this.prefix = "--"

        this.daysmap = new Map();

        let currmap = new Map();
        currmap.set("quotes", "1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM");
        currmap.set("music", "17YiJDj9-IRnP_sPg3HJYocdaDkkFgMKfNC6IBDLSLqU");
        this.sheetsUser = new SheetsUser(auth, currmap);

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

        this.collectingChannels = ["754912483390652426", "756698378116530266"]
        this.updateChannels = [];

        this.musicBots = ["234395307759108106"]

        this.approvedMusicServers = ["748669830244073533"]

        this.approvedTonyServers = ["748669830244073533"]

        this.tonyBot = new TonyBot(db);

        this.reference = {};

    }

    /**
     * 
     * @param {Discord.Client} client 
     */
    async onConstruct(client){

        await this.tonyBot.onConstruct();
        await this.sheetsUser.SetUpSheets();

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
        
    }

    RGBtoObj(r, g, b) {
        return {
            red: r / 255,
            green: g / 255,
            blue: b / 255
        }
    }

    getDay() {
        return moment.tz("America/Los_Angeles").day();
    }

    getTodayStr(){
        return moment.tz("America/Los_Angeles").format("ddd MM/DD/YYYY");
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

    stripQuotes(txt) {
        if(txt.startsWith('"')) {
            txt = txt.slice(1,txt.length - 1)
        }
        return txt;
    }

    async readLittleQuotes() {

        let rows = (await this.sheetsUser.readSheet("quotes", "Quotes")).slice(1);
        for (const row of rows) {
            row[0] = this.stripQuotes(row[0])
        }
        return rows;
    
    }

    async addLittleQuote(quote,stars) {
        quote = this.stripQuotes(quote);
        this.sheetsUser.addWithoutDuplicates("quotes", "Quotes", [quote,stars], [true, "CHANGE"])
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

    similarities(txt1, txt2) {

        txt1 = txt1.replace(/[\.?!',"]/g, "");
        txt2 = txt2.replace(/[\.?!',"]/g, "");

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

        let max = -1;
        let maxmsg = "";
        for (let i = 0; i < quotes.length; i++) {
            const row = quotes[i];
            if (this.similarities(row[0],messagecontent) > max) {
                max = this.similarities(row[0],messagecontent);
                maxmsg = row[0];
            }
            
        }
        max > 0 ? console.log(`My brilliant wisdom was summoned, and I responded with ${maxmsg}.`) : "";
        return max > 0 ? maxmsg : "Sorry, I'm not sure what to think about that.";
    }
    
    now() {
        return moment.tz("America/Los_Angeles").format();
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async help(message) {
        let m = await message.channel.send(this.helpEmbed(message,0))

        if(this.approvedTonyServers.indexOf( message.guild.id ) === -1) {
            await m.react("❌");

            const filter = (reaction, user) => {
                return ['❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };

            try {
                await m.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] });
            } catch(err) {}

            m.delete();

            return true;
            
        }

        await m.react("❌")
        await m.react("➡")
        this.helpMenu(m, 0, message)
        
    }

    /**
     * 
     * @param {Discord.message} message 
     * @param {*} num 
     */
    helpEmbed(message,num) {
        if(num === 0){
            return {
                "embed": {
                    "title": "Help",
                    "description": "I'm a bot that spews out random tidbits of Mr.Little's wisdom.",
                    "color": 1111111,
                    "timestamp": this.now(),
                    "author": {
                    "name": "Mr. Little",
                    "url": "https://pausd.schoology.com/user/52984930/info",
                    "icon_url": "https://cdn.discordapp.com/embed/avatars/2.png"
                    },
                    "fields": [
                        {
                            "name": this.prefix+"little",
                            "value": "A completely random Mr.Little quote."
                        },
                        {
                            "name": this.prefix+"littler [sentence]",
                            "value": "A less random Mr.Little quote that has the most words in common with your sentence."
                        },
                        {
                            "name": this.prefix+"spreadsheets",
                            "value": "Gives the spreadsheet where all the Mr.Little quotes live."
                        }
                    ],
                    "footer": {
                        "text": `Requested by ${message.author.username}`,
                        "icon_url": message.author.displayAvatarURL()
                    }
                    
                }
            }
        } else if(num === 1) {
            return {
                "embed": {
                    "title": "Help",
                    "description": "I'm also a bot that keeps track of your TRGs and converts them to currency.",
                    "color": 1111111,
                    "timestamp": this.now(),
                    "author": {
                    "name": "Mr. Little",
                    "url": "https://pausd.schoology.com/user/52984930/info",
                    "icon_url": "https://cdn.discordapp.com/embed/avatars/2.png"
                    },
                    "fields": [
                        {
                            "name": this.prefix+"create",
                            "value": "Create a profile."
                        },
                        {
                            "name": this.prefix+"get TRG #-#",
                            "value": "Returns the status on your TRG, as stored in the database."
                        },
                        {
                            "name": this.prefix+"complete TRG #-# ['SEC 1' or 'ALL']",
                            "value": "Completes the given TRG."
                        }
                    ],
                    "footer": {
                        "text": `Requested by ${message.author.username}`,
                        "icon_url": message.author.displayAvatarURL()
                    }
                    
                }
            }
        }
    }

    /**
     * 
     * @param {Discord.Message} helpmessage 
     * @param {Discord.Message} origmessage
     */
    async helpMenu(helpmessage,state,origmessage){
        
        const filter = (reaction, user) => {
            return ['➡','❌'].includes(reaction.emoji.name) && user.id === origmessage.author.id;
        };

        let collected;
        try {
            collected = await helpmessage.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] });
        } catch(err) {
            helpmessage.delete();
            return true;
        }
        
        const reaction = collected.first();
        if(reaction.emoji.name === '❌') {
            helpmessage.delete();
        } else {
            await reaction.users.remove(origmessage.author.id);
            if(state === 1){
                await helpmessage.edit(this.helpEmbed(origmessage,0));
                this.helpMenu(helpmessage, 0, origmessage);
            } else {
                await helpmessage.edit(this.helpEmbed(origmessage,1));
                this.helpMenu(helpmessage,1,origmessage)
            }
        }
    }

    /**
     * 
     * @param {Discord.Message} message
     */
    async onMessage(message) {

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
                ],
                "footer": {
                    "text": `Requested by ${message.author.username}`,
                    "icon_url": message.author.displayAvatarURL()
                }
            }));
        }

        if(command === "groovy" && this.approvedMusicServers.indexOf(message.guild.id) !== -1) {
            message.channel.send(new Discord.MessageEmbed({
                "title": "– Groovy Spreadsheet –",
                "description": "F Period Bio Gang Groovy",
                "color": "#00ffff",
                "fields": [
                    {
                        "name": "Our Groovy History",
                        "value": "All of the Groovy songs played can be found here: [Link](https://docs.google.com/spreadsheets/d/17YiJDj9-IRnP_sPg3HJYocdaDkkFgMKfNC6IBDLSLqU/edit#gid=0)"
                    }
                ],
                "footer": {
                    "text": `Requested by ${message.author.username}`,
                    "icon_url": message.author.displayAvatarURL()
                }
            }));
        }
        
        if(command === "complete") {
            this.tonyBot.onComplete(message,args);
        }

        if(command === "get"){
            this.tonyBot.onGet(message,args);
        }

        if(command === "create") {
            this.tonyBot.onCreate(message,args);
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
            this.help(message);
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

    let processorbot = new ProcessorBot(sheets,db);

    client.on("message", async function (message) {
        await processorbot.onMessage(message)
    });

    client.on("messageReactionAdd", async function(reaction, user){
        await processorbot.onReaction(reaction, user)
    })

    client.on("messageReactionRemove", async function(reaction,user){
        await processorbot.onReaction(reaction,user)
    })

    await client.login(config);
    await processorbot.onConstruct(client);

    console.log("Up now!")

})();

