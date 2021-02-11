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
exports.ImageBot = void 0;
const Discord = require("discord.js");
const ProcessMessage_1 = require("./ProcessMessage");
const DriveUser_1 = require("./DriveUser");
const SheetsUser_1 = require("./SheetsUser");
const fs = require("fs");
const https = require("https");
class ImageBot {
    constructor(auth, client) {
        this.prefix = "--";
        this.imagesFolder = '1Bil_W-7kd43marLiwlL6nZ7nEZAUzKQ2';
        this.imagesSheet = '17iYieSC2zDKpxgSPqhk6fcJZQjVBvJFE5S5KS1IcON8';
        this.jackChannels = ['809143110302826497'];
        this.approvedChannels = ['808469386746789938', '809143110302826497'];
        this.voting = ['Jack', 'Nature'];
        this.client = client;
        this.driveUser = new DriveUser_1.DriveUser(auth);
        let map = new Map();
        map.set('images', this.imagesSheet);
        this.sheetUser = new SheetsUser_1.SheetsUser(auth, map);
        this.categories = new Map();
        this.categoriesSpreadsheetCache = new Map();
        this.client.on("messageReactionAdd", (reaction, user) => { this.onReaction(reaction, user); });
        this.client.on("messageReactionRemove", (reaction, user) => { this.onReaction(reaction, user); });
    }
    cat(message) {
        const cat = message.content.length > 0 ? this.capitilize(message.content) : this.jackChannels.includes(message.channel.id) ? 'Jack' : 'Archive';
        return cat;
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.approvedChannels.includes(message.channel.id)) {
                if (message.attachments.size > 0 && !message.author.bot) {
                    const cat = this.cat(message);
                    if (!this.categories.has(cat)) {
                        // New category
                        this.categories.set(cat, yield this.driveUser.createFolder(cat, this.imagesFolder));
                        yield this.sheetUser.createSubsheet("images", cat, {
                            columnResize: [200, 200, 100, 200, 200, 100, 300],
                            headers: ["File Name", "M-ID", "File Type", "UID", "User", "Stars", "D-ID"]
                        });
                    }
                    const url = message.attachments.first().url;
                    const filetype = url.slice(url.lastIndexOf('.') + 1);
                    console.log(`Uploading ${filetype}`);
                    const path = `./temp/${message.id}.${filetype}`;
                    let p = new Promise((r, j) => {
                        https.get(url, (res) => {
                            res.on('end', () => {
                                r();
                            });
                            const writestream = fs.createWriteStream(path);
                            writestream.on('open', () => {
                                res.pipe(writestream);
                            });
                        });
                    });
                    yield p;
                    let id = yield this.driveUser.uploadFile(`${message.id}.${filetype}`, path, this.categories.get(cat));
                    yield this.sheetUser.add("images", cat, [`${message.id}.${filetype}`, message.id, filetype, message.author.id, message.author.username + '#' + message.author.discriminator, 0, id]);
                    this.categoriesSpreadsheetCache.set(cat, yield this.sheetUser.readSheet("images", cat));
                }
            }
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                if (this.categories.has(this.capitilize(result.command))) {
                    let time = Date.now();
                    // console.log(result.command);
                    const cat = this.capitilize(result.command);
                    // const link = `https://drive.google.com/uc?id=${'1kkKs4sfeMqM8B9gAAbdzS2Ungu2gjor9'}`
                    // const a = new Discord.MessageAttachment("./temp/brr.jpeg");
                    // await this.driveUser.downloadFile('1kkKs4sfeMqM8B9gAAbdzS2Ungu2gjor9', './temp/test.jpeg');
                    // const a = new Discord.MessageAttachment(link);
                    // await message.channel.send(a);
                    // console.log(Date.now() - time);
                    let entries = this.categoriesSpreadsheetCache.get(cat).length - 1;
                    let index = Math.floor(Math.random() * entries) + 1;
                    let row = this.categoriesSpreadsheetCache.get(cat)[index];
                    let DID = row[6];
                    let filename = row[0];
                    if (!this.inCache(filename)) {
                        yield this.driveUser.downloadFile(DID, `./temp/${filename}`);
                    }
                    const a = new Discord.MessageAttachment(`./temp/${filename}`);
                    yield message.channel.send(a);
                }
            }
        });
    }
    inCache(filename) {
        return fs.existsSync(`./temp/${filename}`);
    }
    onReaction(reaction, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.approvedChannels.indexOf(reaction.message.channel.id) === -1)
                return;
            try {
                yield reaction.fetch();
            }
            catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                return;
            }
            if (reaction.emoji.name === "👍" && reaction.message.attachments.size > 0) {
                const cat = this.cat(reaction.message);
                console.log(`${reaction.message.id} has ${reaction.count} and cat ${cat}`);
                if (true) {
                    // if(this.voting.includes(cat)) {
                    yield this.sheetUser.addWithoutDuplicates("images", cat, ["File Name", reaction.message.id, "File Type", "UID", "User", reaction.count, "D-ID"], ["KEEP", true, "KEEP", "KEEP", "KEEP", "CHANGE", "KEEP"]);
                    this.categoriesSpreadsheetCache.set(cat, yield this.sheetUser.readSheet("images", cat));
                }
            }
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield this.driveUser.getItemsInFolder(this.imagesFolder);
            for (const file of files) {
                if (file.mimeType === DriveUser_1.DriveUser.FOLDER) {
                    this.categories.set(file.name, file.id);
                }
            }
            for (const key of this.categories.keys()) {
                this.categoriesSpreadsheetCache.set(key, yield this.sheetUser.readSheet("images", key));
            }
            for (const id of this.approvedChannels) {
                let channel = yield this.client.channels.fetch(id);
                // @ts-ignore
                const test = yield channel.messages.fetch({
                    limit: 90
                });
            }
            console.log(this.categories);
        });
    }
    capitilize(a) {
        return a[0].toUpperCase() + a.slice(1).toLowerCase();
    }
}
exports.ImageBot = ImageBot;
