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
exports.SqualolBot = void 0;
const SA_1 = require("./SA");
/**
 * @todo Build another layer of abstraction between SqualolBot and SA.ts
 */
class SqualolBot {
    constructor() {
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            let stuff = new SA_1.Course((yield SA_1.SchoologyAccessor.listCourses())[10]);
            yield stuff.onConstruct();
            console.log(stuff.baseFolder.children[0]);
            // fs.writeFileSync('./day1.json', JSON.stringify(await SchoologyAccessor.getFolder('2772305484', '398147550')))
            // fs.writeFileSync('./temp/assignmentslist.json', JSON.stringify( await (await SchoologyAccessor.get('/sections/2772305484/assignments?limit=1000')).json()) );
        });
    }
    available(message) {
        return message.guild.id === '748669830244073533';
    }
}
exports.SqualolBot = SqualolBot;
