
let moment = require("moment-timezone");

class TonyBotDB {
    /**
     * @constructor
     * @param {FirebaseFirestore.Firestore} db
     */
    constructor(db) {
        this.db = db;
        this.base = this.db.collection("PeepsBot");
        this.key = this.base.doc("KEY");
        this.sectionTitles = ["Take Notes", "Applying the Concepts", "Summary"]
        this.units = new Map();
    }

    async onConstruct() {
        await this.refreshUnits();
    }

    /* ACCESSORS */

    async refreshUnits() {
        let units = (await this.key.collection("UNITS").get());

        let tofind = units.docs.map(doc => doc.id);

        // Create all the units, if they don't exist
        for(const key of tofind) {
            if(!this.units.has(key)) {
                this.units.set(key, {});
            }
        }

        // let data = units.docs.map(doc => doc.data());
        for(const datum of units.docs) {
            let existing = this.units.get(datum.id);
            this.units.set(datum.id, {
                ...existing,
                DATA: datum.data()
            })
        }

        let alltrgs = [];
        let allcheckpoints = [];
        for(const key of tofind) {
            alltrgs.push(this.key.collection("UNITS").doc(key).collection("TRGS").get());
            allcheckpoints.push(this.key.collection("UNITS").doc(key).collection("CHECKPOINTS").get())
        }
        
        allcheckpoints = await Promise.all(allcheckpoints);
        alltrgs = await Promise.all(alltrgs);

        for(let i = 0; i < alltrgs.length; i++) {
            let currTRGMap = new Map();
            let currCheckpointMap = new Map();

            for(let j = 0; j < alltrgs[i].docs.length; j++){
                currTRGMap.set(alltrgs[i].docs[j].id,alltrgs[i].docs[j].data());
            }

            for(let j = 0; j < allcheckpoints[i].docs.length; j++){
                currCheckpointMap.set(allcheckpoints[i].docs[j].id, allcheckpoints[i].docs[j].data());
            }

            this.units.get(tofind[i]).TRGS = currTRGMap;
            this.units.get(tofind[i]).CHECKPOINTS = currCheckpointMap;
        }

    }

    async refreshUnit(unit) {

        if(!this.units.has(unit+"")) {
            this.units.set(unit+"", {});
        }

        let alltrgs = (await this.key.collection("UNITS").doc(unit+"").collection("TRGS").get());
        let allcheckpoints = (await this.key.collection("UNITS").doc(unit+"").collection("CHECKPOINTS").get());
        let currTRGMap = new Map();
        let currCheckpointMap = new Map();
        for(let i = 0; i < alltrgs.docs.length; i++) {
            currTRGMap.set(alltrgs.docs[i].id, alltrgs.docs[i].data());
        }
        for(let i = 0; i < allcheckpoints.docs.length; i++) {
            currCheckpointMap.set(allcheckpoints.docs[i].id, allcheckpoints.docs[i].data());
        }

        this.units.get(unit+"").TRGS = currTRGMap;
        this.units.get(unit+"").CHECKPOINTS = currCheckpointMap;
    }

    now() {
        return moment.tz("America/Los_Angeles").format();
    }

    formatTime(t){
        return moment.tz(t, "America/Los_Angeles").format("MM/DD h:mm:ss a")
    }

    /* EXISTENCE */

    unitExists(unit) {
        if(this.units.get(unit+"")){
            return true;
        }
        return false;
    }

    TRGExists(unit, num) {
        return this.unitExists(unit) && this.units.get(unit+"").TRGS.has(num + "");
    }

    CheckpointExists(unit, num) {
        return this.unitExists(unit) && this.units.get(unit+"").CHECKPOINTS.has(num + "");
    }

    async userExists(id) {
        return (await this.base.doc(id + "").get()).exists;
    }

    async unitExistsForUser(id,unit){
        return (await this.base.doc("" + id).collection("UNITS").doc(unit + "").get()).exists;
    }

    async TRGExistsForUser(id,unit,num) {
        return (await this.base.doc("" + id).collection("UNITS").doc(unit + "")
            .collection("TRGS").doc(num+"").get()).exists;
    }

    async checkpointExistsForUser(id,unit,num) {
        return (await this.base.doc("" + id).collection("UNITS").doc(unit + "")
            .collection("CHECKPOINTS").doc(num+"").get()).exists;
    }

    /* GETTING */

    async getUser(id) {
        return (await this.base.doc(id + "").get()).data();
    }

    async getUserUnit(id, unit) {
        return (await this.base.doc("" + id).collection("UNITS").doc(unit + "").get()).data();
    }

    async getUserTRG(id,unit,num) {
        return (await this.base.doc("" + id).collection("UNITS").doc(unit + "")
            .collection("TRGS").doc(num+"").get()).data();
    }

