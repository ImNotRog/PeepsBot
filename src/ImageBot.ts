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

    private jackFolder = '1JyzBfznVFXsuzv_fJYjdSrju5PDDrAZb';
    private approvedChannels = ['808469386746789938'];

    constructor(auth, client: Discord.Client) {
        this.client = client;
        this.driveUser = new DriveUser(auth);
        this.sheetUser = new SheetsUser(auth);
    }

    async onMessage(message: Discord.Message): Promise<void> {
        if(this.approvedChannels.includes(message.channel.id)) {
            if(message.attachments.size > 0) {

                console.log("Uploading!");
                
                const url = message.attachments.first().url;

                const filetype = url.slice(url.lastIndexOf('.') + 1);
                console.log(filetype);

                const path = `./temp/${message.id}.${filetype}`;

                let p:Promise<void> = new Promise((r,j) => {
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

                await this.driveUser.uploadFile(`${message.id}.${filetype}`, path, this.jackFolder);
            }
        }

    
    }

    async onConstruct(): Promise<void> {

    }
    
}
