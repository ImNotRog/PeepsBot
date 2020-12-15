
const cron = require("node-cron");
const moment = require("moment-timezone")
const Discord = require("discord.js");
const schedule = require("node-schedule");

class Countdown {
    /**
     * 
     * @param {string} eventname 
     * @param {string} counterid 
     * @param {moment.Moment} momentobj 
     * @param {string} countdownchannelid
     * @param {string} desc
     */
    constructor(eventname, counterid, momentobj, countdownchannelid, desc) {
        this.eventname = eventname;
        this.counterid = counterid;
        this.momentobj = momentobj;
        this.countdownchannelid = countdownchannelid;
        this.desc = desc
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
        // this.countermap.push(
        //     new Countdown(
        //         `P3 Final`,
        //         `788476890566492160`,
        //         moment.tz("2020-12-15T12:20:00", "America/Los_Angeles"),
        //         `748669830244073536`,
        //         `Period 3 Final >:C`
        //     )
        // );

    }

    async onConstruct() {
        for (const countdown of this.countermap) {

            let countdownchannel = await this.client.channels.fetch(countdown.countdownchannelid);
            let counter = await this.client.channels.fetch(countdown.counterid);

            let min = countdown.momentobj.minutes() % 10;
            let mins = Array(6).fill(0).map((z,index) => index * 10 + min).join(",");
            let str = `${countdown.momentobj.seconds()} ${mins} * * * *`

            let dur = this.diff(countdown.momentobj)
            // counter.setName(this.toshortstr(countdown.eventname, dur))

            let task = cron.schedule(str, () => {
                let dur2 = this.diff(countdown.momentobj)
                // countdownchannel.send(this.tostr(countdown.eventname, dur2));
                counter.setName(this.toshortstr(countdown.eventname, dur2))
            },
            {
                timezone: `America/Los_Angeles`
            });

            let fivebefore = moment( countdown.momentobj ).subtract(5,"minutes")

            if( fivebefore.isBefore(moment()) ){
                task.destroy()
            }

            schedule.scheduleJob(fivebefore.toDate(), () => {
                task.destroy();
            })

            for(let i of [30, 10, 3, 2, 1]) {
                let before = moment(countdown.momentobj).subtract(i, "seconds")
                schedule.scheduleJob(before.toDate(), () => {
                    countdownchannel.send({ 
                        embed: { 
                            title: `${i} second${i===1 ? `` : `s`}!`,
                            description: `Until ${countdown.eventname}`,
                            color: 111111
                        }
                    })
                })
            }

            for (const i of [1,5,10,15,30,60]) {
                let before = moment(countdown.momentobj).subtract(i, "minutes")
                schedule.scheduleJob(before.toDate(), () => {
                    countdownchannel.send(`${i} minutes until ${countdown.eventname}!`)
                })
            }

            for (const i of [1, 2, 3, 5, 7, 10]) {
                let before = moment(countdown.momentobj).subtract(i, "days")
                schedule.scheduleJob(before.toDate(), () => {
                    countdownchannel.send(`${i} days until ${countdown.eventname}!`)
                })
            }
            
            schedule.scheduleJob(countdown.momentobj.toDate(), () => {
                countdownchannel.send({
                    embed: {
                        title: `${countdown.eventname}!`,
                        description: `${countdown.desc}`,
                        color: 111111
                    }
                });
                counter.setName(`${countdown.eventname}!`);
            })

            let fiveafter = moment(countdown.momentobj).add(5, "minutes")
            schedule.scheduleJob(fiveafter.toDate(), () => {
                counter.delete();
            })
        }
    }

    tostr(name,dur) {
        return `${name} in ${dur.days()} days, ${dur.hours()} hours, ${dur.minutes()} minutes, ${dur.seconds()} seconds`
    }

    toshortstr(name, dur) {
        return `${name} in ${dur.days()}:${this.append0(dur.hours())}:${this.append0(dur.minutes())}:${this.append0(dur.seconds())}`
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
