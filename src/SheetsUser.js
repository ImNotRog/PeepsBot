const { google } = require('googleapis');

class SheetsUser {
    /**
     * 
     * @param {google.auth.OAuth2} auth 
     * @param {Map<string,string>} sheetIdMap 
     */
    constructor(auth, sheetIdMap) {
        this.sheets = google.sheets({version: 'v4', auth});
        this.map = new Map();
        for(const key of sheetIdMap.keys()) {
            this.map.set(key, {
                id: sheetIdMap.get(key),
                sheets: ""
            })
        }
        this.setup = false;
        this.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }

    async SetUpSheets() {
        for(const key of this.map.keys()) {

            let info = await this.getSpreadsheetInfo(key);
            let newmap = new Map();

            for(const sheet of info.data.sheets){
                newmap.set(sheet.properties.title, sheet.properties.sheetId);
            }

            this.map.get(key).sheets = newmap;
        }
    }

    async SetUpSheet(name) {
        let info = await this.getSpreadsheetInfo(name);
        let newmap = new Map();

        for(const sheet of info.data.sheets){
            newmap.set(sheet.properties.title, sheet.properties.sheetId);
        }

        this.map.get(name).sheets = newmap;
    }

    handleSheetId(param) {
        return (this.map.has(param) ? this.map.get(param).id : param);
    }

    async getSubsheets(name) {
        return [...this.map.get(name).sheets.keys()];
    }

    async add(sheetname,subsheetname,row) {
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        let requests = [];

        let mappedrow = row.map((x) => {
            if(typeof x === "string") {
                return {
                    userEnteredValue: {
                        stringValue: x
                    }
                }
            } else if(typeof x === "number") {
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

    async bulkAdd(sheetname, subsheetname, rows) {
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        let requests = [];

        let mappedrows = rows.map((y) => {
            return {
                values: y.map((x) => {
                    if(typeof x === "string") {
                        return {
                            userEnteredValue: {
                                stringValue: x
                            }
                        }
                    } else if(typeof x === "number") {
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

    async updateRow(sheetname, subsheetname, row, num) {
        let requests = [];
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        let mappedrow = row.map((x) => {
            if(typeof x === "string") {
                return {
                    userEnteredValue: {
                        stringValue: x
                    }
                }
            } else if(typeof x === "number") {
                return {
                    userEnteredValue: {
                        numberValue: x
                    }
                }
            }
        })

        requests.push({
            updateCells: {
                rows: [{values: mappedrow }],
                fields: "*",
                range: {
                    "sheetId": subsheetid,
                    "startRowIndex": num,
                    "endRowIndex": num+1,
                    "startColumnIndex": 0,
                    "endColumnIndex": row.length
                },
            }
        })

        await this.executeRequest(sheetname, requests);
    }

    /**
     * 
     * @param {string} sheetname 
     * @param {string} subsheetname 
     * @param {{row: string[], num: number}[]} data 
     */
    async bulkUpdateRows(sheetname, subsheetname, data) {
        let requests = [];
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);

        for(const obj of data){

            let row = obj.row;
            let num = obj.num;

            let mappedrow = row.map((x) => {
                if(typeof x === "string") {
                    return {
                        userEnteredValue: {
                            stringValue: x
                        }
                    }
                } else if(typeof x === "number") {
                    return {
                        userEnteredValue: {
                            numberValue: x
                        }
                    }
                }
            })

            requests.push({
                updateCells: {
                    rows: [{values: mappedrow }],
                    fields: "*",
                    range: {
                        "sheetId": subsheetid,
                        "startRowIndex": num,
                        "endRowIndex": num+1,
                        "startColumnIndex": 0,
                        "endColumnIndex": row.length
                    },
                }
            })

        }       
        
        await this.executeRequest(sheetname, requests);
    }

    newRow(oldrow,newrow,rowcheck) {
        for(let i = 0; i < rowcheck.length; i++) {
            if(rowcheck[i] === true) { // It matters!
                // Don't change anything
            } else if(rowcheck[i] === "KEEP") {
                // Don't change anything
            } else if(rowcheck[i] === "CHANGE") {
                oldrow[i] = newrow[i];
            } else if(typeof rowcheck[i] === "function") {
                oldrow[i] = rowcheck[i](oldrow[i], newrow[i]);
            }
        }
        return oldrow;
    }

    async addWithoutDuplicates(sheetname, subsheetname, row, check) {
        let rows = await this.readSheet(sheetname, subsheetname);

        let duplicate = false;
        for(let i = 1; i < rows.length; i++) {
            let currrow = rows[i];
            let currisduplicate = true;
            for(let j = 0; j < check.length; j++) {
                if(check[j] === true) {
                    if(currrow[j] !== row[j]) {
                        currisduplicate = false;
                    }
                }
            }
            if(currisduplicate) {
                duplicate = true;
                await this.updateRow(sheetname, subsheetname, this.newRow(currrow.slice(0,row.length),row,check), i);
            }
        }

        if(!duplicate) {
            await this.add(sheetname,subsheetname,row);
        }
    }

    async bulkAddWithoutDuplicates(sheetname, subsheetname, addrows, check) {
        let changes = new Map();
        let rows = await this.readSheet(sheetname, subsheetname);
        let newrows = [];

        for(const row of addrows) {
            let duplicate = false;
            for(let i = 1; i < rows.length+newrows.length; i++) {

                let currrow;

                if(i >= rows.length) currrow = newrows[i - rows.length];
                else currrow = rows[i];

                if(changes.has(i)) currrow = changes.get(i);
                let currisduplicate = true;
                for(let j = 0; j < check.length; j++) {
                    if(check[j] === true) {
                        if(currrow[j] !== row[j]) {
                            currisduplicate = false;
                        }
                    }
                }
                if(currisduplicate) {

                    duplicate = true;
                    if(i < rows.length) {
                        changes.set(i, this.newRow(currrow.slice(0,row.length), row, check));
                    } else {
                        newrows[i - rows.length] = this.newRow(currrow.slice(0,row.length), row, check);
                    }
                    
                }
            }
            if(!duplicate) {
                newrows.push(row);
            }
        }

        await this.bulkAdd(sheetname, subsheetname, newrows);
        for(const key of changes.keys()){
            await this.updateRow(sheetname, subsheetname, changes.get(key), key);
        }

    }

    async getSpreadsheetInfo(name) {
        name = this.handleSheetId(name);
        return await this.sheets.spreadsheets.get({ spreadsheetId: name });
    }

    async readSheet(sheetname,subsheetname,range) {
        let info = this.map.get(sheetname);
        let res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: info.id,
            range: range ? `${subsheetname}!${range}` : subsheetname
        })
        return res.data.values;
    }

    async createSubsheet(sheetname,subsheetname,format) {
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
        await this.SetUpSheet(sheetname);
        await this.formatSubsheet(sheetname,subsheetname,format);
    }

    async formatSubsheet(sheetname,subsheetname,format) {
        let requests = [];
        let subsheetid = this.map.get(sheetname).sheets.get(subsheetname);
        
        if(format.columnResize) {
            for(let i = 0; i < format.columnResize.length; i++) {
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

        
        if(format.headers) {
            let headermap = format.headers.map((x) => {
            return {
                userEnteredValue: {
                    stringValue: x
                }
            }});

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
            requests.push( {
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
        
        this.executeRequest(sheetname, requests);
        
    }

    async executeRequest(sheetname,requests) {
        if(requests.length === 0) return;
        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.map.get(sheetname).id,
            resource: { requests },
        });
    }
}

module.exports = {SheetsUser};