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
        this.jackFolder = '1JyzBfznVFXsuzv_fJYjdSrju5PDDrAZb';
        this.approvedChannels = ['808469386746789938'];
        this.client = client;
        this.driveUser = new DriveUser_1.DriveUser(auth);
        let map = new Map();
        map.set('images', this.imagesSheet);
        this.sheetUser = new SheetsUser_1.SheetsUser(auth, map);
        this.categories = new Map();
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.approvedChannels.includes(message.channel.id)) {
                if (message.attachments.size > 0 && !message.author.bot) {
                    console.log("Uploading!");
                    const cat = message.content.length > 0 ? this.capitilize(message.content) : 'Archive';
                    if (!this.categories.has(cat)) {
                        this.categories.set(cat, yield this.driveUser.createFolder(cat, this.imagesFolder));
                    }
                    const url = message.attachments.first().url;
                    const filetype = url.slice(url.lastIndexOf('.') + 1);
                    console.log(filetype);
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
