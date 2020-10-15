
const Discord = require("discord.js");

require("dotenv").config();

const config = process.env.BOT_TOKEN

var admin = require('firebase-admin');
// console.log(serviceAccount.private_key)
serviceAccount = process.env;
// console.log(serviceAccount.private_key)

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://games-ff9af.firebaseio.com'
});

var db = admin.database();

const client = new Discord.Client();

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { request } = require("http");

let moment = require("moment-timezone");
const { max } = require("moment-timezone");
// const { title } = require("process");

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

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
    callback(oAuth2Client);
    // });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions

            console.log("NEW TOKEN!!: ")
            console.log(JSON.stringify(token))
            
            callback(oAuth2Client);
        });
    });
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const UPPERALPHABET = ALPHABET.toUpperCase();
const ALPHABETEMOJIS = "🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇱 🇲 🇳 🇴 🇵 🇶 🇷 🇸 🇹 🇺 🇻 🇼 🇽 🇾 🇿".split(" ")

/**
 * A TTT game class
 * @class
*/
class TTT {

    /**
     * @constructor
     * @param {Object} dbref - Database Reference to the Tic Tac Toe board
     */
    constructor(dbref) {
        
        this.ref = dbref;

        this.board = [[]];
        this.status = 0;
        this.get();

        this.turn = 1;

        this.XEMOJI = "<:obamaprism:748993582043627622>";
        this.OEMOJI = "<:obamasphere:750493919661260800>";
        this.NONEEMOJI = "⬛";
        this.NL = "\n"
        this.DIVIDER = "|"
        this.BLANK = "\\_"

        this.X = "Obama Prism";
        this.O = "Obama Sphere";

    }

    /**
     * @async 
     * @returns {number[][]} - Retrieves 
     */
    async get() {
        this.board = (await this.ref.once("value")).val();
        return this.board;
    }

    /**
     * 
     */
    set() {
        this.ref.set(this.board);
    }

    /**
     * Checks the status of the board
     * @returns {number} - 0 for neutral, 1 if 1 won, 2 if 2 won, 3 if cat's tie
     */
    check() {
        
        this.status = 0;
        
        /* Checks rows */
        for(let i = 0; i < this.board.length; i++){
            if(this.board[i][0] === this.board[i][1] && this.board[i][0] === this.board[i][2] && this.board[i][0] !== 0){
                this.status = this.board[i][0];
            }
        }

        /* Checks columns */
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[0][i] === this.board[1][i] && this.board[0][i] === this.board[2][i] && this.board[0][i] !== 0) {
                this.status = this.board[0][i];
            }
        }

        /* Diagonals */
        if (this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2] && this.board[0][0] !== 0) this.status = this.board[0][0];
        if (this.board[2][0] === this.board[1][1] && this.board[1][1] === this.board[0][2] && this.board[2][0] !== 0) this.status = this.board[2][0];

        if(this.status === 0){
            let allFilled = true;
            for (let i = 0; i < this.board.length; i++) {
                for (let j = 0; j < this.board.length; j++) {
                    if (this.board[i][j] === 0) { allFilled = false; break; }
                }
            }
            if(allFilled){
                this.status = 3;
            }
        }

        return this.status;

    }

    /**
     * @async
     */
    async clear() {
        this.board = [[0,0,0],[0,0,0],[0,0,0]];
        this.turn = 1;
        this.check();
        this.set();
    }

    /**
     * Returns a message for the status
     * @returns {string} - a string for the status
     */
    statusText() {
        this.check();
        if(this.status === 0){
            return "Game is still in session.";
        } else if(this.status === 1) {
            return "Player 1 has won."
        } else if(this.status === 2) {
            return ("Player 2 has won.");
        } else {
            return "It was a tie.";
        }
    }

    /**
     * Returns whether its ended
     * @returns {boolean} - whether's its over
     */
    ended() {
        this.check();
        return this.status !== 0;
    }

    /**
     * @returns {Object} - returns representations
     */
    representations() {
        let text = "";
        let moves = "";

        let available = [];

        let emojitext = "";
        let emojimoves = "";

        for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board[i].length; j++) {

                if (this.board[i][j] === 0) {

                    text += this.BLANK;
                    moves += UPPERALPHABET[3 * i + j];
                    available.push(3 * i + j);
                    emojitext += this.NONEEMOJI;
                    emojimoves += ALPHABETEMOJIS[3*i + j];

                } else if (this.board[i][j] === 1) {
                    text += this.X;
                    moves += this.X;
                    emojitext += this.XEMOJI;
                    emojimoves += this.XEMOJI;
                } else {
                    text += this.O;
                    moves += this.O;
                    emojitext += this.OEMOJI;
                    emojimoves += this.OEMOJI;
                }

                emojimoves += " ";
                emojitext += " ";
                text += this.DIVIDER;
                moves += this.DIVIDER;

            }
            text += this.NL;
            moves += this.NL;
            emojitext += this.NL;
            emojimoves += this.NL;
        }

        const emojis = [];

        for (const num of available) {

            emojis.push(ALPHABETEMOJIS[num]);

        }

        return { text, moves, available, emojis, emojitext, emojimoves };

    }

    /**
     * @returns {string} - returns "Player 1" or "Player 2"
     */
    getPlayer() {
        return "Player " + this.turn + ", playing " + (this.turn === 1 ? this.X : this.O) ;
    }

    /**
     * @param {number} placement - placement
     */
    move(placement) {
        let i = Math.floor(placement/3);
        let j = placement % 3;
        this.board[i][j] = this.turn;
        this.turn = 3 - this.turn;
        this.set();
    }
    
    /**
     * Passes the turn
     */
    pass(){
        this.turn = 3 - this.turn;
    }

    /**
     * @param {string} emojistr - string of emoji
     */
    moveWithEmoji(emojistr) {
        const placement = ALPHABETEMOJIS.indexOf(emojistr);
        this.move(placement);
    }

}

