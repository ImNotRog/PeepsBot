import { Message, Client, GuildEmoji, TextChannel } from "discord.js";
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";
import { SheetsUser } from "./SheetsUser";

export class EmoteBot implements Module {
    public name = "Emote Bot";

    private client: Client;
    private allEmotes: GuildEmoji[];
    private emoteCount: Map<string, EmoteHandler>
    private sheetsUser: SheetsUser;

    private readonly alpha = `🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇲 🇳 🇴 🇵 🇶 🇷 🇸 🇹 🇺 🇻 🇼 🇽 🇾 🇿`.split(` `);

    constructor(auth, client: Client) {
        this.client = client;

        let m = new Map();
        m.set("data","1CeljfBu-3afIfd43F5pTFWOKPIoxE8O5qlJr34XBiCI")
        this.sheetsUser = new SheetsUser(auth,m);
    }

    async onMessage(message: Message): Promise<void> {
        if(!message.author.bot) {
            for(const emote of this.allEmotes) {
                let count = 0;
                for(let i = 0; i < message.content.length - emote.identifier.length; i++) {
                    if(message.content.slice(i, i + emote.identifier.length) === emote.identifier) {
                        count++;
                    }
                }
                this.emoteCount.get(emote.identifier).add(message.author.id, count);
            }
        }

        const result = PROCESS(message);
        if(result) {
            if(result.command === "report") {
                message.react("✅");

                await this.sheetsUser.clearSheet('data', 'Data');
                await this.sheetsUser.bulkUpdateRows("data", "Data", this.toShortArray().map((row, i) => { return { row, num: i } }))
            }
            if(result.command === "runpurge" && message.member.hasPermission('ADMINISTRATOR')) {
                let channel = await this.client.channels.fetch("751552954518994965");

                let list = this.leastUsed(parseInt(result.args[0]) || 10);

                let emotelist = list.map((val, i) => `${this.alpha[i]}: <:${val.identifier}>`);
                let len = emotelist.length;
                let columns = [];
                let numcolumns = 3;
                for(let i = 0; i < numcolumns; i++) {
                    columns.push( emotelist.slice(len / numcolumns * i, len / numcolumns * (i+1)).join('\n') );
                }
                // message.channel.send(emotelist);
                let embed = {
                    title: `Emote Purge`,
                    description: `You have a voice, but no one cares. That's why you should vote for emotes that you think should **NOT** be purged.`,
                    fields: columns.map((col,i) => { return { name: `Column ${i+1}`, value: col, inline: true }}),
                    color: 1111111
                }
                
                if(channel instanceof TextChannel) {
                    let message = await channel.send({embed});
                    for(let i = 0;  i < len; i++) {
                        message.react(this.alpha[i]);
                    }
                }
            }

        }
    }

    async onConstruct(): Promise<void> {
        this.allEmotes = (await this.client.guilds.fetch('748669830244073533')).emojis.cache.array();
        this.emoteCount = new Map();

        for(const emote of this.allEmotes) {
            this.emoteCount.set(emote.identifier, new EmoteHandler(emote.identifier));
        }

        await this.sheetsUser.onConstruct();
        this.fromShortArray( await this.sheetsUser.readSheet("data","Data") );

        setInterval(async () => {
            await this.sheetsUser.clearSheet('data', 'Data');
            await this.sheetsUser.bulkUpdateRows("data", "Data", this.toShortArray().map((row, i) => { return { row, num: i } }))
        }, 1000 * 60 * 5);

        this.client.on("messageReactionAdd", (reaction, user) => {
            if(!user.bot && this.emoteCount.has(reaction.emoji.identifier)) {
                
                this.emoteCount.get(reaction.emoji.identifier).add(user.id, 1);
            }
            
        });

        
    }

    available(guild): boolean {
        return guild && guild.id === '748669830244073533';
    }

