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
     * @param {boolean} data.COMPLETE
     */
    constructor(data) {
        this.SECTIONS = data.SECTIONS;
        this.SECTIONTIMESTAMPS = data.SECTIONTIMESTAMPS;
        this.COMPLETE = data.COMPLETE;
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

        this.rankEq = (exp) => {
            return Math.ceil(Math.sqrt(exp/50));
        }
        this.RANK = this.rankEq(this.EXP);
    }

    /**
     * @param {Object} data
     * @param {string} data.LC 
     * @param {string} data.EXP 
     */
    async update(data) {
        this.LC = parseInt(data.LC);
        this.EXP = parseInt(data.EXP);
        this.RANK = this.rankEq(this.EXP);
        await this.ref.set(data);
    }

    /**
     * 
     * @param {number} LC 
     * @param {number} EXP 
     */
    async increment(LC,EXP) {
        this.update({
            LC: this.LC + LC,
            EXP: this.EXP + EXP
        })
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

class TRG {
    /**
     * 
     * @param {Object} data 
     * @param {string} data.TITLE
     * @param {string} data.DUE
     * @param {string} data.DESCRIPTION
     * @param {string} data.CATEGORY
     * @param {boolean} data.GRADED
     * @param {?string} data.SUBMITURL
     * @param {?string} data.OTHERURL
     * @param {?string} data.DOCURL
     * @param {?number} data.POINTS
     */
    constructor(data){

        const { TITLE, DUE, DESCRIPTION, CATEGORY, GRADED, SUBMITURL, OTHERURL, DOCURL, POINTS } = data;
        this.TITLE = TITLE;
        this.DUE = DUE;
        this.DESCRIPTION = DESCRIPTION;
        this.GRADED = GRADED;
        this.CATEGORY = CATEGORY;
        this.SUBMITURL = SUBMITURL;
        this.OTHERURL = OTHERURL;
        this.DOCURL = DOCURL;
        this.POINTS = POINTS;

    }
}

class Checkpoint {
    /**
     * 
     * @param {Object} data 
     * @param {string} data.TITLE
     * @param {string} data.DUE
     * @param {string} data.CATEGORY
     * @param {boolean} data.GRADED
     * @param {?string} data.SUBMITURL
     * @param {?number} data.POINTS
     */
    constructor(data){

        const { TITLE, DUE, CATEGORY, GRADED, POINTS } = data;
        this.TITLE = TITLE;
        this.DUE = DUE;
        this.GRADED = GRADED;
        this.CATEGORY = CATEGORY;
        this.POINTS = POINTS;

    }
}

class UnitObj {
    /**
     * 
     * @param {Object} data 
     * @param {string} data.TITLE
     * @param {string} data.LINK
     * @param {?string} data.CALENDAR
     * @param {?string} data.DISCUSSION
     * @param {?string} data.SLIDES
     * @param {FirebaseFirestore.DocumentReference} ref 
     */
    constructor(data,ref){
        this.ref = ref;
        this.id = this.ref.id;

        const { TITLE, LINK, CALENDAR, DISCUSSION, SLIDES } = data;
        this.TITLE = TITLE;
        this.LINK = LINK;
        this.CALENDAR = CALENDAR;
        this.DISCUSSION = DISCUSSION;
        this.SLIDES = SLIDES;

        /**
         * @type {Map<string,TRG>}
         */
        this.TRGS = new Map();

        /**
         * @type {Map<string,Checkpoint>}
         */
        this.CHECKPOINTS = new Map();
    }

    DATA() {
        return {
            TITLE: this.TITLE,
            LINK: this.LINK,
            CALENDAR: this.CALENDAR,
            DISCUSSION: this.DISCUSSION,
            SLIDES: this.SLIDES
        }
    }

    /**
     * @async
     */
    async onConstruct(){
        let checkpoints = await this.ref.collection("CHECKPOINTS").get();
        for(const checkpoint of checkpoints.docs) {
            this.CHECKPOINTS.set(checkpoint.id, new Checkpoint(checkpoint.data()));
        }
        let TRGS = await this.ref.collection("TRGS").get();
        for(const trg of TRGS.docs) {
            this.TRGS.set(trg.id, new TRG(trg.data()));
        }
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

        /**
         * @type {Map<string,UnitObj>}
         */
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

        this.units = new Map();

        let units = await this.key.collection("UNITS").get();
        for(const unit of units.docs) {
            this.units.set(unit.id, new UnitObj(unit.data(), this.key.collection("UNITS").doc(unit.id)));
            await this.units.get(unit.id).onConstruct();
        }

    }

    now() {
        return moment.tz("America/Los_Angeles").format();
    }

    formatTime(t) {
        return moment.tz(t, "America/Los_Angeles").format("MM/DD h:mm:ss a")
    }

    /* EXISTENCE */

    /* GLOBAL */
    unitExists(unit) {
        unit = "" + unit;
        return this.units.has(unit);
    }

    TRGExists(unit, num) {
        unit = "" + unit;
        num = "" + num;
        return this.unitExists(unit) && this.units.get(unit).TRGS.has(num);
    }

    CheckpointExists(unit, num) {
        unit = "" + unit;
        num = "" + num;
        return this.unitExists(unit) && this.units.get(unit).CHECKPOINTS.has(num);
    }

    /* USERS */
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
        id = ""+id;
        return this.users.get(id);
    }

    async getUserUnit(id, unit) {
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

    async setUnit(unit,data) {
        unit = "" + unit
        await this.key.collection("UNITS").doc(unit).set(data);
        this.units.set(unit, new UnitObj(data, this.key.collection("UNITS").doc(unit)));
    }

    async setTRG(unit, num, data) {
        unit = "" + unit;
        num = "" + num;
        await this.key.collection("UNITS").doc(unit).collection("TRGS").doc(num).set(data);
        this.units.get(unit).TRGS.set(num, new TRG(data));
    }

    async setCheckpoint(unit, num, data) {
        unit = "" + unit;
        num = "" + num;
        await this.key.collection("UNITS").doc(unit).collection("CHECKPOINTS").doc(num).set(data);
        this.units.get(unit).CHECKPOINTS.set(num, new Checkpoint(data));
    }


    /* TOP LEVEL */

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
            await this.setTRG(unit,trgnum,data);
        }

        return changes;

    }

    async setCheckpointInfo(unit, num, data) {

        let currdata = this.units.get(unit + "").CHECKPOINTS.get(num + "");

        const changes = this.differences(currdata, data);

        if (Object.keys(changes).length > 0) {
            await this.setCheckpoint(unit,num,data);
        }

        return changes;

    }

    async setUnitInfo(unit, data) {
        let currdata = this.units.get(unit + "").DATA();

        const changes = this.differences(currdata, data);

        if (Object.keys(changes).length > 0) {
            await this.setUnit(unit, data);
        }

        return changes;
    }

}

module.exports = {
    TonyBotDB,
    UserObj,
    UserUnitObj,
    UserTRG,
    UserCheckpoint
};