
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

const crypto = require('crypto')
const OAuth = require("oauth-1.0a")
const fetch = require('node-fetch')
class SchoologyAccessor {
    constructor(){
        this.base = 'https://api.schoology.com/v1'
        this.token = { key: process.env.schoology_key, secret: process.env.schoology_secret }
    }

    async get(path){
        const url = this.base + path;
        const method = "GET";

        function hash_function_sha1(base_string, key) {
            return crypto
                .createHmac('sha1', key)
                .update(base_string)
                .digest('base64')
        }

        const oauth = OAuth({
            consumer: this.token,
            signature_method: 'HMAC-SHA1',
            hash_function: hash_function_sha1,
        })

        return await fetch(url,
        {
            method,
            headers: oauth.toHeader(oauth.authorize({url, method})),
        });
    }

    async methodswithdata(path,data,method) {
        const url = this.base + path;

        function hash_function_sha1(base_string, key) {
            return crypto
                .createHmac('sha1', key)
                .update(base_string)
                .digest('base64')
        }

        const oauth = OAuth({
            consumer: this.token,
            signature_method: 'HMAC-SHA1',
            hash_function: hash_function_sha1,
        })

        return await fetch(url,
        {
            method,
            body: JSON.stringify(data),
            headers: {
                'Content-Type': "application/json",
                ...oauth.toHeader(oauth.authorize({url, method}))
            },
        });
    }

    async post(path,data) {
        return await this.methodswithdata(path,data,"POST");
    }

    async put(path,data){
        return await this.methodswithdata(path,data,"PUT");
    }

    async delete(path,data){
        return await this.methodswithdata(path,data,"DELETE");
    }
}

class BioParser extends SchoologyAccessor {
    constructor() {
        super();
    }

    async getTRGs() {
        let stuff = await this.get("/sections/2772305484/assignments?limit=1000")
        let data = await stuff.json();

        let TRGMap = new Map();
        for(let i = 0; i < data.assignment.length; i++){
            
            let title = data.assignment[i].title;
            if(title.indexOf("TRG") !== -1 && title.indexOf("-") !== -1){
                let dashindex = title.indexOf("-");
                let cut = title.slice(dashindex-1,dashindex+2).split("-");
                let unit = parseInt(cut[0]);
                let num = parseInt(cut[1]);
                let pair = JSON.stringify( [unit,num] );

                let {due,allow_dropbox,description} = data.assignment[i];

                title = title.slice(dashindex+2);

                if(!TRGMap.has(pair)) {
                    TRGMap.set(pair, {
                        title,
                        description
                    })
                } else {
                    if(TRGMap.get(pair).description.length < description.length){
                        TRGMap.set(pair, {
                            ...TRGMap.get(pair),
                            description
                        })
                    }
                }

                if(allow_dropbox === "1") {
                    TRGMap.set(pair, {
                        ...TRGMap.get(pair),
                        due
                    })
                }
            }

        }

        return TRGMap;

    }
}

class TonyBotDB {
    /**
     * @constructor
     * @param {FirebaseFirestore.Firestore} db
     */
    constructor(db) {
        this.db = db;
        this.base = this.db.collection("PeepsBot");
        this.key = this.base.doc("KEY");
        this.sectionTitles = ["Take Notes", "Applying the Concepts", "Summary"]
        this.units = new Map();
    }

    async onConstruct() {
        await this.refreshUnits();
    }

    /* ACCESSORS */

    async refreshUnits() {
        let units = (await this.key.collection("UNITS").get());
        
        let tofind = units.docs.map(doc => doc.id);

        for(const key of tofind) {
            if(!this.units.has(key)) {
                this.units.set(key, {});
            }
        }

        let alltrgs = [];
        for(const key of tofind) {
            alltrgs.push(this.key.collection("UNITS").doc(key).collection("TRGS").get());
        }
        
        alltrgs = await Promise.all(alltrgs);

        for(let i = 0; i < alltrgs.length; i++) {
            let currTRGMap = new Map();

            for(let j = 0; j < alltrgs[i].docs.length; j++){
                currTRGMap.set(alltrgs[i].docs[j].id,alltrgs[i].docs[j].data());
            }

            this.units.get(tofind[i]).TRGS = currTRGMap;
        }

    }

