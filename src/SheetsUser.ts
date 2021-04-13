import { google, sheets_v4 } from 'googleapis';

export class SheetsUser {

    private sheets: sheets_v4.Sheets;
    private setup: boolean;
    private readonly alphabet: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    public map: Map<string, { id: string, sheets: Map<string, string> }>;

    constructor(auth, sheetIdMap?: Map<string, string>) {
        this.sheets = google.sheets({ version: 'v4', auth });
        this.map = new Map();

        if(sheetIdMap) {
            for (const key of sheetIdMap.keys()) {
                this.map.set(key, {
                    id: sheetIdMap.get(key),
                    sheets: new Map()
                })
            }
        }
        this.setup = false;
    }

    async addSheet(key:string, id:string) {
        this.map.set(key,{
            id,
            sheets: new Map()
        });

        await this.setUpSheet(key);
    }

    async onConstruct() {
        for (const key of this.map.keys()) {

            console.log(`Setting up ${key}`);
            await this.setUpSheet(key);
        }
    }

    async setUpSheet(name: string) {
        let info = await this.getSpreadsheetInfo(name);
        let newmap = new Map();

        for (const sheet of info.data.sheets) {
            newmap.set(sheet.properties.title, sheet.properties.sheetId);
        }

        this.map.get(name).sheets = newmap;
    }

    handleSheetId(param: string) {
        return (this.map.has(param) ? this.map.get(param).id : param);
    }

    async deleteSubSheet(sheetname: string, subsheetname: string) {
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        console.trace(`SUBSHEET DELETED: ${sheetname} - ${subsheetname}`)
        let reqs = [];


        reqs.push({
            "deleteSheet": {
                "sheetId": subsheetid
            }
        });

        await this.executeRequest(sheetname, reqs);
    }

    async moveCol(sheetname:string, subsheetname:string, rowa:number, rowb:number) {
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        let requests = [];
        
        requests.push({
            "moveDimension": {
                "source": {
                    "sheetId": subsheetid,
                    "dimension": "COLUMNS",
                    "startIndex": rowa,
                    "endIndex": rowa+1
                },
                "destinationIndex": rowb
            }
        });


        await this.executeRequest(sheetname, requests);
    }

    async bulkRead(sheetname:string) {
        // console.log((await this.getSubsheets(sheetname)).find(a => a.includes("ICE4113")));
        let res = await this.sheets.spreadsheets.values.batchGet({
            spreadsheetId: this.map.get(sheetname).id,
            ranges: (await this.getSubsheets(sheetname)).map(a => {
                // console.log(a);
                return a;
            }),
        })
        return res.data.valueRanges;
    }

