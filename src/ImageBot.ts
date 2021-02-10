import Discord = require("discord.js");
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";
import { DriveUser } from "./DriveUser";
import { SheetsUser } from "./SheetsUser";
import * as fs from 'fs';
import * as https from 'https';

export class ImageBot implements Module {

    private client: Discord.Client;
    private readonly prefix: string = "--";
    private driveUser: DriveUser;
    private sheetUser: SheetsUser;

    private categories:Map<string,string>;
    private readonly imagesFolder = '1Bil_W-7kd43marLiwlL6nZ7nEZAUzKQ2';
    private readonly imagesSheet = '17iYieSC2zDKpxgSPqhk6fcJZQjVBvJFE5S5KS1IcON8';

    private readonly jackChannels = ['809143110302826497']

    private approvedChannels = ['808469386746789938', '809143110302826497'];
    private voting = ['Jack', 'Nature'];

    constructor(auth, client: Discord.Client) {
        this.client = client;
        this.driveUser = new DriveUser(auth);

        let map = new Map();
        map.set('images', this.imagesSheet);
        this.sheetUser = new SheetsUser(auth, map);

        this.categories = new Map();

        this.client.on("messageReactionAdd", (reaction, user) => { this.onReaction(reaction, user) });
        this.client.on("messageReactionRemove", (reaction, user) => { this.onReaction(reaction, user) });
    }

    cat(message:Discord.Message):string {
        const cat = message.content.length > 0 ? this.capitilize(message.content) : this.jackChannels.includes(message.channel.id) ? 'Jack' : 'Archive';
        return cat;
    }

    async onMessage(message: Discord.Message): Promise<void> {
        if(this.approvedChannels.includes(message.channel.id)) {
            if(message.attachments.size > 0 && !message.author.bot) {

                const cat = this.cat(message);

                if (!this.categories.has(cat)) {
                    // New category
                    this.categories.set(cat, await this.driveUser.createFolder(cat,this.imagesFolder) );

                    await this.sheetUser.createSubsheet("images", cat, {
                        columnResize: [200, 200, 100, 200, 200, 100],
                        headers: ["File Name", "M-ID", "File Type", "UID", "User", "Stars"]
                    })

                }

                const url = message.attachments.first().url;

                const filetype = url.slice(url.lastIndexOf('.') + 1);
                console.log(`Uploading ${filetype}`);

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

                await this.driveUser.uploadFile(`${message.id}.${filetype}`, path, this.categories.get(cat));
                
                await this.sheetUser.add("images", cat, [`${message.id}.${filetype}`, message.id, filetype, message.author.id, message.author.username + '#' + message.author.discriminator, 0]);
                
            }
        }
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
            

            const cat = this.cat(reaction.message);

            console.log(`${reaction.message.id} has ${reaction.count} and cat ${cat}`);

            if(true) {
            // if(this.voting.includes(cat)) {
                await this.sheetUser.addWithoutDuplicates("images", cat, ["File Name", reaction.message.id, "File Type", "UID", "User", reaction.count], ["KEEP", true, "KEEP", "KEEP", "KEEP", "CHANGE"]);
            }            
        }

    }

    async onConstruct(): Promise<void> {

        const files = await this.driveUser.getItemsInFolder(this.imagesFolder);

        for(const file of files) {
            if(file.mimeType === DriveUser.FOLDER) {
                this.categories.set(file.name, file.id);
            }
        }

        for (const id of this.approvedChannels) {

            let channel = await this.client.channels.fetch(id)

            // @ts-ignore
            const test: Map<string, Discord.Message> = await channel.messages.fetch({
                limit: 90
            })
        }

        console.log(this.categories);

        await this.sheetUser.onConstruct();

        // for (const id of this.approvedChannels) {

        //     let channel = await this.client.channels.fetch(id)

        //     // @ts-ignore
        //     const test: Map<string, Discord.Message> = await channel.messages.fetch({
        //         limit: 13
        //     })

        //     for(const key of test.keys()) {
        //         this.onMessage(test.get(key));
        //     }
        // }
    }

    capitilize(a:string) {
        return a[0].toUpperCase() + a.slice(1).toLowerCase();
    }
    
}