    async refreshUnit(unit) {

        if(!this.units.has(unit+"")) {
            this.units.set(unit+"", {});
        }

        let alltrgs = (await this.key.collection("UNITS").doc(unit+"").collection("TRGS").get());
        let currTRGMap = new Map();
        for(let i = 0; i < alltrgs.docs.length; i++) {
            currTRGMap.set(alltrgs.docs[i].id, alltrgs.docs[i].data());
        }

        this.units.get(unit+"").TRGS = currTRGMap;

    }

    now() {
        return moment.tz("America/Los_Angeles").format();
    }

    formatTime(t){
        return moment.tz(t, "America/Los_Angeles").format("MM/DD h:mm:ss a")
    }

    /* EXISTENCE */

    unitExists(unit) {
        if(this.units.get(unit+"")){
            return true;
        }
        return false;
    }

    TRGExists(unit, num) {
        return this.unitExists(unit) && this.units.get(unit+"").TRGS.has(num + "");
    }

    async userExists(id) {
        return (await this.base.doc(id + "").get()).exists;
    }

    async unitExistsForUser(id,unit){
        return (await this.base.doc("" + id).collection("UNITS").doc(unit + "").get()).exists;
    }

    async TRGExistsForUser(id,unit,num) {
        return (await this.base.doc("" + id).collection("UNITS").doc(unit + "")
            .collection("TRGS").doc(num+"").get()).exists;
    }

    /* GETTING */

    async getUser(id) {
        return (await this.base.doc(id + "").get()).data();
    }

    async getUserUnit(id, unit) {
        return (await this.base.doc("" + id).collection("UNITS").doc(unit + "").get()).data();
    }

    async getUserTRG(id,unit,num) {
        return (await this.base.doc("" + id).collection("UNITS").doc(unit + "")
            .collection("TRGS").doc(num+"").get()).data();
    }

    /* MODIFIERS */

    /* LOW LEVEL */

    /* FOR USER */

    async createUser(id) {
        await this.base.doc("" + id).set({
            LC: 0,
            RANK: 0
        })
    }

    async createUnitForUser(id, unit) {

        await this.base.doc("" + id).collection("UNITS").doc(unit + "").set({
            COMPLETE: false
        })

    }

    async createTRGForUser(id, unit, trgnum) {
        await this.base.doc("" + id).collection("UNITS").doc(unit + "").collection("TRGS").doc(trgnum + "").set({
            SECTIONS: [false,false,false],
            SECTIONTIMESTAMPS: [this.now(),this.now(),this.now()],
            COMPLETE: false
        })
    }

    async updateTRGForUser(id, unit, trgnum, data) {
        await this.base.doc("" + id).collection("UNITS").doc(unit + "").collection("TRGS").doc(trgnum + "").update(data);
    }

    /* FOR GLOBAL */

    async createUnit(unit) {
        await this.key.collection("UNITS").doc(""+unit).set({});
        await this.refreshUnit(unit);
    }

    async createTRG(unit, trgnum) {
        await this.key.collection("UNITS").doc(""+unit).collection("TRGS").doc(""+trgnum).set({

        })
        await this.refreshUnit(unit);
    }

    async setTRGinfo(unit, trgnum, data){
        await this.key.collection("UNITS").doc(""+unit).collection("TRGS").doc(""+trgnum).set(data);
    }

    /* TOP LEVEL */

    async updateTRG(id, unit, trgnum, completedArr) {
        const pTRG = await this.getUserTRG(id,unit,trgnum);
        let pSections = pTRG.SECTIONS;
        let pSectionTimestamps = pTRG.SECTIONTIMESTAMPS;
        
        let CHANGEDARRAY = [];
        let CHANGED = false;
        for(let i = 0; i < pSections.length; i++) {
            if(!pSections[i] && completedArr[i]) {
                CHANGEDARRAY.push(true);
                pSectionTimestamps[i] = (this.now());
                pSections[i] = true;
                CHANGED = true;
            } else {
                CHANGEDARRAY.push(false);
            }
        }

        let completed = pSections.reduce( (a,n) => a && n);

        if(CHANGED) {
            this.updateTRGForUser(id,unit,trgnum, {
                SECTIONS: pSections,
                SECTIONTIMESTAMPS: pSectionTimestamps,
                COMPLETE: completed
            })
        }

        return {
            CHANGED,
            CHANGEDARRAY
        }
    }

}