/**
 * A text bot that parses commands for a TTT game
 * @class
 */
class TTTbot { 
    /**
     * @constructor
     * @param {Object} dbref - Database reference
     */
    constructor(dbref) {
        this.ttt = new TTT(dbref);

        this.running = true;

        this.players = ["","",""];

        this.DOGGO1 = "https://lh3.googleusercontent.com/pw/ACtC-3dcVBptJlQ3_jIEjuQOUYytgaWf86H7ki93UR4nCOrPDPImMG9PPbm5peZLsi-ibviO5Qb3k4SCCVPoxc61xgTOo4ha6d5Zy7usNJFYjIyqi_N608rMxuEt63xL3xqfPOszDGkwtA3q-5lz1TxGwKdL=w1238-h928-no?authuser=0";
        this.DOGGO2 = "https://lh3.googleusercontent.com/10EsBINt0tqsyJ_IOR_I71S4MjcmZTrUI-Zp_heNDPNPLBdmgArgReAqSBtaQj2p3ox9FYWOSi5SyCsVLqsEsVBAmJEz3NrGHDqC6FDawSJ25-Rv4lNVhpjRqfDf9Y0OECSn5M4p0zLKqo_vCeFzznXgYgN6c3NONxoAaYhPmiTFI8z6xwAP19s-nLo4AbvP6zvfIuZ58iv3wk2pN2lBdkZlKF5UfpoVWEP1-cxZ4NumJvthfPowcO9L0lALt911aVCGXTuevThyWB7Sr_E_wXf9wgNVgX0iQO2iP1meWyILBowPu6zeue6i2uOJhS8ptAIRfSm2EHaf-4oZdRO4QrkwkhJQYSnR5FLSQxr4e5oADdQJHIhcsuFj7DGxRmzeHw5DJg0CpiDKRIeYTGjVLwZ-UZyrIuJkfT6WBtCT43HKuRJgM_73oiF8dTOy58veQPV43DcdepBXP9gGNrrPuL1NwjWYF1GrZHxblSkmMsZi_V4bZmAZlW0dOFDBrA36C_2p99y-CSCEccpIb7g8FtMCChymNaKiti3nRpWSuAVTMxaT7HjOic_4DmM5tLbs6IEOdtWvx8SYtOuSkV7qwoa3wHE5qHDRumJjynBtszTPtGIUNgaaeWIdb2p8JXL-wK0B-biBLO4Rq1zLEBD7EhthcSpK1yzF9mnM3aXYwde2wL2N8Szke2jxxi4Vrw=w696-h928-no?authuser=0";

    }

    /**
     * Stops the game
     */
    stop() {
        this.running = false;
    }

    /**
     * @async
     * @param {Discord.Message} message - the message that was received
     * @param {string[]} args - arguments
     */
    async onTTT (message, args) {

        try {
            if (args[0] === "COM") {
                throw "Computer not set up."
            } else if (args[0] && args[0].endsWith(">") && args[0].startsWith("<@!")) {
                this.players[1] = message.author.id;
                this.players[2] = args[0].slice(3,args[0].length - 1);
            } else {
                throw "Invalid arg";
            }

            this.playersmessage = await message.channel.send(`Player 1: <@!${this.players[1]}>, Player 2: <@!${this.players[2]}>`);
            this.currplayer = await message.channel.send("Please wait for the emojis to load...")
            this.actualboard = await message.channel.send("Please wait for the emojis to load...");
            this.movesboard = await message.channel.send("Please wait for the emojis to load...");
            this.embed = await message.channel.send("Info:");


            let promises = [];
            for (const emoji of ALPHABETEMOJIS.slice(0,9)) {

                promises.push(this.embed.react(emoji));

            }

            await Promise.all(promises);

        } catch(err) {
            message.reply("There was an error.");
            return;
        }

        this.clear();
        await this.sendTurn();

    }

    /**
     * 
     */
    clear() {
        this.ttt.clear();
        this.running = true;
    }