    async getUserCheckpoint(id,unit,num) {
        return (await this.base.doc("" + id).collection("UNITS").doc(unit + "")
            .collection("CHECKPOINTS").doc(num+"").get()).data();
    }

    /* MODIFIERS */

    /* LOW LEVEL */

    /* FOR USER */

    async createUser(id) {
        await this.base.doc("" + id).set({
            LC: 0,
            RANK: 0
        })
    }

    async createUnitForUser(id, unit) {

        await this.base.doc("" + id).collection("UNITS").doc(unit + "").set({
            COMPLETE: false
        })

    }

    async createTRGForUser(id, unit, trgnum) {
        await this.base.doc("" + id).collection("UNITS").doc(unit + "").collection("TRGS").doc(trgnum + "").set({
            SECTIONS: [false,false,false],
            SECTIONTIMESTAMPS: [this.now(),this.now(),this.now()],
            COMPLETE: false
        })
    }

    async createCheckpointForUser(id,unit,num) {
        await this.base.doc("" + id).collection("UNITS").doc(unit + "").collection("CHECKPOINTS").doc(num + "").set({
            COMPLETE: false,
            TIMESTAMP: this.now()
        });
    }

    async updateTRGForUser(id, unit, trgnum, data) {
        await this.base.doc("" + id).collection("UNITS").doc(unit + "").collection("TRGS").doc(trgnum + "").update(data);
    }

    /* FOR GLOBAL */

    async createUnit(unit) {
        await this.key.collection("UNITS").doc(""+unit).set({
            
        });
        await this.refreshUnit(unit);
    }

    async createTRG(unit, trgnum) {
        await this.key.collection("UNITS").doc(""+unit).collection("TRGS").doc(""+trgnum).set({

        })
        await this.refreshUnit(unit);
    }

    async createCheckpoint(unit, num) {
        await this.key.collection("UNITS").doc(""+unit).collection("CHECKPOINTS").doc(""+num).set({
        })
        await this.refreshUnit(unit);
    }


    /* TOP LEVEL */

    async updateTRG(id, unit, trgnum, completedArr) {
        const pTRG = await this.getUserTRG(id,unit,trgnum);
        let pSections = pTRG.SECTIONS;
        let pSectionTimestamps = pTRG.SECTIONTIMESTAMPS;
        
        let CHANGEDARRAY = [];
        let CHANGED = false;
        for(let i = 0; i < pSections.length; i++) {
            if(!pSections[i] && completedArr[i]) {
                CHANGEDARRAY.push(true);
                pSectionTimestamps[i] = (this.now());
                pSections[i] = true;
                CHANGED = true;
            } else {
                CHANGEDARRAY.push(false);
            }
        }

        let completed = pSections.reduce( (a,n) => a && n);

        if(CHANGED) {
            this.updateTRGForUser(id,unit,trgnum, {
                SECTIONS: pSections,
                SECTIONTIMESTAMPS: pSectionTimestamps,
                COMPLETE: completed
            })
        }

        return {
            CHANGED,
            CHANGEDARRAY
        }
    }

    differences(obj1, obj2) {
        let keys1 = Object.keys(obj1);
        let keys2 = Object.keys(obj2);

        for(let i = 0; i < keys2.length; i++) {
            if(keys1.indexOf( keys2[i] ) === -1 ){
                keys1.push(keys2[i]);
            }
        }

        const changes = {};
        for(const key of keys1) {
            if(obj1[key] !== obj2[key]) {
                changes[key] = [obj1[key], obj2[key]];
            }
        }

        return changes;
    }

    async setTRGinfo(unit, trgnum, data){

        let currdata = this.units.get(unit+"").TRGS.get(trgnum+"");

        const changes = this.differences(currdata,data);

        if(Object.keys(changes).length > 0){
            await this.key.collection("UNITS").doc(""+unit).collection("TRGS").doc(""+trgnum).set(data);
            this.units.get(unit+"").TRGS.set(trgnum+"", data) 
        }

        return changes;

    }

    async setCheckpointInfo(unit, num, data){

        let currdata = this.units.get(unit+"").CHECKPOINTS.get(num+"");

        const changes = this.differences(currdata,data);

        if(Object.keys(changes).length > 0){
            await this.key.collection("UNITS").doc(""+unit).collection("CHECKPOINTS").doc(""+num).set(data);
            this.units.get(unit+"").CHECKPOINTS.set(num+"", data) 
        }

        return changes;
        
    }

    async setUnitInfo(unit,data) {
        let currdata = this.units.get(unit+"").DATA;

        const changes = this.differences(currdata,data);

        if(Object.keys(changes).length > 0){
            await this.key.collection("UNITS").doc(""+unit).set(data);
            this.units.get(unit+"").DATA = data; 
        }

        return changes;
    }

}

module.exports = {TonyBotDB};