class TonyBot extends TonyBotDB {
    /**
     * @constructor
     * @param {FirebaseFirestore.Firestore} db
     */
    constructor(db) {
        super(db);
        this.sectionTitles = ["Take Notes", "Applying the Concepts", "Summary"]
        this.BP = new BioParser();
    }
    
    async onConstruct() {
        await super.onConstruct();
        return await this.refresh();
    }

    async refresh(){

        let updateembeds = [];

        let trgs = await this.BP.getTRGs();
        for(const key of trgs.keys()) {
            let [unit, num] = JSON.parse(key);
            if(!this.unitExists(unit)) {
                await this.createUnit(unit);
                updateembeds.push({
                    title: `ALERT: Unit ${unit}`,
                    description: `**Unit ${unit} was posted.** Here's to another month of death!`,
                    ...this.basicEmbedInfo()
                })
            }
            if(!this.TRGExists(unit, num)) {
                updateembeds.push({
                    title: `ALERT: TRG ${unit}-${num}`,
                    description: `TRG ${unit}-${num} was just posted. Yes, there's another one.`,
                    fields: [
                        {
                            name: "Due",
                            value: this.formatTime(trgs.get(key).due)
                        },
                        {
                            name: "Description",
                            value: trgs.get(key).description
                        }
                    ],
                    ...this.basicEmbedInfo()
                })
                await this.setTRGinfo(unit,num,trgs.get(key));
            }
        }

        await super.refreshUnits();

        return updateembeds;
    }

    /* ACCESSORS */

    /* LOW LEVEL */

    basicEmbedInfo() {
        return {
            "color": 1111111,
            "timestamp": this.now(),
            "author": {
                "name": "Mr. Little",
                "url": "https://pausd.schoology.com/user/52984930/info",
                "icon_url": "https://cdn.discordapp.com/embed/avatars/2.png"
            },
        }
    }

    embedInfo(message) {
        return {
            ...this.basicEmbedInfo(),
            "footer": {
                "text": `Requested by ${message.author.username}`,
                "icon_url": message.author.displayAvatarURL()
            }
        }
    }

    /**
     * 
     * @param {string} str
     * @returns {number[] | boolean} 
     */
    dashNotationToNums(str) {
        let splits = str.split("-");
        if(splits.length !== 2) return false;

        let unit = parseInt( splits[0] );
        if(isNaN(unit)) return false;

        let num = parseInt( splits[1] );
        if(isNaN(num)) return false;

        return [unit, num];
    }

    /* MODIFIERS */

    /* LOW LEVEL */
    /**
     * @param {Discord.Message} origmessage
     */
    async sendClosableEmbed(origmessage, embed) {
        let message = await origmessage.channel.send({embed});
        await message.react("❌");

        const filter = (reaction, user) => {
            return ['❌'].includes(reaction.emoji.name) && user.id === origmessage.author.id;
        };

        let collected;
        try {
            collected = await message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
        } catch(err) {
            await message.reactions.removeAll();
            return false;
        }
        const reaction = collected.first();

        try {
            await reaction.users.remove(origmessage.author.id);
        } catch { }
        finally {
            await message.delete();
        }
    }

    /* ON BLANK */

