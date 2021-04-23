import Discord = require("discord.js");
import { Command, Module } from "./Module";
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
    public name: "Image Bot";

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

    public commands: Command[];

    constructor(auth, client: Discord.Client) {
        this.client = client;
        this.driveUser = new DriveUser(auth);

        let map = new Map();
        map.set('images', this.imagesSheet);
        this.sheetUser = new SheetsUser(auth, map);

        this.categoriesInfo = new Map();
        
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

    available(guild: Discord.Guild): boolean {
        return guild && guild.id === '748669830244073533';
    }

    private categoryCommand(name:string, category: string, available?: (guild: Discord.Guild) => boolean): Command {
        return {
            name,
            description: `Returns a random ${category} image from the Google drive archive.`,
            parameters: [],
            slashCallback: async (invoke, channel, user) => {
                await invoke(`Fetching random "${category}" image. Expect a delay of around 1-4 seconds.`);

                const a = await this.randomImage(category);

                await channel.send(`Random image`, a);
            },
            regularCallback: async (message) => {
                let time = Date.now();
                let msg = await message.channel.send(`Fetching random "${category}" image. Expect a delay of around 1-4 seconds.`);

                const a = await this.randomImage(category);

                await message.channel.send(`Random image`, a);
                await msg.edit(`Latency: ${Date.now() - time} ms`);
            },
            available: available ? available : () => true
        }
    }

    async onConstruct(): Promise<void> {

        const files = await this.driveUser.getItemsInFolder(this.imagesFolder);

        for (const file of files) {
            if (file.mimeType === DriveUser.FOLDER) {
                this.categoriesInfo.set(file.name, {
                    DID: file.id,
                    sheetscache: [[]]
                });
            }
        }

        await this.sheetUser.onConstruct();

        let valueranges = await this.sheetUser.bulkRead("images");

        for (const valuerange of valueranges) {
            let range = valuerange.range;
            if (range) {
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

        this.commands = [
            // general
            {
                name: "Image",
                description: "Returns a random image from a category",
                parameters: [
                    {
                        name: "Category",
                        description: "Category of the image",
                        required: true,
                        type: "string"
                    }
                ],
                slashCallback: async (invoke, channel, user, category: string) => {
                    if (this.categoriesInfo.has(this.capitilize(category.replace(/_/g, " ")))) {

                        const cat = this.capitilize(category.replace(/_/g, " "));

                        invoke(`Fetching random "${cat}" image. Expect a delay of around 1-4 seconds.`);

                        const a = await this.randomImage(cat);

                        await channel.send(`Random image`, a);

                    } else {
                        invoke({
                            embed: {
                                description: `Invalid Category ${category}.`,
                                color: 1111111
                            }
                        })
                    }
                },
                regularCallback: async (message, category: string) => {
                    if (this.categoriesInfo.has(this.capitilize(category.replace(/_/g, " ")))) {

                        let time = Date.now();
                        const cat = this.capitilize(category.replace(/_/g, " "));

                        let msg = await message.channel.send(`Fetching random "${cat}" image. Expect a delay of around 1-4 seconds.`);

                        const a = await this.randomImage(cat);

                        await message.channel.send(`Random image`, a);
                        await msg.edit(`Latency: ${Date.now() - time} ms`);

                    } else {
                        await message.channel.send({
                            embed: {
                                description: `Invalid Category ${category}.`,
                                color: 1111111
                            }
                        })
                    }
                },
                available: (guild) => guild.id === "748669830244073533"
            },
            {
                name: "ImageCategories",
                description: "Returns the image categories.",
                parameters: [],
                slashCallback: async (invoke, channel, user) => {
                    await invoke({
                        embed: {
                            title: 'Image Categories',
                            description: 'When using categories with spaces, replace spaces with _',
                            fields: [
                                {
                                    name: 'Categories',
                                    value: this.listCategories().join('\n')
                                }
                            ],

                            ...Utilities.basicEmbedInfo(),
                            footer: {
                                "text": `Requested by ${user.username}`,
                                "icon_url": user.displayAvatarURL()
                            }
                        }
                    })
                },
                regularCallback: async (message) => {
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
                },
                available: (guild) => guild.id === "748669830244073533"
            },
            {
                name: "ImageArchive",
                description: "The link to the image archive on Google Drive",
                parameters: [],
                callback: () => {
                    return {
                        embed: {
                            description: `[Link to the images.](https://drive.google.com/drive/u/0/folders/1Bil_W-7kd43marLiwlL6nZ7nEZAUzKQ2)`,
                            color: 1111111
                        }
                    }
                },
                available: (guild) => guild.id === "748669830244073533"
            },
            {
                textOnly: true,
                name: "Merge",
                description: "Merges two image categories (MOD ONLY)",
                parameters: [
                    {
                        name: "From",
                        description: "The category to merge FROM",
                        required: true,
                        type: "string"
                    },
                    {
                        name: "To",
                        description: "The category to merge TO",
                        required: true,
                        type: "string"
                    }
                ],
                available: (guild) => guild.id === "748669830244073533",
                callback: async (message: Discord.Message, from:string, to:string) => {
                    if (!message.member.hasPermission("ADMINISTRATOR")) {
                        await message.channel.send(`You must have permission ADMINISTRATOR!`)
                        return;
                    }
                    let cats = [from, to].map(a => a.replace(/_/g, ' ')).map(a => this.capitilize(a));
                    
                    if (!(this.isCategory(cats[0]) && this.isCategory(cats[1]) && cats[0] !== cats[1])) {
                        await message.channel.send(`Invalid categories! ${cats}`, { allowedMentions: { parse: [] } })
                        return;
                    }

                    await message.react('👀');

                    const { num } = await this.merge(cats[0], cats[1]);
                    await message.channel.send(`Success! ${num} images merged from ${cats[0]} into ${cats[1]}!`, { allowedMentions: { parse: [] } })
                    await message.reactions.removeAll();
                    await message.react('✅');
                }
            },

            // other
            this.categoryCommand("Dog", "Dog"),
            this.categoryCommand("Archive", "Archive", (guild) => guild.id === "748669830244073533"),
        ]

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

    async createNewCategory(cat:string) {
        // New category
        this.categoriesInfo.set(cat, {
            DID: await this.driveUser.createFolder(cat, this.imagesFolder),
            sheetscache: [[]]
        });

        await this.sheetUser.createSubsheet("images", cat, {
            columnResize: [200, 200, 100, 300, 200, 200, 300, 300],
            headers: ["File Name", "M-ID", "File Type", "D-ID", "UID", "User", "Caption", "Tags"]
        })
    }

    async uploadFromDiscordToDrive(message:Discord.Message, override?: {cat?:string, cap?:string, tags?:string[]}) {
        //  Parse info from message
        let obj = this.parseInfo(message);

        // Overrides
        if(override) {
            obj = {
                ...obj,
                ...override
            }
        }
        let { cat, cap, tags } = obj;


        // New category
        if (!this.isCategory(cat)) {

            let approved = [...cat].every(char => " abcdefghijklmnopqrstuvwxyz0123456789".includes(char));

            if (approved) {

                await this.createNewCategory(cat);

                message.channel.send({
                    embed: {
                        description: `Created new category ${cat}.`,
                        color: 1111111
                    }
                })

            } else {
                message.channel.send({
                    embed: {
                        description: "Invalid category. Categories must only include letters, spaces, and numbers. Uploaded image to default category.",
                        color: 1111111
                    }
                })
                cat = this.defaultCat(message);
            }

        }

        // Eyes
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

        // oh lord 
        await this.sheetUser.add("images", cat,
            [
                `${message.id}.${filetype}`,
                message.id,
                filetype,
                id,
                message.author.id,
                message.author.username + '#' + message.author.discriminator,
                cap,
                tags.join('|')]);
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
                message.react("⬆️");
                message.react("❌");

                let filter = (reaction,user) => {
                    return ["⬆️", "❌"].includes(reaction.emoji.name) && (!user.bot && ( user.id === message.author.id || message.guild.member(user).hasPermission("ADMINISTRATOR")) );
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
                    // Another horrible try catch because yes
                    try {
                        await message.reactions.removeAll();
                    } catch(err) { }
                }
            }
        }

        const result = PROCESS(message);
        if(result) {
            
        }
        
    }

    inCache(filename:string) {
        return fs.existsSync(`./temp/${filename}`)
    }

    async randomImage(cat: string) {
        let entries = this.categoriesInfo.get(cat).sheetscache.length - 1;
        let index = Math.floor(Math.random() * entries) + 1;
        let row = this.categoriesInfo.get(cat).sheetscache[index];
        let DID = row[3];
        let filename = row[0];

        if (!this.inCache(filename)) {
            await this.driveUser.downloadFile(DID, `./temp/${filename}`);
        }

        return new Discord.MessageAttachment(`./temp/${filename}`);
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
