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
exports.SheetsUser = void 0;
const googleapis_1 = require("googleapis");
class SheetsUser {
    constructor(auth, sheetIdMap) {
        this.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.sheets = googleapis_1.google.sheets({ version: 'v4', auth });
        this.map = new Map();
        for (const key of sheetIdMap.keys()) {
            this.map.set(key, {
                id: sheetIdMap.get(key),
                sheets: new Map()
            });
        }
        this.setup = false;
    }
    SetUpSheets() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const key of this.map.keys()) {
                console.log(`Setting up ${key}`);
                let info = yield this.getSpreadsheetInfo(key);
                let newmap = new Map();
                for (const sheet of info.data.sheets) {
                    newmap.set(sheet.properties.title, sheet.properties.sheetId);
                }
                this.map.get(key).sheets = newmap;
            }
        });
    }
    SetUpSheet(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let info = yield this.getSpreadsheetInfo(name);
            let newmap = new Map();
            for (const sheet of info.data.sheets) {
                newmap.set(sheet.properties.title, sheet.properties.sheetId);
            }
            this.map.get(name).sheets = newmap;
        });
    }
    handleSheetId(param) {
        return (this.map.has(param) ? this.map.get(param).id : param);
    }
    getSubsheets(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return [...this.map.get(name).sheets.keys()];
        });
    }
    add(sheetname, subsheetname, row) {
        return __awaiter(this, void 0, void 0, function* () {
            let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
            let requests = [];
            let mappedrow = row.map((x) => {
                if (typeof x === "string") {
                    return {
                        userEnteredValue: {
                            stringValue: x
                        }
                    };
                }
                else if (typeof x === "number") {
                    return {
                        userEnteredValue: {
                            numberValue: x
                        }
                    };
                }
            });
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
            });
            yield this.executeRequest(sheetname, requests);
        });
    }
    bulkAdd(sheetname, subsheetname, rows) {
        return __awaiter(this, void 0, void 0, function* () {
            let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
            let requests = [];
            let mappedrows = rows.map((y) => {
                return {
                    values: y.map((x) => {
                        if (typeof x === "string") {
                            return {
                                userEnteredValue: {
                                    stringValue: x
                                }
                            };
                        }
                        else if (typeof x === "number") {
                            return {
                                userEnteredValue: {
                                    numberValue: x
                                }
                            };
                        }
                    })
                };
            });
            requests.push({
                appendCells: {
                    "sheetId": subsheetid,
                    "rows": mappedrows,
                    fields: "*"
                }
            });
            yield this.executeRequest(sheetname, requests);
        });
    }
    updateRow(sheetname, subsheetname, row, num) {
        return __awaiter(this, void 0, void 0, function* () {
            let requests = [];
            let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
            let mappedrow = row.map((x) => {
                if (typeof x === "string") {
                    return {
                        userEnteredValue: {
                            stringValue: x
                        }
                    };
                }
                else if (typeof x === "number") {
                    return {
                        userEnteredValue: {
                            numberValue: x
                        }
                    };
                }
            });
            requests.push({
                updateCells: {
                    rows: [{ values: mappedrow }],
                    fields: "*",
                    range: {
                        "sheetId": subsheetid,
                        "startRowIndex": num,
                        "endRowIndex": num + 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": row.length
                    },
                }
            });
            yield this.executeRequest(sheetname, requests);
        });
    }
    bulkUpdateRows(sheetname, subsheetname, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let requests = [];
            let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
            for (const obj of data) {
                let row = obj.row;
                let num = obj.num;
                let mappedrow = row.map((x) => {
                    if (typeof x === "string") {
                        return {
                            userEnteredValue: {
                                stringValue: x
                            }
                        };
                    }
                    else if (typeof x === "number") {
                        return {
                            userEnteredValue: {
                                numberValue: x
                            }
                        };
                    }
                });
                requests.push({
                    updateCells: {
                        rows: [{ values: mappedrow }],
                        fields: "*",
                        range: {
                            "sheetId": subsheetid,
                            "startRowIndex": num,
                            "endRowIndex": num + 1,
                            "startColumnIndex": 0,
                            "endColumnIndex": row.length
                        },
                    }
                });
            }
            yield this.executeRequest(sheetname, requests);
        });
    }
    newRow(oldrow, newrow, rowcheck) {
        for (let i = 0; i < rowcheck.length; i++) {
            if (rowcheck[i] === true) { // It matters!
                // Don't change anything
            }
            else if (rowcheck[i] === "KEEP") {
                // Don't change anything
            }
            else if (rowcheck[i] === "CHANGE") {
                oldrow[i] = newrow[i];
            }
            else if (typeof rowcheck[i] === "function") {
                // @ts-ignore
                oldrow[i] = rowcheck[i](oldrow[i], newrow[i]);
            }
        }
        return oldrow;
    }
    addWithoutDuplicates(sheetname, subsheetname, row, check) {
        return __awaiter(this, void 0, void 0, function* () {
            let rows = yield this.readSheet(sheetname, subsheetname);
            let duplicate = false;
            for (let i = 1; i < rows.length; i++) {
                let currrow = rows[i];
                let currisduplicate = true;
                for (let j = 0; j < check.length; j++) {
                    if (check[j] === true) {
                        if (currrow[j] !== row[j]) {
                            currisduplicate = false;
                        }
                    }
                }
                if (currisduplicate) {
                    duplicate = true;
                    yield this.updateRow(sheetname, subsheetname, this.newRow(currrow.slice(0, row.length), row, check), i);
                }
            }
            if (!duplicate) {
                yield this.add(sheetname, subsheetname, row);
            }
        });
    }
    bulkAddWithoutDuplicates(sheetname, subsheetname, addrows, check) {
        return __awaiter(this, void 0, void 0, function* () {
            let changes = new Map();
            let rows = yield this.readSheet(sheetname, subsheetname);
            let newrows = [];
            for (const row of addrows) {
                let duplicate = false;
                for (let i = 1; i < rows.length + newrows.length; i++) {
                    let currrow;
                    if (i >= rows.length)
                        currrow = newrows[i - rows.length];
                    else
                        currrow = rows[i];
                    if (changes.has(i))
                        currrow = changes.get(i);
                    let currisduplicate = true;
                    for (let j = 0; j < check.length; j++) {
                        if (check[j] === true) {
                            if (currrow[j] !== row[j]) {
                                currisduplicate = false;
                            }
                        }
                    }
                    if (currisduplicate) {
                        duplicate = true;
                        if (i < rows.length) {
                            changes.set(i, this.newRow(currrow.slice(0, row.length), row, check));
                        }
                        else {
                            newrows[i - rows.length] = this.newRow(currrow.slice(0, row.length), row, check);
                        }
                    }
                }
                if (!duplicate) {
                    newrows.push(row);
                }
            }
            yield this.bulkAdd(sheetname, subsheetname, newrows);
            for (const key of changes.keys()) {
                yield this.updateRow(sheetname, subsheetname, changes.get(key), key);
            }
        });
    }
    getSpreadsheetInfo(name) {
        return __awaiter(this, void 0, void 0, function* () {
            name = this.handleSheetId(name);
            return yield this.sheets.spreadsheets.get({ spreadsheetId: name });
        });
    }
    readSheet(sheetname, subsheetname, range) {
        return __awaiter(this, void 0, void 0, function* () {
            let info = this.map.get(sheetname);
            let res = yield this.sheets.spreadsheets.values.get({
                spreadsheetId: info.id,
                range: range ? `${subsheetname}!${range}` : subsheetname
            });
            return res.data.values;
        });
    }
    createSubsheet(sheetname, subsheetname, format) {
        return __awaiter(this, void 0, void 0, function* () {
            let requests = [];
            requests.push({
                addSheet: {
                    properties: {
                        title: subsheetname,
                        tabColor: format.tabColor
                    }
                }
            });
            yield this.executeRequest(sheetname, requests);
            yield this.SetUpSheet(sheetname);
            yield this.formatSubsheet(sheetname, subsheetname, format);
        });
    }
    formatSubsheet(sheetname, subsheetname, format) {
        return __awaiter(this, void 0, void 0, function* () {
            let requests = [];
            let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
            if (format.columnResize) {
                for (let i = 0; i < format.columnResize.length; i++) {
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
                    });
                }
            }
            if (format.headers) {
                let headermap = format.headers.map((x) => {
                    return {
                        userEnteredValue: {
                            stringValue: x
                        }
                    };
                });
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
                });
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
                requests.push({
                    update_sheet_properties: {
                        properties: {
                            sheet_id: subsheetid,
                            grid_properties: {
                                frozen_row_count: 1
                            }
                        },
                        fields: 'gridProperties.frozenRowCount'
                    }
                });
            }
            this.executeRequest(sheetname, requests);
        });
    }
    executeRequest(sheetname, requests) {
        return __awaiter(this, void 0, void 0, function* () {
            if (requests.length === 0)
                return;
            // @ts-ignore
            yield this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.map.get(sheetname).id,
                resource: { requests },
            });
        });
    }
}
exports.SheetsUser = SheetsUser;
