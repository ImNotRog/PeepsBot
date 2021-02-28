import { Module } from "./Module";
import * as Discord from "discord.js"
import * as nodecron from "node-cron";
import * as fs from "fs";

export class PianoManBot implements Module {
    public name: "Piano Man Bot";

    private pianoManChannel = ['750804960333135914'];
    private client: Discord.Client;

    constructor(client: Discord.Client) {
        this.client = client;
    }

    async onConstruct() {
        nodecron.schedule("* * * * *", () => {
            this.pianoMan();
        })
    }

    pianoMan() {

    }
}