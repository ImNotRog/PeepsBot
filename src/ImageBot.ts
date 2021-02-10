import Discord = require("discord.js");
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";
import { DriveUser } from "./DriveUser";
import { SheetsUser } from "./SheetsUser";
import * as fs from 'fs';
import * as nodeFetch from 'node-fetch';
import * as https from 'https';

export class ImageBot implements Module {

    private client: Discord.Client;
    private readonly prefix: string = "--";
    private driveUser: DriveUser;
    private sheetUser: SheetsUser;

    private categories:Map<string,string>;
    private readonly imagesFolder = '1Bil_W-7kd43marLiwlL6nZ7nEZAUzKQ2';
    private readonly imagesSheet = '17iYieSC2zDKpxgSPqhk6fcJZQjVBvJFE5S5KS1IcON8';

    private jackFolder = '1JyzBfznVFXsuzv_fJYjdSrju5PDDrAZb';
    private approvedChannels = ['808469386746789938'];

    constructor(auth, client: Discord.Client) {
        this.client = client;
        this.driveUser = new DriveUser(auth);

        let map = new Map();
        map.set('images', this.imagesSheet);
        this.sheetUser = new SheetsUser(auth, map);

        this.categories = new Map();
    }

    async onMessage(message: Discord.Message): Promise<void> {
        if(this.approvedChannels.includes(message.channel.id)) {
            if(message.attachments.size > 0 && !message.author.bot) {

                console.log("Uploading!");

                const cat = message.content.length > 0 ? this.capitilize(message.content) : 'Archive';

                if (!this.categories.has(cat)) {
                    this.categories.set(cat, await this.driveUser.createFolder(cat,this.imagesFolder) );
                }

                const url = message.attachments.first().url;

                const filetype = url.slice(url.lastIndexOf('.') + 1);
                console.log(filetype);

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
