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
exports.TestBot = void 0;
const DriveUser_1 = require("./DriveUser");
const SheetsUser_1 = require("./SheetsUser");
class TestBot {
    constructor(auth, client) {
        this.prefix = "--";
        this.imagesFolder = '1Bil_W-7kd43marLiwlL6nZ7nEZAUzKQ2';
        this.imagesSheet = '17iYieSC2zDKpxgSPqhk6fcJZQjVBvJFE5S5KS1IcON8';
        this.jackChannels = ['809143110302826497'];
        this.client = client;
        this.driveUser = new DriveUser_1.DriveUser(auth);
        let map = new Map();
        map.set('images', this.imagesSheet);
        this.sheetUser = new SheetsUser_1.SheetsUser(auth, map);
        this.helpEmbed = {
            title: `Help - Test Bot`,
            description: `A test module for dev purposes. tl;dr nerd shtuf.`,
            fields: []
        };
    }
    available(message) {
        return false;
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log(PROCESS(message));
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            // let res = await SchoologyAccessor.get("/sections/2772305484/folders/4657347337")
            // let res = await SchoologyAccessor.get("/courses/2772305484/folder/347235182")
            // fs.writeFileSync("./temp/folderv2.json", JSON.stringify( await res.json()) );
            // console.log('hello!');
            // await this.sheetUser.onConstruct();
            // console.log(await this.sheetUser.bulkRead("images"));
            // for(const subsheet of await this.sheetUser.getSubsheets("images")) {
            //     // await this.sheetUser.moveCol("images", subsheet, 6, 3);
            //     await this.sheetUser.insertCol("images", subsheet, "Caption", 6, 300);
            //     await this.sheetUser.insertCol("images", subsheet, "Tags", 7, 300);
            // }
        });
    }
}
exports.TestBot = TestBot;