    toArray() {
        let allusers = new Set();
        for(const key of this.emoteCount.keys()){
            for(const user of this.emoteCount.get(key).userCache.keys()) {
                allusers.add(user);
            }
        }

        let allusersarray = [...allusers];

        let nums = Array(this.emoteCount.size).fill(0).map(() => Array(allusers.size).fill(0));
        
        const emoteKeys = [...this.emoteCount.keys()];
        for (let i = 0; i < emoteKeys.length; i++){
            let emote = this.emoteCount.get(emoteKeys[i]);
            for(const key of emote.userCache.keys()) {
                nums[i][allusersarray.indexOf(key)] = emote.userCache.get(key);
            }
        }

        // console.log(nums);

        return nums;
    }

    toShortArray() {

        let nums = Array(this.emoteCount.size).fill(0).map(() => Array());

        const emoteKeys = [...this.emoteCount.keys()];
        for (let i = 0; i < emoteKeys.length; i++) {
            let emote = this.emoteCount.get(emoteKeys[i]);
            nums[i].push(emoteKeys[i]);
            nums[i].push(emote.total);
            nums[i].push(emote.overall());
            for (const key of emote.userCache.keys()) {
                nums[i].push(`${key} - ${emote.userCache.get(key)}`);
            }
        }
        nums.splice(0, 0, [`Identifier`, `Total`, `Score`, `Usage...`])

        return nums;

    }

    fromShortArray(param: (string|number)[][]) {

        if(!param || param.length === 0 || param[0].length === 0) {
            return;
        }

        let nums = param.slice(1);
        for(const row of nums) {
            if(this.emoteCount.has('' + row[0])) {
                let emote = this.emoteCount.get('' + row[0])
                emote.total = parseInt(`${row[1]}`);
                emote.userCache = new Map();
                for(const str of row.slice(3)) {
                    let numbers = `${str}`.split(' - ');
                    let id = numbers[0];
                    let number = parseInt(numbers[1]);
                    emote.userCache.set(id,number);
                }
            }
        }
    }

    leastUsed(n?:number) {
        let limit = n || 5;
        let allemotes: EmoteHandler[] = [];
        for(const key of this.emoteCount.keys()) {
            allemotes.push(this.emoteCount.get(key));
        }

        allemotes = allemotes.filter((a) => !a.identifier.startsWith("a:") && !a.identifier.startsWith("02"));
        // allemotes = allemotes.sort((a,b) => a.overall() - b.overall());

        let allmin: EmoteHandler[] = [];
        
        let emoteset = new Set(allemotes);

        let infiniteloopgetteroutter2000 = 0;
        while (allmin.length < limit && infiniteloopgetteroutter2000 < limit) {
            let min = Infinity;
            for (const a of emoteset) {
                if (a.overall() < min) {
                    min = a.overall();
                }
            }

            for (const a of emoteset) {
                if (a.overall() === min) {
                    allmin.push(a);
                    emoteset.delete(a);
                }
            }

            infiniteloopgetteroutter2000++;
        }

        return allmin;
    }

    helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

}

class EmoteHandler {
    public userCache: Map<string, number>;
    public total = 0;
    public identifier:string;

    constructor(str:string) {
        this.userCache = new Map();
        this.identifier = str;
    }

    add(userid:string, num:number) {
        if(num === 0) return;
        if(this.userCache.has(userid)) {
            this.userCache.set(userid, this.userCache.get(userid) + num);
        } else {
            this.userCache.set(userid, num);
        }
        this.total += num;
    }

    overall() {

        let arr = [...this.userCache.entries()].map(val => val[1]);
        
        arr = arr.sort((a,b)=>a - b);

        if(this.userCache.size === 0) {
            return 0;
        } else if(this.userCache.size === 1) {
            return Math.pow(arr[0], 0.3);
        } else {
            let smallmedian = arr[ Math.floor( arr.length / 2 - 1 ) ];
            for (let i = Math.floor(arr.length / 2 - 1) + 1; i < arr.length; i++) {
                let above = arr[i] - smallmedian;
                
                arr[i] = smallmedian + Math.pow(above, 0.2);
            }

            let sum = arr.reduce((a, b) => a + b, 0);
            sum *= Math.pow( this.userCache.size, 0.6 );

            return sum;
        }
    }
}
