const { SchoologyAccessor } = require("./SA")

class BioParser extends SchoologyAccessor {
    constructor() {
        super();
    }

    async getTRGandCheckpoints() {
        let stuff = await this.get("/sections/2772305484/assignments?limit=1000")
        let data = await stuff.json();

        let otherstuff = await this.get("/users/2016549/grades?section_id=2772305484");
        let grades = await otherstuff.json();
        let categories = new Map();

        for(const cat of grades.section[0].grading_category) {
            categories.set(""+cat.id,cat.title);
        }

        let TRGMap = new Map();
        let CheckpointMap = new Map();

        for(let i = 0; i < data.assignment.length; i++){
            
            let title = data.assignment[i].title;
            if( ( title.indexOf("TRG") !== -1 || title.indexOf("Checkpoint") !== -1) && title.indexOf("-") !== -1){
                let dashindex = title.indexOf("-");
                let cut = title.slice(dashindex-1,dashindex+2).split("-");
                let unit = parseInt(cut[0]);
                let num = parseInt(cut[1]);
                let pair = JSON.stringify( [unit,num] );

                if(title.indexOf("TRG") !== -1) {

                    let {due,allow_dropbox,description,web_url, id, grading_category, max_points} = data.assignment[i];

                    web_url = this.appToPAUSD(web_url);
                    title = title.slice(dashindex+4);

                    if(!TRGMap.has(pair)) {
                        TRGMap.set(pair, {
                            TITLE: title,
                            DESCRIPTION: description,
                            GRADED: false
                        })
                    } else {
                        if(TRGMap.get(pair).DESCRIPTION.length < description.length){
                            TRGMap.set(pair, {
                                ...TRGMap.get(pair),
                                DESCRIPTION: description
                            })
                        }
                    }

                    if(allow_dropbox === "1") {
                        TRGMap.set(pair, {
                            ...TRGMap.get(pair),
                            DUE: due,
                            SUBMITURL: web_url,
                            ID: id,
                            CATEGORY: categories.get(grading_category),
                            SUMMATIVE: true,
                            POINTS: parseInt(max_points)
                        })
                    } else {
                        TRGMap.set(pair, {
                            ...TRGMap.get(pair),
                            OTHERURL: web_url
                        })
                    }
                } else {
                    let {due, id, grading_category,max_points} = data.assignment[i];

                    title = title.slice(dashindex+4);

                    CheckpointMap.set(pair, {
                        TITLE: title,
                        GRADED: false,
                        DUE: due,
                        ID: id,
                        CATEGORY: categories.get(grading_category),
                        SUMMATIVE: true,
                        POINTS: parseInt(max_points)
                    })
                }

                
            }

        }

        for(const entry of grades.section[0].period[0].assignment){
            for(const key of TRGMap.keys()) {
                if(TRGMap.get(key).ID === entry.assignment_id) {
                    TRGMap.get(key).GRADED = true;
                }
            }
            for(const key of CheckpointMap.keys()) {
                if(CheckpointMap.get(key).ID === entry.assignment_id) {
                    CheckpointMap.get(key).GRADED = true;
                }
            }
        }

        return { TRGS: TRGMap, CHECKPOINTS: CheckpointMap } ;

    }

    /**
     * 
     * @param {string} url 
     */
    appToPAUSD(url) {
        try {
            let u = new URL(url);
            if(u.hostname === "app.schoology.com") {
                url = url.slice(0,8) + "pausd" + url.slice(11);
            }
            return url;
        } catch(err){
            return "";
        }
        
    }
}

module.exports = {BioParser};
