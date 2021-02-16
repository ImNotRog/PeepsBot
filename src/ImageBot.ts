import Discord = require("discord.js");
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";
import { DriveUser } from "./DriveUser";
import { SheetsUser } from "./SheetsUser";
import { Utilities } from "./Utilities";
import * as fs from 'fs';
import * as https from 'https';

/**
 * @todo Fix category system
 */

export class ImageBot implements Module {

    private client: Discord.Client;
    private readonly prefix: string = "--";
    private driveUser: DriveUser;
    private sheetUser: SheetsUser;

    private categoriesInfo: Map<string, {DID:string, sheetscache:string[][]}>;
    private readonly imagesFolder = '1Bil_W-7kd43marLiwlL6nZ7nEZAUzKQ2';
    private readonly imagesSheet = '17iYieSC2zDKpxgSPqhk6fcJZQjVBvJFE5S5KS1IcON8';

    private readonly jackChannels = ['809143110302826497']

    private approvedChannels = ['808469386746789938', '809143110302826497'];
    private voting = ['Jack', 'Nature'];
    
    public helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };

    constructor(auth, client: Discord.Client) {
        this.client = client;
        this.driveUser = new DriveUser(auth);

        let map = new Map();
        map.set('images', this.imagesSheet);
        this.sheetUser = new SheetsUser(auth, map);

        this.categoriesInfo = new Map();

        this.client.on("messageReactionAdd", (reaction, user) => { this.onReaction(reaction, user) });
        this.client.on("messageReactionRemove", (reaction, user) => { this.onReaction(reaction, user) });

        this.helpEmbed = {
            title: `Help - Image Bot`,
            description: `A bot that archives images in certain channels, then adds them to Google Drive for storage.`,
            fields: [
                {
                    name: `${this.prefix}[category]`,
                    value: `Enter the category, and it will send a randomly chosen image from that category. Any category name with spaces should have spaces replaced with "_"s.`
                },
                {
                    name: `${this.prefix}imagecategories`,
                    value: `Lists the categories.`
                },
                {
                    name: `${this.prefix}merge [from category] [to category]`,
                    value: `Merges two categories.`
                },
                {
                    name: `How to Add Images`,
                    value: `Whenever you post an image in one of the designated channels, it defaults to a certain category. ` +
                        `To override it, just enter the category name as the image caption when uploading. \n\n` +
                        `(There's actually a way to get more metadata into your photo, but 1. that's nerd shtuff and ` +
                        `2. it's so miserably overcomplicated that explaining it would exceed your goldfish attention span tenfold.)`
                    }
            ]
        }
    }

    available(message: Discord.Message): boolean {
        return message.guild.id === '748669830244073533';
    }

    defaultCat(message:Discord.Message) {
        return this.jackChannels.includes(message.channel.id) ? 'Jack' : 'Archive';
    }

    parseInfo(message:Discord.Message):{ cat:string, cap:string, tags: string[] } {

        const content = message.content;
        let cat = '';
        let cap = '';
        let tags = [];
        
        if( content.startsWith("```") && content.endsWith("```")) {
            let lines = content.split('\n');
            for(const line of lines) {

                if(line.includes(':')) {
                    let param = line.slice(0,line.indexOf(':'));
                    let value = line.slice(line.indexOf(':')+1);
                    if(value.startsWith(' ')) value = value.slice(1);

                    if(param.startsWith('cat')) {
                        cat = value;
                    } if(param.startsWith('cap')) {
                        cap = value;
                    } if(param.startsWith('tag')) {
                        let tagstr = value;
                        while (tagstr.includes('"')) {
                            let first = tagstr.indexOf('"');
                            let second = tagstr.slice(first + 1).indexOf('"') + first + 1;
                            if (second === -1) break;
                            let arg = tagstr.slice(first + 1, second);
                            tags.push(arg);
                            tagstr = tagstr.slice(0, first) + tagstr.slice(second + 1);
                        }
                        tags.push(...tagstr.split(' '));
                        tags = tags.filter(a => a !== "");
                    }
                }
            }
        } else {
            const args = content.split(' ');
            const argnums = Array(args.length).fill(-1);

            const dashargs = ['-cat', '-cap', '-tag'];
            for (let i = 0; i < args.length; i++) {
                argnums[i] = dashargs.indexOf(args[i]);
            }

            const until = (from: number, cond: (a: number) => boolean): number => {
                let last = from;
                while (last < args.length) {
                    last++;
                    if (cond(argnums[last])) {
                        break;
                    }
                }
                return last;
            }

            let catarg = argnums.indexOf(0);
            if (catarg === -1) {
                if (argnums[0] === -1) {
                    cat = args.slice(0, until(0, (a) => a !== -1)).join(' ');
                }
            } else {
                cat = args.slice(catarg + 1, until(catarg, (a) => a !== -1)).join(' ');
            }

            
            let caparg = argnums.indexOf(1);
            if (caparg !== -1) {
                cap = args.slice(caparg + 1, until(caparg, (a) => a !== -1)).join(' ');
            }

            let tagarg = argnums.indexOf(2);
            let tagstr = '';
            if (tagarg !== -1) {
                tagstr = args.slice(tagarg + 1, until(tagarg, (a) => a !== -1)).join(' ');
                while (tagstr.includes('"')) {
                    let first = tagstr.indexOf('"');
                    let second = tagstr.slice(first + 1).indexOf('"') + first + 1;
                    if (second === -1) break;
                    let arg = tagstr.slice(first + 1, second);
                    tags.push(arg);
                    tagstr = tagstr.slice(0, first) + tagstr.slice(second + 1);
                }
                tags.push(...tagstr.split(' '));
                tags = tags.filter(a => a !== "");
            }

            
            // -cat -cap -tag
            // return { cat };
        }

        if (cat === '') cat = this.defaultCat(message);

        cat = this.capitilize(cat);
        
        return { cat, cap, tags }
        
    }

    async uploadFromDiscordToDrive(message:Discord.Message, override?: {cat?:string, cap?:string, tags?:string[]}) {
        let obj = this.parseInfo(message);

        if(override) {
            obj = {
                ...obj,
                ...override
            }
        }
        let { cat, cap, tags } = obj;

        if (!this.isCategory(cat)) {

            let approved = await Utilities.sendApprove(message, {
                title: `Create new Category "${cat}"?`,
                description: `Make sure this is what you meant to do.`,
                ...Utilities.embedInfo(message)
            }, 10000);

            if (approved) {
                // New category
                this.categoriesInfo.set(cat, {
                    DID: await this.driveUser.createFolder(cat, this.imagesFolder),
                    sheetscache: [[]]
                });

                await this.sheetUser.createSubsheet("images", cat, {
                    columnResize: [200, 200, 100, 300, 200, 200, 300, 300, 100],
                    headers: ["File Name", "M-ID", "File Type", "D-ID", "UID", "User", "Caption", "Tags", "Stars"]
                })

            } else {
                cat = this.defaultCat(message);
            }


        }

        await message.react('👀');

        const url = message.attachments.first().url;

        const filetype = url.slice(url.lastIndexOf('.') + 1);
        console.log(`Uploading ${filetype}, category ${cat}`);

        const path = `./temp/${message.id}.${filetype}`;

        let p: Promise<void> = new Promise((r, j) => {
            https.get(url, (res) => {
                res.on('end', () => {
                    r();
                })
                const writestream = fs.createWriteStream(path);
                writestream.on('open', () => {
                    res.pipe(writestream);
                })
            })
        })

        await p;

        let id = await this.driveUser.uploadFile(`${message.id}.${filetype}`, path, this.categoriesInfo.get(cat).DID);

        await this.sheetUser.add("images", cat,
            [
                `${message.id}.${filetype}`,
                message.id,
                filetype,
                id,
                message.author.id,
                message.author.username + '#' + message.author.discriminator,
                cap,
                tags.join('|'),
                0]);
        this.categoriesInfo.set(cat, {
            ... this.categoriesInfo.get(cat),
            sheetscache: await this.sheetUser.readSheet("images", cat)
        })

        await message.reactions.removeAll();
        await message.react('✅');
    }

    async onMessage(message: Discord.Message): Promise<void> {

        if(this.approvedChannels.includes(message.channel.id)) {

            if(message.attachments.size > 0 && !message.author.bot) {

                await this.uploadFromDiscordToDrive(message);
                
            }

        } else {
            if(message.attachments.size > 0 && !message.author.bot) {
                await message.react("⬆️");
                await message.react("❌");

                let filter = (reaction,user) => {
                    return ["⬆️", "❌"].includes(reaction.emoji.name) && (message.guild.member(user)).hasPermission("ADMINISTRATOR");
                }

                try {
                    let reaction = await message.awaitReactions(filter, {
                        max: 1,
                        time: 30000,
                        errors: ['time']
                    })
                    if (reaction.first().emoji.name === "❌") {
                        await message.reactions.removeAll();
                    } else {
                        await this.uploadFromDiscordToDrive(message,{cat: "Archive", cap: message.content});
                    }
                } catch (err) {
                    await message.reactions.removeAll();
                }
            }
        }

        const result = PROCESS(message);
        if(result) {
            if (this.categoriesInfo.has(this.capitilize(result.command.replace(/_/g, " ")))) {

                let time = Date.now();
                const cat = this.capitilize(result.command.replace(/_/g, " "));

                let msg = await message.channel.send(`Fetching random "${cat}" image. Expect a delay of around 1-4 seconds.`);

                let entries = this.categoriesInfo.get(cat).sheetscache.length - 1;
                let index = Math.floor(Math.random() * entries) + 1;
                let row = this.categoriesInfo.get(cat).sheetscache[index];
                let DID = row[3];
                let filename = row[0];

                if (!this.inCache(filename)) {
                    await this.driveUser.downloadFile(DID, `./temp/${filename}`);
                }

                const a = new Discord.MessageAttachment(`./temp/${filename}`);

                await message.channel.send(`Random image of category ${cat}`, a);
                await msg.edit(`Latency: ${Date.now() - time} ms`);

            } 
            if(result.command === 'imagecategories') {
                await message.channel.send({
                    embed: {
                        title: 'Image Categories',
                        description: 'When using categories with spaces, replace spaces with _',
                        fields: [
                            {
                                name: 'Categories',
                                value: this.listCategories().join('\n')
                            }
                        ],

                        ...Utilities.embedInfo(message)
                    }
                })
            } 
            if(result.command === 'merge') {
                if(!message.member.hasPermission("ADMINISTRATOR")) {
                    await message.channel.send(`You must have permission ADMINISTRATOR!`)
                    return;
                }
                let cats = result.args.slice(0,2).map(a => a.replace(/_/g, ' ')).map(a => this.capitilize(a));
                if(cats.length < 2) {
                    await message.channel.send(`Invalid parameters! You must include two categories, the first one from, the second one to.`)
                    return;
                }
                if(!( this.isCategory(cats[0]) && this.isCategory(cats[1]) && cats[0] !== cats[1] )){
                    await message.channel.send(`Invalid categories! ${cats}`)
                    return;
                }

                await message.react('👀');

                const {num} = await this.merge(cats[0],cats[1]);
                await message.channel.send(`Success! ${num} images merged from ${cats[0]} into ${cats[1]}!`)
                await message.reactions.removeAll();
                await message.react('✅');
            }
        }
        
    }

    inCache(filename:string) {
        return fs.existsSync(`./temp/${filename}`)
    }

    async onReaction(reaction: Discord.MessageReaction, user: any) {

        if (this.approvedChannels.indexOf(reaction.message.channel.id) === -1) return;

        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message: ', error);
            return;
        }

        if (reaction.emoji.name === "👍" && reaction.message.attachments.size > 0) {
            
            const { cat } = this.parseInfo(reaction.message);

            console.log(`${reaction.message.id} has ${reaction.count} in category ${cat}`);

            if(true) {
            // if(this.voting.includes(cat)) {
                await this.sheetUser.addWithoutDuplicates("images", cat, ["File Name", reaction.message.id, "File Type", "D-ID", "UID", "User", "Caption", "Tags", reaction.count], ["KEEP", true, "KEEP", "KEEP", "KEEP", "KEEP", "KEEP", "KEEP", "CHANGE"]);
                this.categoriesInfo.set(cat, {
                    ... this.categoriesInfo.get(cat),
                    sheetscache: await this.sheetUser.readSheet("images", cat)
                })
            }
        }

    }

    async onConstruct(): Promise<void> {

        const files = await this.driveUser.getItemsInFolder(this.imagesFolder);

        for(const file of files) {
            if(file.mimeType === DriveUser.FOLDER) {
                this.categoriesInfo.set(file.name, {
                    DID: file.id,
                    sheetscache: [[]]
                });
            }
        }

        await this.sheetUser.onConstruct();

        let valueranges = await this.sheetUser.bulkRead("images");

        for(const valuerange of valueranges) {
            let range = valuerange.range;
            if(range)  {
                let cat = range.slice(0, range.lastIndexOf('!')).replace(/['"]/g, '');
                this.categoriesInfo.set(cat,
                    { 
                        ... this.categoriesInfo.get(cat),
                        sheetscache: valuerange.values
                    }
                );
            }
        }

        for (const id of this.approvedChannels) {

            let channel = await this.client.channels.fetch(id)

            // @ts-ignore
            const test: Map<string, Discord.Message> = await channel.messages.fetch({
                limit: 90
            })
        }
    
    }

    async merge(from:string, to:string): Promise<{num:number}> {
        let fromarr = this.categoriesInfo.get(from).sheetscache.slice(1);
        for(const row of fromarr) {
            let did = row[3];
            await this.driveUser.moveFile(did, this.categoriesInfo.get(to).DID);
        }
        const num = fromarr.length;
        fromarr = fromarr.map(row => {
            let tags = row[7].split('|');
            tags.push(from);
            if(tags[0] === '') tags = tags.slice(1);
            row[7] = tags.join('|');
            return row;
        });
        await this.sheetUser.bulkAdd("images", to, fromarr);
        await this.sheetUser.deleteSubSheet("images", from);
        await this.driveUser.deleteFile(this.categoriesInfo.get(from).DID);

        this.categoriesInfo.delete(from);
        this.categoriesInfo.set(to, {
            ...this.categoriesInfo.get(to),
            sheetscache: await this.sheetUser.readSheet("images", to)
        });

        return {num};
    }
    
    capitilize(a:string) {
        return a[0].toUpperCase() + a.slice(1).toLowerCase();
    }

    isCategory(cat:string) {
        return this.categoriesInfo.has(cat);
    }

    listCategories():string[] {
        return [...this.categoriesInfo.keys()];
    }
    
}