    ended() {
        return !this.running;
    }

    /**
     * @return
     */
    createEmbed() {
        return new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Tic Tac Toe')
            .setURL('https://photos.app.goo.gl/78opUCCzf6ZmJzDh8')
            .setAuthor('PeepsBot', this.DOGGO2, 'https://photos.app.goo.gl/78opUCCzf6ZmJzDh8')
            .setDescription('Playing TTT. Please wait until all the reactions have been finished before reacting yourself.')
            .setThumbnail(this.DOGGO1)

            .addFields({
                name: "Player",
                value: this.ttt.getPlayer()
            })

            .setTimestamp()
            .setFooter('TTT', this.DOGGO2);
    }

    /**
     * @param {Discord.Collection} collected
     */
    moveWith(collected) {
        const reaction = collected.first().emoji.name;
        this.ttt.moveWithEmoji(reaction);

        if (this.ttt.ended()) {
            // this.embed.reply(this.ttt.statusText());
            this.running = false;
            this.end();
        } else {
            this.sendTurn();
        }
    }

    /**
     * 
     */
    async end() {
        await this.ttt.get();

        const { text, moves, emojitext, emojis, emojimoves } = this.ttt.representations();

        this.currplayer.edit(this.ttt.statusText());
        this.actualboard.edit(emojitext)
        this.movesboard.delete();

        const embed = this.createEmbed();

        await this.embed.edit(embed);
    }

    /**
     * 
     */
    sendError(){
        if (!this.ended()) {
            this.embed.channel.send("<@!" + this.players[this.ttt.turn] + ">, you didn't react.");

            this.ttt.pass();

            this.sendTurn();
        }
    }

    /**
     * @async
     */
    async sendTurn() {

        if(!this.running) return;

        await this.ttt.get();

        const { text, moves, emojitext, emojis, emojimoves } = this.ttt.representations();
        
        this.currplayer.edit(`It's Player ${this.ttt.turn}'s turn.`)
        this.actualboard.edit(emojitext)
        this.movesboard.edit(emojimoves)

        const embed = this.createEmbed();

        await this.embed.edit(embed);

        const filter = (reaction, user) => {
            return emojis.includes(reaction.emoji.name) && user.id === this.players[this.ttt.turn];
        };

        this.embed.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
            .then(collected => {
                this.moveWith(collected);
            })
            .catch(collected => {
                this.sendError();
            });
    }

}

class Command {
    constructor(name, description, body) {
        this.name = name;
        this.description = description;
        this.body = body;
        
        this.enabled = true;
    }
    
    runFunc() {
        if(this.enabled) {
            this.body();
        } else {
            message.channel.send("That command is disabled");
        }
    }

    toggle() {
        this.enabled = !this.enabled;
    }
}

class ProcessorBot {

    /**
     * @constructor
     * @param {google.auth.OAuth2} auth 
     */
    constructor(auth) {

        this.sheets = google.sheets({ version: 'v4', auth });

        this.ref = db.ref("TTT");
        this.ref.set([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
        this.ttt = new TTTbot(this.ref);

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
        // this.updateChannels = ["748669830244073536",] //"756704885264875633"]
        this.updateChannels = [];

        this.musicBots = ["234395307759108106"]

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

        // console.log(this.daysmap)

        // let keys = [... this.daysmap.keys()];
        // let key = keys[0];
        // let keyid = this.daysmap.get(key);
        // let rows = (await this.readSheet(this.groovySheetID, key));
        // let values = [];
        // for(let i = 0; i < rows.length; i++){
        //     let val = rows[i][0];
        //     if(values.indexOf(val) === -1) {
        //         values.push(val);
        //     } else {
        //         let requests = [];
        //         requests.push( {
        //             deleteDimension: {
        //                 range: {
        //                     sheetId: keyid,
        //                     dimension: "ROWS",
        //                     startIndex: i,
        //                     endIndex: i+1
        //                 }
        //             }
        //         });

        //         await this.sheets.spreadsheets.batchUpdate({
        //             spreadsheetId: this.groovySheetID,
        //             resource: { requests },
        //         });

        //     }

            
        // }

        // console.log(rows);

         
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
        
        // let res = await this.sheets.spreadsheets.values.get({
        //     spreadsheetId: this.quoteID,
        //     range: `Sheet1!A2:B`
        // })
        // let rows = res.data.values;

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
            if(this.musicBots.indexOf( message.author.id ) !== -1 && message.embeds[0]){

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

let STARTUP = async function(sheets){

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

}

authorize({
    installed: {
        client_id: process.env.client_id_googleoath,
        project_id: process.env.project_id_googleoath,
        auth_uri: process.env.auth_uri_googleoath,
        token_uri: process.env.token_uri_googleoath,
        auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url_googleoath,
        client_secret: process.env.client_secret_googleoath,
        redirect_uris: [process.env.redirect_uris1_googleoath, process.env.redirect_uris2_googleoath]
    }
}, STARTUP);
