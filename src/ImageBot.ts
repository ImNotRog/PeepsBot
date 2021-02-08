import Discord = require("discord.js");
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";
import { DriveUser } from "./DriveUser";
import * as fs from 'fs';
import * as nodeFetch from 'node-fetch';
import * as https from 'https';

export class ImageBot implements Module {

    private client: Discord.Client;
    private readonly prefix: string = "--";
    private driveUser: DriveUser;

    private jackFolder = '1JyzBfznVFXsuzv_fJYjdSrju5PDDrAZb';
    private approvedChannels = ['808469386746789938'];

    constructor(auth, client: Discord.Client) {
        this.client = client;
        this.driveUser = new DriveUser(auth);
    }

    async onMessage(message: Discord.Message): Promise<void> {
        if(this.approvedChannels.includes(message.channel.id)) {
            if(message.attachments.size > 0) {

                console.log("Uploading!");
                
                const url = message.attachments.first().url;
                const path = `./temp/${message.id}.png`;

                let p:Promise<void> = new Promise((r,j) => {
                    https.get(url, (res) => {
                        res.on('end', () => {
                            r();
                        })
                        res.pipe(fs.createWriteStream(path));
                    })
                })

                await p;

                await this.driveUser.uploadFile(`${message.id}.png`, path, this.jackFolder);
            }
        }

    
    }
    async onConstruct(): Promise<void> {
        
    }
    
}
