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
const fs = require("fs");
const https = require("https");
class ImageBot {
    constructor(auth, client) {
        this.prefix = "--";
        this.jackFolder = '1JyzBfznVFXsuzv_fJYjdSrju5PDDrAZb';
        this.approvedChannels = ['808469386746789938'];
        this.client = client;
        this.driveUser = new DriveUser_1.DriveUser(auth);
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.approvedChannels.includes(message.channel.id)) {
                if (message.attachments.size > 0) {
                    console.log("Uploading!");
                    const url = message.attachments.first().url;
                    const path = `./temp/${message.id}.png`;
                    let p = new Promise((r, j) => {
                        https.get(url, (res) => {
                            res.on('end', () => {
                                r();
                            });
                            res.pipe(fs.createWriteStream(path));
                        });
                    });
                    yield p;
                    yield this.driveUser.uploadFile(`${message.id}.png`, path, this.jackFolder);
                }
            }
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.ImageBot = ImageBot;
