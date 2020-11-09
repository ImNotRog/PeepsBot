const { 
    TonyBotDB
} = require("./TonyBotDB");

const {
    UserObj,
    UserUnitObj,
    UserTRG,
    UserCheckpoint,
    TRG,
    Checkpoint,
    UnitObj
} = require("./tonyclasses");

let moment = require("moment-timezone");

class TonyBotAccountant extends TonyBotDB {
    /**
     * @constructor
     * @param {FirebaseFirestore.Firestore} db
     */
    constructor(db) {
        super(db);

        this.TRGEXP = [100,35,50]
        this.CHECKPOINTEXPPERPT = 5;

        this.expEq = (exp, currexp) => {
            return exp * (1 + Math.pow(currexp/100, 0.25));
        }
        
        this.TRGmons = [50,20,25];
        this.CHECKPOINTmons = 40;
    }

    async completeUsers(){
        let promises = [];
        for(const userkey of this.users.keys()) {
            promises.push( this.completeUser(userkey) );
        }
        await Promise.all(promises);
    }

    async completeUser(userkey) {
        const user = this.users.get(userkey);
        
        for(const unitkey of this.units.keys()) {

            if(!(await this.unitExistsForUser(userkey,unitkey))) {
                await this.createUnitForUser(userkey,unitkey);
            }

            const userunit = user.UNITS.get(unitkey);
            const unit = this.units.get(unitkey);

            for(const trgkey of unit.TRGS.keys()) {

                if(!(await this.TRGExistsForUser(userkey, unitkey, trgkey))){
                    await this.createTRGForUser(userkey, unitkey, trgkey);
                }

                const usertrg = userunit.TRGS.get(trgkey);
                const trg = unit.TRGS.get(trgkey);
                if(trg.GRADED && !usertrg.COMPLETE) {
                    const data = await this.updateTRG(userkey,unitkey,trgkey, [true,true,true]);
                }
            }

            for(const checkpointkey of unit.CHECKPOINTS.keys()) {

                if(!(await this.checkpointExistsForUser(userkey, unitkey, checkpointkey))){
                    await this.createCheckpointForUser(userkey, unitkey, checkpointkey);
                }

                const usercheckpoint = userunit.CHECKPOINTS.get(checkpointkey);
                const checkpoint = unit.CHECKPOINTS.get(checkpointkey);
                if(checkpoint.GRADED && !usercheckpoint.COMPLETE) {
                    const data = await this.updateCheckpoint(userkey, unitkey, checkpointkey, true);
                }
            }
        }
    }

    async createUser(id) {
        await super.createUser(id);
        await this.completeUser(id);
    }

    /**
     * @param {moment.Moment}
     * @returns {number}
     */
    timediff(momentobj) {
        let now = moment.tz("America/Los_Angeles");
        return momentobj.diff(now, 'days');
    }

    strToMomentObj(str) {
        return moment.tz(str, "America/Los_Angeles");
    }

    /**
     * 
     * @param {*} user 
     * @param {UserTRG} userTRG 
     */
    calcTRG(id, unit, num, justcompleted) {
        unit = "" + unit;
        num = "" + num;
        let due = this.units.get(unit).TRGS.get(num).DUE;
        let daysdiff = this.timediff(this.strToMomentObj(due));

        let userobj = this.users.get(id);
        let earned = 0;
        let earnedexp = 0;
        for(let i = 0; i < this.TRGmons.length; i++){
            earned += justcompleted[i] * this.TRGmons[i];
            earnedexp += justcompleted[i] * this.expEq(this.TRGEXP[i],userobj.EXP);
        }

        if(daysdiff > 2) {
            earned *= 1.35;
            earnedexp *= 1.35;
        }
        earned = Math.round(earned);
        earnedexp = Math.round(earnedexp);

        return {
            USER: userobj,
            EARNED: earned,
            EXP: earnedexp
        }
    }

    /**
     * 
     * @param {string} id 
     * @param {string} unit 
     * @param {string} num 
     * @param {boolean} justcompleted 
     */
    calcCheckpoint(id, unit, num, justcompleted) {
        unit = "" + unit;
        num = "" + num;
        const checkpoint = this.units.get(unit).CHECKPOINTS.get(num)
        const due = checkpoint.DUE;
        let daysdiff = this.timediff(this.strToMomentObj(due));

        let userobj = this.users.get(id);
        let earned = justcompleted * this.CHECKPOINTmons;
        let earnedexp = justcompleted * this.expEq( this.CHECKPOINTEXPPERPT * checkpoint.POINTS, userobj.EXP );

        if(daysdiff > 2) {
            earned *= 1.35;
            earnedexp *= 1.35;
        }

        earned = Math.round(earned);
        earnedexp = Math.round(earnedexp);

        return {
            USER: userobj,
            EARNED: earned,
            EXP: earnedexp
        }
    }

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
            await this.setTRGForUser(id, unit, trgnum, {
                SECTIONS: pSections,
                SECTIONTIMESTAMPS: pSectionTimestamps,
                COMPLETE: completed
            })
        }

        const data = this.calcTRG(id, unit, trgnum, CHANGEDARRAY);
        await data.USER.increment(data.EARNED,data.EXP);

        return {
            CHANGED,
            CHANGEDARRAY,
            ...data
        }
    }

    async updateCheckpoint(id, unit, num, complete) {
        complete = complete || true;
        const pCheckpoint = await this.getUserCheckpoint(id, unit, num);
        let CHANGED = false;
        const CHANGEDARRAY = [pCheckpoint.COMPLETE,complete];
        if( !pCheckpoint.COMPLETE && complete ) {
            CHANGED = true;
            await this.setCheckpointForUser(id, unit, num, {
                COMPLETE: complete,
                TIMESTAMP: this.now()
            })
        }

        const data = this.calcCheckpoint(id, unit, num, CHANGED);
        await data.USER.increment(data.EARNED,data.EXP);

        return {
            CHANGED,
            CHANGEDARRAY,
            ...data
        }

    }

}

module.exports = {TonyBotAccountant};