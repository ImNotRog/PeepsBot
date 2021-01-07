const { SchoologyAccessor } = require("./SA")

class BioParser extends SchoologyAccessor {
    constructor() {
        super();
    }

    async fetchFromSqualol() {

        let baseFolder = await (await this.get("/courses/2772305484/folder/")).json();
        // let pastUnitFolders = await (await this.get(`/courses/2772305484/folder/348404361`)).json();
        let units = new Map();

        let unitpromises = [];
        let unitorder = [];

        for (const item of [...baseFolder["folder-item"]]) {
            if (item.title.indexOf("Unit") !== -1 && item.title.indexOf("Past") === -1) {
                let num = (item.title.slice(5, 6));
                let title = item.title.slice(8);
                let folderlink = this.folderToURL(item.id);
                let apilocation = this.linkToApi(item.location);
                let unitfolder = this.get(apilocation);

                unitpromises.push(unitfolder)
                unitorder.push(num);

                units.set(num, { TITLE: title, LINK: folderlink });
            }
        }

        unitpromises = await Promise.all(unitpromises);

        let unitjsonpromises = [];
        for (const p of unitpromises) {
            unitjsonpromises.push(p.json());
        }

        unitjsonpromises = await Promise.all(unitjsonpromises);

        for (let i = 0; i < unitjsonpromises.length; i++) {
            let curr = units.get(unitorder[i]);
            let info = {};
            for (const item of unitjsonpromises[i]["folder-item"]) {
                if (item.title.indexOf("Slides") !== -1) {
                    info["SLIDES"] = this.pageToURL(item.id);
                }
                if (item.title.indexOf("Calendar") !== -1) {
                    info["CALENDAR"] = this.pageToURL(item.id);
                }
                if (item.title.indexOf("Discussion") !== -1) {
                    info["DISCUSSION"] = this.discussionToURL(item.id);
                }
            }
            units.set(unitorder[i], {
                ...curr,
                ...info
            })
        }

        let stuff = await this.get("/sections/2772305484/assignments?limit=1000")
        let data = await stuff.json();

        // let otherstuff = await this.get("/users/2016549/grades?section_id=2772297053");
        // let grades = await otherstuff.json();
        // let categories = new Map();

        // for (const cat of grades.section[0].grading_category) {
        //     categories.set("" + cat.id, cat.title);
        // }

        let TRGMap = new Map();
        let CheckpointMap = new Map();
        let AssignmentMap = new Map();

        let events = await (await this.get("/sections/2772305484/events?start_date=20201107")).json();
        for (const event of events.event) {
            let title = event.title;
            if (title.indexOf("Checkpoint") !== -1) {
                let dashindex = title.indexOf("-");
                let cut = title.slice(dashindex - 1, dashindex + 2).split("-");
                let unit = parseInt(cut[0]);
                let num = parseInt(cut[1]);
                let pair = JSON.stringify([unit, num]);
                title = title.slice(dashindex + 4);

                CheckpointMap.set(pair, {
                    TITLE: title,
                    DUE: event.start,
                })
            }
        }

        for (let i = 0; i < data.assignment.length; i++) {

            let title = data.assignment[i].title;
            if ((title.indexOf("TRG") !== -1 || title.indexOf("Checkpoint") !== -1) && title.indexOf("-") !== -1) {
                let dashindex = title.indexOf("-");
                let cut = title.slice(dashindex - 1, dashindex + 2).split("-");
                let unit = parseInt(cut[0]);
                let num = parseInt(cut[1]);
                let pair = JSON.stringify([unit, num]);

                if (title.indexOf("TRG") !== -1) {

                    let { due, allow_dropbox, description, web_url, id, grading_category, max_points } = data.assignment[i];

                    web_url = this.appToPAUSD(web_url);
                    title = title.slice(dashindex + 4);

                    if (!TRGMap.has(pair)) {
                        TRGMap.set(pair, {
                            // TITLE: title,
                            DESCRIPTION: description,
                            GRADED: false
                        })
                    } else {
                        if (TRGMap.get(pair).DESCRIPTION.length < description.length) {
                            TRGMap.set(pair, {
                                ...TRGMap.get(pair),
                                DESCRIPTION: description
                            })
                        }
                    }

                    if (allow_dropbox === "1") {
                        TRGMap.set(pair, {
                            ...TRGMap.get(pair),
                            DUE: due,
                            SUBMITURL: web_url,
                            ID: id,
                            // CATEGORY: categories.get(grading_category),
                            SUMMATIVE: true,
                            UNIT: unit,
                            NUM: num,
                            POINTS: parseInt(max_points)
                        })
                    } else {
                        TRGMap.set(pair, {
                            ...TRGMap.get(pair),
                            OTHERURL: web_url
                        })
                    }
                } else {
                    let { due, id, grading_category, max_points } = data.assignment[i];

                    title = title.slice(dashindex + 4);

                    CheckpointMap.set(pair, {
                        TITLE: title,
                        GRADED: false,
                        DUE: due,
                        ID: id,
                        // CATEGORY: categories.get(grading_category),
                        SUMMATIVE: true,
                        POINTS: parseInt(max_points),
                        UNIT: unit,
                        NUM: num,
                    })
                }


            } else {
                let { due, id, grading_category, max_points } = data.assignment[i];
                AssignmentMap.set(id, {
                    TITLE: title,
                    DUE: due,
                    NODATE: due === "",
                    ID: id,
                    // CATEGORY: categories.get(grading_category) || "Unknown",
                    POINTS: parseInt(max_points),
                    GRADED: false,
                    // SUMMATIVE: (categories.get(grading_category) && categories.get(grading_category).toLowerCase().indexOf("non") === -1) || false
                })

            }

        }

        // for (const entry of grades.section[0].period[0].assignment) {
        //     for (const key of TRGMap.keys()) {
        //         if (TRGMap.get(key).ID === entry.assignment_id) {
        //             TRGMap.get(key).GRADED = true;
        //         }
        //     }
        //     for (const key of CheckpointMap.keys()) {
        //         if (CheckpointMap.get(key).ID === entry.assignment_id) {
        //             CheckpointMap.get(key).GRADED = true;
        //         }
        //     }
        //     if (AssignmentMap.has(entry.assignment_id)) {
        //         AssignmentMap.get(entry.assignment_id).GRADED = true;
        //     }
        // }

        const docs = (await (await this.get("/sections/2772305484/documents?limit=100")).json()).document;
        for (const doc of docs) {
            if (doc.title.indexOf("TRG") !== -1) {
                let dashindex = doc.title.indexOf("-")
                let cut = doc.title.slice(dashindex - 1, dashindex + 2).split("-");
                let unit = parseInt(cut[0]);
                let num = parseInt(cut[1]);
                let pair = JSON.stringify([unit, num]);

                if (TRGMap.has(pair)) {
                    TRGMap.get(pair).DOCURL = doc.attachments.links.link[0].url
                }
            }
        }

        return { TRGS: TRGMap, CHECKPOINTS: CheckpointMap, UNITS: units, ASSIGNMENTS: AssignmentMap };

    }

    linkToApi(link) {
        return link.slice(28);
    }

    folderToURL(folderid){
        return `https://pausd.schoology.com/course/2772305484/materials?f=${folderid}`
    }

    pageToURL(id){
        return `https://pausd.schoology.com/course/2772305484/materials/link/view/${id}`
    }

    discussionToURL(id){
        return `https://pausd.schoology.com/course/2772305484/materials/discussion/view/${id}`
    }

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
