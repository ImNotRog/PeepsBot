let moment = require("moment-timezone");

class UserCheckpoint {
    /**
     * @param {Object} data 
     * @param {boolean} data.COMPLETE
     * @param {String} data.TIMESTAMP
     */
    constructor(data) {
        this.COMPLETE = data.COMPLETE;
        this.TIMESTAMP = data.TIMESTAMP;
    }
}

class UserTRG {
    /**
     * @constructor
     * @param {Object} data
     * @param {boolean[]} data.SECTIONS
     * @param {string[]} data.SECTIONTIMESTAMPS
     */
    constructor(data) {
        this.SECTIONS = data.SECTIONS;
        this.SECTIONTIMESTAMPS = data.SECTIONTIMESTAMPS;
    }
}

class UserUnitObj {
    /**
     * 
     * @param {Object} data 
     * @param {boolean} data.COMPLETE
     * @param {FirebaseFirestore.DocumentReference} ref 
     */
    constructor(data,ref){
        this.COMPLETE = data.COMPLETE;
        this.ref = ref;
        this.id = this.ref.id;

        /**
         * @type {Map<string,UserCheckpoint>}
         */
        this.CHECKPOINTS = new Map();

         /**
         * @type {Map<string,UserTRG>}
         */
        this.TRGS = new Map();
    }

    /**
     * @param {Object} data 
     * @param {boolean} data.COMPLETE
     */
    async update(data) {
        this.COMPLETE = data.COMPLETE;
        await this.ref.set(data);
    }

    async onConstruct() {
        let checkpoints = await this.ref.collection("CHECKPOINTS").get();
        for(const checkpoint of checkpoints.docs) {
            this.CHECKPOINTS.set(checkpoint.id, new UserCheckpoint(checkpoint.data()));
        }
        let TRGS = await this.ref.collection("TRGS").get();
        for(const trg of TRGS.docs) {
            this.TRGS.set(trg.id, new UserTRG(trg.data()));
        }
    }
}

class UserObj {
    /**
     * @param {Object} data
     * @param {string} data.LC 
     * @param {string} data.EXP 
     * @param {FirebaseFirestore.DocumentReference} ref
     */
    constructor(data,ref) {
        this.LC = parseInt(data.LC);
        this.EXP = parseInt(data.EXP);

        /**
         * @type {Map<string,UserUnitObj>}
         */
        this.UNITS = new Map();

        this.ref = ref;
        this.id = this.ref.id;
    }

    /**
     * @param {Object} data
     * @param {string} data.LC 
     * @param {string} data.EXP 
     */
    async update(data) {
        this.LC = parseInt(data.LC);
        this.EXP = parseInt(data.EXP);
        await this.ref.set(data);
    }

