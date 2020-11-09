const { 
    TonyBotDB,
    UserObj,
    UserUnitObj,
    UserTRG,
    UserCheckpoint
} = require("./TonyBotDB");

let moment = require("moment-timezone");

class TonyBotAccountant extends TonyBotDB {
    /**
     * @constructor
     * @param {FirebaseFirestore.Firestore} db
     */
    constructor(db) {
        super(db);

        this.TRGEXP = [100,35,50]
        this.CHECKPOINTEXP = (pts) => 5*pts;

        this.expEq = (exp, currexp) => {
            return exp * (1 + Math.pow(currexp/100, 0.25));
        }
        
        this.TRGmons = [50,20,25];
        this.CHECKPOINTmons = 40;
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

}

module.exports = {TonyBotAccountant};