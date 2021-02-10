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
exports.DriveUser = void 0;
const googleapis_1 = require("googleapis");
const fs = require("fs");
class DriveUser {
    constructor(auth) {
        this.drive = googleapis_1.google.drive({ version: 'v3', auth });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            // const res = await this.drive.files.list({
            //     pageSize: 10,
            //     fields: 'nextPageToken, files(id, name)',
            // });
            // const files = res.data.files;
            // console.log(files);
            // await this.downloadFile("1Shi57Ly1cmpSUlNokv6hYUE8Q8Q012PR", './brr.png');
            // console.log( await this.uploadFile('test.jpg', './brr.png') );
            // const id = await this.createFolder("brr");
            // this.uploadFile("haha", "./brr.png", id);
            //1JyzBfznVFXsuzv_fJYjdSrju5PDDrAZb
        });
    }
    getItemsInFolder(folderid) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.drive.files.list({
                q: `parents in "${folderid}"`
            })).data.files;
        });
    }
    createFile(name, filetype, parentID) {
        return __awaiter(this, void 0, void 0, function* () {
            let requestBody;
            if (parentID) {
                requestBody = {
                    mimeType: filetype,
                    name: name,
                    parents: [parentID]
                };
            }
            else {
                requestBody = {
                    mimeType: filetype,
                    name: name
                };
            }
            return (yield this.drive.files.create({
                requestBody,
                fields: 'id'
            })).data.id;
        });
    }
    createFolder(name, parentID) {
        return __awaiter(this, void 0, void 0, function* () {
            var fileMetadata;
            if (parentID) {
                fileMetadata = {
                    name,
                    parent: [parentID],
                    mimeType: 'application/vnd.google-apps.folder'
                };
            }
            else {
                fileMetadata = {
                    name,
                    mimeType: 'application/vnd.google-apps.folder'
                };
            }
            return new Promise((r, j) => {
                this.drive.files.create({
                    resource: fileMetadata,
                    fields: 'id'
                }, function (err, file) {
                    if (err) {
                        // Handle error
                        j(err);
                    }
                    else {
                        r(file.data.id);
                    }
                });
            });
        });
    }
    uploadFile(name, filename, parentID, type) {
        return __awaiter(this, void 0, void 0, function* () {
            var fileMetadata;
            if (parentID) {
                fileMetadata = {
                    name,
                    parents: [parentID]
                };
            }
            else {
                fileMetadata = {
                    name
                };
            }
            var media = {
                mimeType: type || 'image/jpeg',
                body: fs.createReadStream(filename)
            };
            return new Promise((r, j) => {
                this.drive.files.create({
                    resource: fileMetadata,
                    media: media,
                    fields: 'id'
                }, (err, res) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        j(err);
                    }
                    else {
                        r(res.data.id);
                    }
                }));
            });
        });
    }
    downloadFile(fileId, destination) {
        return __awaiter(this, void 0, void 0, function* () {
            var dest = fs.createWriteStream(destination);
            const res = yield this.drive.files.get({
                fileId: fileId,
                alt: 'media',
            }, {
                responseType: "stream"
            });
            return new Promise((r, j) => {
                res.data.on('end', () => {
                    r();
                })
                    .on('error', function (err) {
                    j();
                })
                    .pipe(dest);
            });
        });
    }
}
exports.DriveUser = DriveUser;
DriveUser.SPREADSHEET = 'application/vnd.google-apps.spreadsheet';
