
const cron = require("node-cron");
const moment = require("moment-timezone")
const Discord = require("discord.js");
const schedule = require("node-schedule");

class Countdown {
    /**
     * 
     * @param {*} eventname 
     * @param {*} channelname 
     * @param {moment.Moment} momentobj 
     */
    constructor(eventname, channelname, momentobj) {
        this.eventname = eventname;
        this.channelname = channelname;
        this.momentobj = momentobj;
    }
}

class CountdownBot {
    /**
     * 
     * @param {Discord.Client} client 
     */
    constructor(client) {
        this.client = client;

        this.countermap = []
        // this.countermap.push(
        //     new Countdown(
        //         `Salvation`,
        //         // `788476890566492160`,
        //         `750804960333135914`,
        //         moment.tz("2020-12-18T15:00:40", "America/Los_Angeles")
        //     )
        // );
        this.countermap.push(
            new Countdown(
                `Test`,
                // `788476890566492160`,
                `750804960333135914`,
                moment.tz("2020-12-15T11:25:25", "America/Los_Angeles")
            )
        );

    }

    async onConstruct() {
        for (const countdown of this.countermap) {
            /**
             * @type {Discord.TextChannel}
             */
            let channel = await this.client.channels.fetch(countdown.channelname);
            // channel.setName("Brr")
            let min = countdown.momentobj.minutes() % 10;
            let mins = Array(6).fill(0).map((z,index) => index * 10 + min).join(",");
            let str = `${countdown.momentobj.seconds()} ${mins} * * * *`
            console.log(str)
            let task = cron.schedule(str, () => {
                let dur = this.diff(countdown.momentobj)
                channel.send(this.tostr(countdown.eventname, dur));
            },
            {
                timezone: `America/Los_Angeles`
            });

            let fivebefore = moment( countdown.momentobj ).subtract(5,"minutes")

            if( fivebefore.isBefore(moment()) ){
                task.destroy()
                console.log("brr")
            }

            schedule.scheduleJob(fivebefore.toDate(), () => {
                task.destroy();
            })
            
            schedule.scheduleJob(countdown.momentobj.toDate(), () => {
                channel.send(`${countdown.eventname} NOW!!`);
            })
        }
    }

    tostr(name,dur) {
        return `${name} in ${dur.days()} days, ${dur.hours()} hours, ${dur.minutes()} minutes, ${dur.seconds()} seconds`
    }

    toshortstr(name, dur) {
        return `${name} in ${dur.days()} days, ${this.append0(dur.hours())}:${this.append0(dur.minutes())}:${this.append0(dur.seconds())}`
    }

    append0(a) {
        a += "";
        if(a.length == 1) {
            a = "0" + a;
        }
        return a;
    }

    diff(to) {
        let now = moment.tz("America/Los_Angeles");
        return moment.duration(to.diff(now));
    }
}

module.exports = { CountdownBot };
