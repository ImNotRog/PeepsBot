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
                            columnResize: [200, 200, 100, 200, 200, 100],
                            headers: ["File Name", "M-ID", "File Type", "UID", "User", "Stars"]
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
                    yield this.driveUser.uploadFile(`${message.id}.${filetype}`, path, this.categories.get(cat));
                    yield this.sheetUser.add("images", cat, [`${message.id}.${filetype}`, message.id, filetype, message.author.id, message.author.username + '#' + message.author.discriminator, 0]);
                }
            }
        });
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
                    yield this.sheetUser.addWithoutDuplicates("images", cat, ["File Name", reaction.message.id, "File Type", "UID", "User", reaction.count], ["KEEP", true, "KEEP", "KEEP", "KEEP", "CHANGE"]);
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
            for (const id of this.approvedChannels) {
                let channel = yield this.client.channels.fetch(id);
                // @ts-ignore
                const test = yield channel.messages.fetch({
                    limit: 90
                });
            }
            console.log(this.categories);
            yield this.sheetUser.onConstruct();
            // for (const id of this.approvedChannels) {
            //     let channel = await this.client.channels.fetch(id)
            //     // @ts-ignore
            //     const test: Map<string, Discord.Message> = await channel.messages.fetch({
            //         limit: 13
            //     })
            //     for(const key of test.keys()) {
            //         this.onMessage(test.get(key));
            //     }
            // }
        });
    }
    capitilize(a) {
        return a[0].toUpperCase() + a.slice(1).toLowerCase();
    }
}
exports.ImageBot = ImageBot;