    /**
     * 
     * @param {Discord.Message} message 
    */
    async createUser(message) {
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
            await super.createUser(message.author.id);
            m.delete();
            this.sendClosableEmbed(message, {
                "title": "Welcome!",
                "description": `Welcome to the underground TRG society. Trade in your TRGs for in game currency. For help, do --help`,
                ...this.embedInfo(message),
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
    async onComplete(message, args) {
        if(args[0].toLowerCase() === "trg"){
            // If user doesn't exist, make them exist or resolve
            if(!(await this.userExists(message.author.id))){ 
                if(!(await this.createUser(message))) {
                    return false;
                }
            }

            // Get TRG numbers, check for errors
            let nums = this.dashNotationToNums(args[1]);
            if(nums === false) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Your TRG number, TRG ${args[1]}, was invalid. Try **TRG #-#** instead, e.g. TRG 3-1.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            let [unit, num] = nums;

            // Check if the TRG exists
            if(!this.TRGExists(unit, num)) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `TRG ${args[1]} does not exist.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            if(!(await this.unitExistsForUser(message.author.id, unit))) {
                await this.createUnitForUser(message.author.id, unit);
            }
            
            // If the TRG exists, but the user doesn't have an entry, add it
            if(!(await this.TRGExistsForUser(message.author.id, unit, num))){
                await this.createTRGForUser(message.author.id, unit, num)
            }

            // Parse the last two parameters, either SEC # or ALL
            let tochange = [false,false,false];
            if(args[2].toLowerCase() === "sec") {
                let secnum = parseInt(args[3]);
                if(isNaN(secnum) || !(secnum <= 3 && secnum >= 1)) {
                    this.sendClosableEmbed(message,{
                        title: `Invalid`,
                        description: `You sent SEC ${args[3]}, but ${args[3]} is not a valid section. Try 1,2, or 3.`,
                        ...this.embedInfo(message)
                    })
                    return false;
                }

                tochange[secnum - 1] = true;
            } else if(args[2].toLowerCase() === "all") {
                tochange = [true,true,true];
            } else {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `You sent ${args[2]}, but only **SEC #** or **ALL** are accepted.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // Complete!
            let data = await this.updateTRG(message.author.id, unit, num, tochange);

            if(!data.CHANGED) {
                this.sendClosableEmbed(message, {
                    title: `Complete TRG ${unit}-${num}`,
                    description: `You've already completed that.`,
                    ...this.embedInfo(message)
                })
                return false;
            }
            
            // Parse the data into a Discord embed
            let fields = [];
            for(let i = 0; i < data.CHANGEDARRAY.length; i++) {
                if(data.CHANGEDARRAY[i]){
                    fields.push({
                        name: `Section ${i+1}: ${this.sectionTitles[i]}`,
                        value: "Just completed at " + this.formatTime(this.now())
                    })
                }
            }

            // Send it!
            this.sendClosableEmbed(message, {
                fields,
                title: `Complete TRG ${unit}-${num}`,
                description: `Completing TRG ${unit}-${num}.`,
                ...this.embedInfo(message)
            })
        }
   }

    /**
     * 
     * @param {Discord.Message} message
     * @param {string[]} args 
    */
    async onGet(message, args) {
        if(args[0].toLowerCase() === "trg"){

            // If user doesn't exist, make them exist or resolve
            if(!(await this.userExists(message.author.id))){ 
                if(!(await this.createUser(message))) {
                    return false;
                }
            }

            // Get TRG numbers, check for errors
            let nums = this.dashNotationToNums(args[1]);
            if(nums === false) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Your TRG number, TRG ${args[1]}, was invalid. Try TRG #-# instead, e.g. TRG 3-1.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            let [unit, num] = nums;

            // Check if the TRG exists
            if(!this.TRGExists(unit, num)) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `TRG ${args[1]} does not exist.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            if(!(await this.unitExistsForUser(message.author.id, unit))) {
                await this.createUnitForUser(message.author.id, unit);
            }

            // If the TRG exists, but the user doesn't have an entry, add it
            if(!(await this.TRGExistsForUser(message.author.id, unit, num))){
                await this.createTRGForUser(message.author.id, unit, num)
            }

            // Get data
            let data = await this.getUserTRG(message.author.id, unit, num);
            
            // Parse the data into a Discord embed
            let fields = [];
            for(let i = 0; i < data.SECTIONS.length; i++) {
                fields.push({
                    name: `Section ${i+1}: ${this.sectionTitles[i]}`,
                    value: data.SECTIONS[i] ? "Complete at " + this.formatTime(data.SECTIONTIMESTAMPS[i]) : "Incomplete"
                })
            }

            // Send it!
            this.sendClosableEmbed(message, {
                fields,
                title: `TRG ${unit}-${num} Status`,
                description: `Your TRG ${unit}-${num} status, as listed in the database.`,
                ...this.embedInfo(message)
            })
        } else if(args[0].toLowerCase() === "all") {
            if(args[1].toLowerCase() === "trgs") {
                let alltrgs = [];
                for(const unit of this.units.keys()){
                    for(const num of this.units.get(unit).TRGS.keys()){
                        alltrgs.push(`TRG ${unit}-${num}`);
                    }
                }
                this.sendClosableEmbed(message, {
                    title: "All TRGs",
                    description: alltrgs.join("\n"),
                    ...this.embedInfo(message)
                })
            } else if(args[1].toLowerCase() === "units") {
                let allunits = [];
                for(const unit of this.units.keys()){
                    allunits.push(`Unit ${unit}`);
                }
                this.sendClosableEmbed(message, {
                    title: "All Units",
                    description: allunits.join("\n"),
                    ...this.embedInfo(message)
                })
            }
        }
    }

    /**
     * 
     * @param {Discord.Message} message
     * @param {string[]} args 
    */
    async onCreate(message,args){
        if(args[0].toLowerCase() === "trg") {

            // They must be admin
            if(!message.member.hasPermission("ADMINISTRATOR")){
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Only admins can create global TRGs. Ask them to create it for you.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // If user doesn't exist, make them exist or resolve
            if(!(await this.userExists(message.author.id))){ 
                if(!(await this.createUser(message))) {
                    return false;
                }
            }

            // Get TRG numbers, check for errors
            let nums = this.dashNotationToNums(args[1]);
            if(nums === false) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Your TRG number, TRG ${args[1]}, was invalid. Try TRG #-# instead, e.g. TRG 3-1.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            let [unit, num] = nums;

            // Check if the unit exists
            if(!this.unitExists(unit)) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Unit ${unit} does not exist. To avoid errors, please explicitly create that unit using create unit ${unit}.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // Check if the TRG exists
            if(this.TRGExists(unit, num)) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `TRG ${args[1]} already exists.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // Create the TRG
            await this.createTRG(unit, num)

            // Send the success message
            this.sendClosableEmbed(message, {
                title: `Create TRG ${args[1]}`,
                description: `TRG ${args[1]} has been successfully created.`,
                ...this.embedInfo(message)
            })

        } else if(args[0].toLowerCase() === "unit"){
            // They must be admin
            if(!message.member.hasPermission("ADMINISTRATOR")){
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Only admins can create global units. Ask them to create it for you.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // If user doesn't exist, make them exist or resolve
            if(!(await this.userExists(message.author.id))){ 
                if(!(await this.createUser(message))) {
                    return false;
                }
            }

            let unit = parseInt(args[1]);
            if(isNaN(unit)){
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `${args[1]} is not a valid unit. Try unit # instead, like unit 3.`,
                    ...this.embedInfo(message)
                })
            }

            // Check if the unit exists
            if(this.unitExists(unit)) {
                this.sendClosableEmbed(message,{
                    title: `Invalid`,
                    description: `Unit ${unit} already exists.`,
                    ...this.embedInfo(message)
                })
                return false;
            }

            // Create Unit
            await this.createUnit(unit);
            this.sendClosableEmbed(message,{
                title: `Created Unit ${unit}`,
                description: `Unit ${unit} was created.`,
                ...this.embedInfo(message)
            })

        } else {
            this.createUser(message);
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
        this.updateChannels = ["748669830244073536"];

        this.musicBots = ["234395307759108106"]

        this.approvedMusicServers = ["748669830244073533"]

        this.approvedTonyServers = ["748669830244073533"]

        this.tonyBot = new TonyBot(db);

        this.reference = {};

        this.interval = 150000;
    }

    /**
     * 
     * @param {Discord.Client} client 
     */
    async onConstruct(client){

        this.client = client;

        let embeds = await this.tonyBot.onConstruct();
        await this.sheetsUser.SetUpSheets();

        for (const id of this.collectingChannels) {

            let channel = await client.channels.fetch(id)
            channel.messages.fetch({
                limit: 90
            })

        }

        for (const id of this.updateChannels) {
            let channel = await client.channels.fetch(id)
            for(const embed of embeds) {
                await channel.send({embed});
            }
        }
        
        let currinterval = setInterval(() => {
            this.refresh();
        }, this.interval);
    }

    async refresh() {
        console.log("Refreshing...")
        let embeds = await this.tonyBot.refresh();
        for (const id of this.updateChannels) {
            let channel = await this.client.channels.fetch(id);
            for(const embed of embeds) {
                await channel.send({embed});
            }
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

