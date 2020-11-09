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

class DUE {
    constructor() {
        this.TITLE = "";
        this.DUE = "";
    };
    
    full() {
        return "OVERRIDE NOT AVAILABLE"
    }

    diff(unit){
        let time = moment.tz(this.DUE, "America/Los_Angeles")
        let diff = time.diff(moment.tz("America/Los_Angeles"), unit);
        return diff;
    }
}

class TRG extends DUE {
    /**
     * 
     * @param {Object} data 
     * @param {string} data.TITLE
     * @param {string} data.DUE
     * @param {string} data.DESCRIPTION
     * @param {string} data.CATEGORY
     * @param {number} data.UNIT
     * @param {number} data.NUM
     * @param {boolean} data.GRADED
     * @param {?string} data.SUBMITURL
     * @param {?string} data.OTHERURL
     * @param {?string} data.DOCURL
     * @param {?number} data.POINTS
     */
    constructor(data){

        super();
        const { TITLE, DUE, DESCRIPTION, CATEGORY, GRADED, SUBMITURL, OTHERURL, DOCURL, POINTS, UNIT, NUM } = data;
        this.TITLE = TITLE;
        this.DUE = DUE;
        this.DESCRIPTION = DESCRIPTION;
        this.GRADED = GRADED;
        this.CATEGORY = CATEGORY;
        this.SUBMITURL = SUBMITURL;
        this.OTHERURL = OTHERURL;
        this.DOCURL = DOCURL;
        this.POINTS = POINTS;
        this.UNIT = UNIT;
        this.NUM = NUM;
        
    }

    full(){
        return `TRG ${this.UNIT}-${this.NUM}: ${this.TITLE}`;
    }

}

class Checkpoint extends DUE {
    /**
     * 
     * @param {Object} data 
     * @param {string} data.TITLE
     * @param {string} data.DUE
     * @param {string} data.CATEGORY
     * @param {boolean} data.GRADED
     * @param {number} data.UNIT
     * @param {number} data.NUM
     * @param {?string} data.SUBMITURL
     * @param {?number} data.POINTS
     */
    constructor(data){

        super();
        const { TITLE, DUE, CATEGORY, GRADED, POINTS, UNIT, NUM  } = data;
        this.TITLE = TITLE;
        this.DUE = DUE;
        this.GRADED = GRADED;
        this.CATEGORY = CATEGORY;
        this.POINTS = POINTS;
        this.UNIT = UNIT;
        this.NUM = NUM;

    }

    full(){
        return `Checkpoint ${this.UNIT}-${this.NUM}: ${this.TITLE}`;
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

    setData(data){
        const { TITLE, LINK, CALENDAR, DISCUSSION, SLIDES } = data;
        this.TITLE = TITLE;
        this.LINK = LINK;
        this.CALENDAR = CALENDAR;
        this.DISCUSSION = DISCUSSION;
        this.SLIDES = SLIDES;
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


module.exports = {
    UserObj,
    UserUnitObj,
    UserTRG,
    UserCheckpoint,
    TRG,
    Checkpoint,
    UnitObj,
    DUE
};
