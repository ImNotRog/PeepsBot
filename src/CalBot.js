const Discord = require("discord.js");
const { SheetsUser } = require("./SheetsUser");
const { Utilities } = require('./Utilities')

const schedule = require("node-schedule");
let moment = require("moment-timezone");


class CalendarBot {
    /**
     * @constructor
     * @param {google.auth.OAuth2} auth
     * @param {Discord.Client} client
     */
    constructor(auth,client) {
        let currmap = new Map();
        currmap.set("peeps", "1m-w9iB40s2f5dWaauQR_gNm88g1j4prdajBWVGG12_k");
        this.sheetsUser = new SheetsUser(auth, currmap);

        this.utils = new Utilities();
        this.prefix = "--"

        this.bdayChannels = ["748669830244073536"];
        // this.bdayChannels = ["750804960333135914"]; // Redirect
        this.client = client;
    }

    /**
     * 
     * @param {string[]} row 
     */
    async sendBday(row) {
        const person = row[0];
        const bday = row[1];
        const age = row[3];

        let embed = {
            title: `Happy Birthday to ${person}! 🎉`,
            description: [`${age} years ago, on ${bday}, they were birthed into this cruel and doomed world.`,
                    `But today, we celebrate! Here's to being 1 year closer to death!`,
                    `Ok, now go bully them with your singing or something.`].join(`\n`),
            ...this.utils.basicEmbedInfoForCal()
        }

        for(const id of this.bdayChannels) {
            let channel = await this.client.channels.fetch(id)
            channel.send({ embed });
        }
    }

    async remindBday(row) {
        const person = row[0];
        const bday = row[1];
        const age = row[3];

        let embed = {
            title: `Reminder: It is ${person}'s birthday! 🎉`,
            description: [`Death comes for us all, but hey, at least there's instant ramen.`,
                `Today, ${person} is ${age} years old, which may or may not qualify ${person} for senior benefits.`,
                `School's out, so you better go spam this person in chat or something.`].join(`\n`),
            ...this.utils.basicEmbedInfoForCal()
        }

        for (const id of this.bdayChannels) {
            let channel = await this.client.channels.fetch(id)
            channel.send({ embed });
        }
    }

    async onConstruct() {
        await this.sheetsUser.SetUpSheets();

        let rows = (await this.sheetsUser.readSheet("peeps", "Birthdays"));

        for(let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if(row[1].length > 0) {
                let stuff = row[2].split("/");
                if(stuff[1].length < 2) {
                    stuff[1] = "0" + stuff[1];
                }
                if (stuff[0].length < 2) {
                    stuff[0] = "0" + stuff[0];
                }
                let momentobj = (moment.tz([stuff[2],stuff[0],stuff[1]].join("-"), "America/Los_Angeles"));
                momentobj.set("hours", 7);
                momentobj.set("minutes", 0);
                momentobj.set("seconds", 0);

                schedule.scheduleJob(momentobj.toDate(), () => {
                    this.sendBday(row);
                })

                momentobj.set("hours", 15);
                momentobj.set("minutes", 5);
                momentobj.set("seconds", 0);

                schedule.scheduleJob(momentobj.toDate(), () => {
                    this.remindBday(row);
                })
            }
        }
    }

}

module.exports = { CalendarBot };