    /**
     * @async
     */
    async onConstruct(){
        let units = await this.ref.collection("UNITS").get();
        for(const unit of units.docs) {
            this.UNITS.set(unit.id, new UserUnitObj(unit.data(), this.ref.collection("UNITS").doc(unit.id)));
            await this.UNITS.get(unit.id).onConstruct();
        }
        return this;
    }
}

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

        /**
         * @type {Map<string,UserObj>}
         */
        this.users = new Map();
    }

    async onConstruct() {
        await this.refreshUnits();
        await this.refreshUsers();
    }

    /* ACCESSORS */

    /**
     * @async
     * @todo Make it faster using Promise.all
     */
    async refreshUsers() {
        this.users = new Map();
        let allusers = await this.base.get();
        for(const user of allusers.docs) {
            if(user.id === "KEY") continue;
            this.users.set(user.id, new UserObj(user.data(), this.base.doc(user.id)));
            await this.users.get(user.id).onConstruct();
        }
    }

    async refreshUnits() {
        let units = (await this.key.collection("UNITS").get());

        let tofind = units.docs.map(doc => doc.id);

        // Create all the units, if they don't exist
        for (const key of tofind) {
            if (!this.units.has(key)) {
                this.units.set(key, {});
            }
        }

        // let data = units.docs.map(doc => doc.data());
        for (const datum of units.docs) {
            let existing = this.units.get(datum.id);
            this.units.set(datum.id, {
                ...existing,
                DATA: datum.data()
            })
        }

        let alltrgs = [];
        let allcheckpoints = [];
        for (const key of tofind) {
            alltrgs.push(this.key.collection("UNITS").doc(key).collection("TRGS").get());
            allcheckpoints.push(this.key.collection("UNITS").doc(key).collection("CHECKPOINTS").get())
        }

        allcheckpoints = await Promise.all(allcheckpoints);
        alltrgs = await Promise.all(alltrgs);

        for (let i = 0; i < alltrgs.length; i++) {
            let currTRGMap = new Map();
            let currCheckpointMap = new Map();

            for (let j = 0; j < alltrgs[i].docs.length; j++) {
                currTRGMap.set(alltrgs[i].docs[j].id, alltrgs[i].docs[j].data());
            }

            for (let j = 0; j < allcheckpoints[i].docs.length; j++) {
                currCheckpointMap.set(allcheckpoints[i].docs[j].id, allcheckpoints[i].docs[j].data());
            }

            this.units.get(tofind[i]).TRGS = currTRGMap;
            this.units.get(tofind[i]).CHECKPOINTS = currCheckpointMap;
        }

    }

    async refreshUnit(unit) {

        if (!this.units.has(unit + "")) {
            this.units.set(unit + "", {});
        }

        let alltrgs = (await this.key.collection("UNITS").doc(unit + "").collection("TRGS").get());
        let allcheckpoints = (await this.key.collection("UNITS").doc(unit + "").collection("CHECKPOINTS").get());
        let currTRGMap = new Map();
        let currCheckpointMap = new Map();
        for (let i = 0; i < alltrgs.docs.length; i++) {
            currTRGMap.set(alltrgs.docs[i].id, alltrgs.docs[i].data());
        }
        for (let i = 0; i < allcheckpoints.docs.length; i++) {
            currCheckpointMap.set(allcheckpoints.docs[i].id, allcheckpoints.docs[i].data());
        }

        this.units.get(unit + "").TRGS = currTRGMap;
        this.units.get(unit + "").CHECKPOINTS = currCheckpointMap;
    }

    now() {
        return moment.tz("America/Los_Angeles").format();
    }

    formatTime(t) {
        return moment.tz(t, "America/Los_Angeles").format("MM/DD h:mm:ss a")
    }

    /* EXISTENCE */

    unitExists(unit) {
        if (this.units.get(unit + "")) {
            return true;
        }
        return false;
    }

    TRGExists(unit, num) {
        return this.unitExists(unit) && this.units.get(unit + "").TRGS.has(num + "");
    }

    CheckpointExists(unit, num) {
        return this.unitExists(unit) && this.units.get(unit + "").CHECKPOINTS.has(num + "");
    }

    async userExists(id) {
        return this.users.has(id + "");
    }

    async unitExistsForUser(id, unit) {
        return (await this.userExists(id)) && this.users.get(id+"").UNITS.has(""+unit);
    }

    async TRGExistsForUser(id, unit, num) {
        id = ""+id;
        unit = ""+unit;
        num = ""+num;
        return this.users.has(id) && this.users.get(id).UNITS.has(unit) && this.users.get(id).UNITS.get(unit).TRGS.get(num);
    }

    async checkpointExistsForUser(id, unit, num) {
        id = ""+id;
        unit = ""+unit;
        num = ""+num;
        return this.users.has(id) && this.users.get(id).UNITS.has(unit) && this.users.get(id).UNITS.get(unit).CHECKPOINTS.get(num);
    }

    /* GETTING */

    async getUser(id) {
        // return (await this.base.doc(id + "").get()).data();
        id = ""+id;
        return this.users.get(id);
    }

    async getUserUnit(id, unit) {
        // return (await this.base.doc("" + id).collection("UNITS").doc(unit + "").get()).data();
        id = ""+id;
        unit = ""+unit;
        return this.users.get(id).UNITS.get(unit);
    }

    async getUserTRG(id, unit, num) {
        id = ""+id;
        unit = ""+unit;
        num = ""+num;
        return this.users.get(id).UNITS.get(unit).TRGS.get(num);
    }

    async getUserCheckpoint(id, unit, num) {
        id = ""+id;
        unit = ""+unit;
        num = ""+num;
        return this.users.get(id).UNITS.get(unit).CHECKPOINTS.get(num);
    }

    /* MODIFIERS */

    /* LOW LEVEL */

    /* FOR USER */

    async createUser(id) {
        await this.base.doc("" + id).set({
            LC: 0,
            EXP: 0
        })
        this.users.set(""+id, new UserObj({
            LC: 0,
            EXP: 0
        }, this.base.doc(""+id)));
        await this.users.get(""+id).onConstruct();
    }

    async createUnitForUser(id, unit) {

        id = ""+id;
        unit = ""+unit;
        await this.base.doc(id).collection("UNITS").doc(unit).set({
            COMPLETE: false
        })
        this.users.get(id).UNITS.set(unit, new UserUnitObj({
            COMPLETE: false
        },this.base.doc(id).collection("UNITS").doc(unit)));
        await this.users.get(id).UNITS.get(unit).onConstruct();

    }

    async createTRGForUser(id, unit, num) {
        await this.setTRGForUser(id,unit,num,{
            SECTIONS: [false, false, false],
            SECTIONTIMESTAMPS: [this.now(), this.now(), this.now()],
            COMPLETE: false
        });
    }

    async createCheckpointForUser(id, unit, num) {
        await this.setCheckpointForUser(id,unit,num,{
            COMPLETE: false,
            TIMESTAMP: this.now()
        });
    }

    async setTRGForUser(id, unit, num, data) {
        id = ""+id;
        unit = ""+unit;
        num = ""+num;
        await this.base.doc(id).collection("UNITS").doc(unit).collection("TRGS").doc(num).set(data)
        this.users.get(id).UNITS.get(unit).TRGS.set(num, new UserTRG(data));
    }

    async setCheckpointForUser(id, unit, num, data) {
        id = ""+id;
        unit = ""+unit;
        num = ""+num;
        await this.base.doc(id).collection("UNITS").doc(unit).collection("CHECKPOINTS").doc(num).set(data)
        this.users.get(id).UNITS.get(unit).CHECKPOINTS.set(num, new UserCheckpoint(data));
    }

    /* FOR GLOBAL */

    async createUnit(unit) {
        await this.key.collection("UNITS").doc("" + unit).set({

        });
        await this.refreshUnit(unit);
    }

    async createTRG(unit, trgnum) {
        await this.key.collection("UNITS").doc("" + unit).collection("TRGS").doc("" + trgnum).set({

        })
        await this.refreshUnit(unit);
    }

    async createCheckpoint(unit, num) {
        await this.key.collection("UNITS").doc("" + unit).collection("CHECKPOINTS").doc("" + num).set({})
        await this.refreshUnit(unit);
    }


    /* TOP LEVEL */

    async updateTRG(id, unit, trgnum, completedArr) {
        const pTRG = await this.getUserTRG(id, unit, trgnum);
        let pSections = pTRG.SECTIONS;
        let pSectionTimestamps = pTRG.SECTIONTIMESTAMPS;

        let CHANGEDARRAY = [];
        let CHANGED = false;
        for (let i = 0; i < pSections.length; i++) {
            if (!pSections[i] && completedArr[i]) {
                CHANGEDARRAY.push(true);
                pSectionTimestamps[i] = (this.now());
                pSections[i] = true;
                CHANGED = true;
            } else {
                CHANGEDARRAY.push(false);
            }
        }

        let completed = pSections.reduce((a, n) => a && n);

        if (CHANGED) {
            this.setTRGForUser(id, unit, trgnum, {
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

        for (let i = 0; i < keys2.length; i++) {
            if (keys1.indexOf(keys2[i]) === -1) {
                keys1.push(keys2[i]);
            }
        }

        const changes = {};
        for (const key of keys1) {
            if (obj1[key] !== obj2[key]) {
                changes[key] = [obj1[key], obj2[key]];
            }
        }

        return changes;
    }

    async setTRGinfo(unit, trgnum, data) {

        let currdata = this.units.get(unit + "").TRGS.get(trgnum + "");

        const changes = this.differences(currdata, data);

        if (Object.keys(changes).length > 0) {
            await this.key.collection("UNITS").doc("" + unit).collection("TRGS").doc("" + trgnum).set(data);
            this.units.get(unit + "").TRGS.set(trgnum + "", data)
        }

        return changes;

    }

    async setCheckpointInfo(unit, num, data) {

        let currdata = this.units.get(unit + "").CHECKPOINTS.get(num + "");

        const changes = this.differences(currdata, data);

        if (Object.keys(changes).length > 0) {
            await this.key.collection("UNITS").doc("" + unit).collection("CHECKPOINTS").doc("" + num).set(data);
            this.units.get(unit + "").CHECKPOINTS.set(num + "", data)
        }

        return changes;

    }

    async setUnitInfo(unit, data) {
        let currdata = this.units.get(unit + "").DATA;

        const changes = this.differences(currdata, data);

        if (Object.keys(changes).length > 0) {
            await this.key.collection("UNITS").doc("" + unit).set(data);
            this.units.get(unit + "").DATA = data;
        }

        return changes;
    }

}

module.exports = {
    TonyBotDB
};