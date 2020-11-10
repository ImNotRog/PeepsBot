let moment = require("moment-timezone");

const {
    UserObj,
    UserUnitObj,
    UserTRG,
    UserCheckpoint,
    TRG,
    Checkpoint,
    UnitObj
} = require("./tonyclasses");

const {Utilities} = require("./Utilities");

class TonyBotDB extends Utilities {
    /**
     * @constructor
     * @param {FirebaseFirestore.Firestore} db
     */
    constructor(db) {
        super();
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
        return this.users.has(id) && this.users.get(id).UNITS.has(unit) && this.users.get(id).UNITS.get(unit).TRGS.has(num);
    }

    async checkpointExistsForUser(id, unit, num) {
        id = ""+id;
        unit = ""+unit;
        num = ""+num;
        return this.users.has(id) && this.users.get(id).UNITS.has(unit) && this.users.get(id).UNITS.get(unit).CHECKPOINTS.has(num);
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
        id = ""+id;
        unit = ""+unit;
        num = ""+num;
        await this.setTRGForUser(id,unit,num,{
            SECTIONS: [false, false, false],
            SECTIONTIMESTAMPS: [this.now(), this.now(), this.now()],
            COMPLETE: false
        });
    }

    async createCheckpointForUser(id, unit, num) {
        id = ""+id;
        unit = ""+unit;
        num = ""+num;
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

    async createUnit(unit, data) {
        unit = "" + unit
        await this.key.collection("UNITS").doc(unit).set(data);
        this.units.set(unit, new UnitObj(data,this.key.collection("UNITS").doc(unit)));
        await this.units.get(unit).onConstruct();
    }

    async setUnit(unit,data) {
        unit = "" + unit
        await this.key.collection("UNITS").doc(unit).set(data);
        this.units.get(unit).setData(data);
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
            if (obj1[key] !== obj2[key] && obj2[key]) {
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
    TonyBotDB
};