    async insertCol(sheetname: string, subsheetname: string, header:string, col: number, size:number) {
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        let requests = [];

        requests.push({
            "insertDimension": {
                "range": {
                    "sheetId": subsheetid,
                    "dimension": "COLUMNS",
                    "startIndex": col,
                    "endIndex": col+1
                },
                "inheritFromBefore": true
            }
        });

        requests.push({
            updateCells: {
                "rows": [{
                    values: [{
                        userEnteredValue: {
                            stringValue: header
                        }
                    }]
                }],
                fields: "*",
                range: {
                    "sheetId": subsheetid,
                    "startRowIndex": 0,
                    "endRowIndex": 1,
                    "startColumnIndex": col,
                    "endColumnIndex": col+1
                },
            }
        })

        requests.push({
            "updateDimensionProperties": {
                "range": {
                    "sheetId": subsheetid,
                    "dimension": "COLUMNS",
                    "startIndex": col,
                    "endIndex": col + 1
                },
                "properties": {
                    "pixelSize": size
                },
                "fields": "pixelSize"
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


        await this.executeRequest(sheetname, requests);
    }

    async getSubsheets(name: string) {
        return [...this.map.get(name).sheets.keys()];
    }

    async add(sheetname: string, subsheetname: string, row: (string | number)[]) {
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        let requests = [];

        let mappedrow = row.map((x) => {
            if (typeof x === "string") {
                return {
                    userEnteredValue: {
                        stringValue: x
                    }
                }
            } else if (typeof x === "number") {
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

    async bulkAdd(sheetname: string, subsheetname: string, rows: (string | number)[][]) {
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
                        }
                    } else if (typeof x === "number") {
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

    async updateRow(sheetname: string, subsheetname: string, row: (string | number)[], num: number) {
        let requests = [];
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        let mappedrow = row.map((x) => {
            if (typeof x === "string") {
                return {
                    userEnteredValue: {
                        stringValue: x
                    }
                }
            } else if (typeof x === "number") {
                return {
                    userEnteredValue: {
                        numberValue: x
                    }
                }
            }
        })

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
        })

        await this.executeRequest(sheetname, requests);
    }

    async bulkUpdateRows(sheetname: string, subsheetname: string, data: { row: string[], num: number }[]) {
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
                    }
                } else if (typeof x === "number") {
                    return {
                        userEnteredValue: {
                            numberValue: x
                        }
                    }
                }
            })

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
            })

        }

        await this.executeRequest(sheetname, requests);
    }

    newRow(oldrow: string[], newrow: string[], rowcheck: (string | boolean | ((a: string, b: string) => string))[]) {
        for (let i = 0; i < rowcheck.length; i++) {
            if (rowcheck[i] === true) { // It matters!
                // Don't change anything
            } else if (rowcheck[i] === "KEEP") {
                // Don't change anything
            } else if (rowcheck[i] === "CHANGE") {
                oldrow[i] = newrow[i];
            } else if (typeof rowcheck[i] === "function") {
                // @ts-ignore
                oldrow[i] = rowcheck[i](oldrow[i], newrow[i]);
            }
        }
        return oldrow;
    }

    async addWithoutDuplicates(sheetname, subsheetname, row, check) {
        let rows = await this.readSheet(sheetname, subsheetname);

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
                await this.updateRow(sheetname, subsheetname, this.newRow(currrow.slice(0, row.length), row, check), i);
            }
        }

        if (!duplicate) {
            await this.add(sheetname, subsheetname, row);
        }
    }

    async bulkAddWithoutDuplicates(sheetname, subsheetname, addrows, check) {
        let changes = new Map();
        let rows = await this.readSheet(sheetname, subsheetname);
        let newrows = [];

        for (const row of addrows) {
            let duplicate = false;
            for (let i = 1; i < rows.length + newrows.length; i++) {

                let currrow;

                if (i >= rows.length) currrow = newrows[i - rows.length];
                else currrow = rows[i];

                if (changes.has(i)) currrow = changes.get(i);
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
                    } else {
                        newrows[i - rows.length] = this.newRow(currrow.slice(0, row.length), row, check);
                    }

                }
            }
            if (!duplicate) {
                newrows.push(row);
            }
        }

        await this.bulkAdd(sheetname, subsheetname, newrows);
        for (const key of changes.keys()) {
            await this.updateRow(sheetname, subsheetname, changes.get(key), key);
        }

    }

    async getSpreadsheetInfo(name: string) {
        name = this.handleSheetId(name);
        return await this.sheets.spreadsheets.get({ spreadsheetId: name });
    }

    async readSheet(sheetname: string, subsheetname: string, range?: string) {
        let info = this.map.get(sheetname);
        let res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: info.id,
            range: range ? `${subsheetname}!${range}` : subsheetname
        })
        return res.data.values;
    }

    async clearSheet(sheetname:string,subsheetname:string,range?:string) {
        let info = this.map.get(sheetname);
        
        await this.sheets.spreadsheets.values.clear({
            spreadsheetId: info.id,
            range: range ? `${subsheetname}!${range}` : subsheetname
        });
    }

    async createSubsheet(sheetname: string, subsheetname: string, format: { tabColor?: string, columnResize: (number | string)[], headers: string[] }) {
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
        await this.setUpSheet(sheetname);
        await this.formatSubsheet(sheetname, subsheetname, format);
    }

    async formatSubsheet(sheetname: string, subsheetname: string, format?: { columnResize: (number | string)[], headers: string[] }) {
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
                })
            }

        }


        if (format.headers) {
            let headermap = format.headers.map((x) => {
                return {
                    userEnteredValue: {
                        stringValue: x
                    }
                }
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
            })
        }

        await this.executeRequest(sheetname, requests);

    }

    async executeRequest(sheetname:string, requests: any[]) {
        if (requests.length === 0) return;
        // @ts-ignore
        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.map.get(sheetname).id,
            resource: { requests },
        });
    }
}