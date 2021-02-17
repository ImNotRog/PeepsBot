import * as Discord from "discord.js";
import { Module } from "./Module";
import { PROCESS } from "./ProcessMessage";

export class ScremBot implements Module {

    private readonly prefix = '--';
    private readonly chars: string[] = ["a", "A"];
    private readonly cursedchars: string[] = ["a", "A", "ḁ̶̧̡͉̹͖̭̈͒͛͂́̀̐̿̎͆͛̓̕͠͝", "ä̷̢̨̛͓̙̗̗̼̝͇̦͖͙̦͚̳̪̘̟̩̘̤͚͕͈̩̭̦͎̱͉̘̳̣̫͙͎̫̜̬̝̺͇̮̲͔̮͔̯̀̃̓̌̀̀̆͛͐̃̆̈́͑͆̈́͌̔͒̋̋̔̃̐̂̿̉͂̂̆̈́͋̆̈́̀͒͘̕͘͝͠͝͝", "a̸̡̨̡̡̨̛̛̤̲̱̲̗͇̦̦͉͕̬͔̞̺͇̘̼̲̖̬̖͎̖̦̳̺̦̪̱͎͈͕͓̖͈͍̼͇͖̳͙̖͓̼͈̖̙͔̱͚̞̗̖̝̻̞̬̮͙̳̘̺͕̞̟̩͓̙͉͈̩͔͗̆̍͒̄͊̎̏̄̈́̿̇̂̓̌̈́͗͋͋͆̋͒͗͐̒̉̅̾̃̐̓̃͛̀̋͋͌̔̓͌̐͛̌̾̉̇́̑͛͛̋̊́̃̚͘̕͜͜͜͝͝͠͠͝͠ͅ", "Ằ̵̡̨̢̨̢̧̨̨̢̤͓͓̩͚̤̮͇̤͇̠̦̝̝̯͎͍̫̮̦̬̰̝̪͙͇̪̥̖̭͎̼͔̺̝͓͚̻̤̣̥̭̲̮̯̣̺̝͕͕̰͉͚͔̘̜̗͈̳͉̼̞̟͈̗̄̋́̉̿̇͒̅́̈́͆̄̔̍͆̒̀͂͒̄̾̅̚̚͝͠͝ͅͅ", "Á̵̧̦̟̘̯̩̱̥̰̹̙̮̲̹̀̽͊͛́̈́͐̓́́̋͋́̓͂̾̂̏͊̓̊̕̚͝͝"];
    private client: Discord.Client;
    private readonly voidchannels = ["750804960333135914", "748670606085587060"];
    public helpEmbed: { title: string; description: string; fields: { name: string; value: string; }[]; };
    
    constructor(client:Discord.Client) {
        this.client = client;
        this.helpEmbed = {
            title: `Help - Screm Bot`,
            description: `Born from the collective suffering of Bio H students, Screm Bot is the embodied voice of pure pain.`,
            fields: [
                {
                    name: `${this.prefix}void`,
                    value: `Scream into the void! Once active, everything you spam will be deleted upon sending ${this.prefix}end.`
                },
                {
                    name: `${this.prefix}screm`,
                    value: this.screm(50)
                },
                {
                    name: `${this.prefix}cursedscrem`,
                    value: this.curse(50)
                }
            ]
        }
    }

    available(message: Discord.Message): boolean {
        return true;
    }

    async onMessage(message: Discord.Message): Promise<void> {
        const result = PROCESS(message);
        if(result) {
            if (result.command === "scream" || result.command === "screm") {
                this.scream(message, result.args, false);
            }
            if (result.command === "cursedscrem") {
                this.scream(message, result.args, true);
            }
            if ( this.voidchannels.includes(message.channel.id) &&
                (result.command === "void" || result.command === "screamintothevoid" || result.command === "scremintothevoid") ){
                this.void(message);
            }
        }
    }

    async onConstruct(): Promise<void> { }

    choice(arr) {
        return arr[Math.floor(arr.length * Math.random())];
    }

    screm(num) {
        return this.generateScrem(num, this.chars)
    }

    curse(num) {
        return this.generateScrem(num, this.cursedchars)
    }

    generateScrem(num, chars) {
        let msg = "";
        let space = true;


        for (let i = 0; i < num; i++) {

            if (i === num - 1) space = true;

            let letter;
            if (space) {
                letter = this.choice(chars);
                space = false;
            } else {
                letter = this.choice([...chars, " "]);
                if (letter === " ") {
                    space = true;
                }
            }
            msg += letter;
        }

        let words = msg.split(" ");

        let emphasis = [["", "*"], ["", "**"], ["", "", "", "~~"], ["", "__"]];
        for (let i = 0; i < words.length; i++) {
            let curr = "";
            for (const emph of emphasis) {
                curr += this.choice(emph);
            }
            let rev = "";
            for (const char of curr) {
                rev = char + rev;
            }
            words[i] = curr + words[i] + rev;
        }

        msg = words.join(" ");

        return msg;
    }

    async scream(message: Discord.Message, args: string[], cursed: boolean) {

        let def = args.length === 0;
        let num = args[0] ? parseInt(args[0]) : 32;
        if (isNaN(num)) num = 32;

        await message.delete();
        let author = message.author.username + "#" + message.author.discriminator;

        let msg = cursed ? this.curse(num) : this.screm(num);

        if (!def) msg = `"${msg}", 🎙️ **${author}** said calmly.`
        let sent;
        try {
            sent = await message.channel.send(msg, { allowedMentions: { parse: [] } });
        } catch (err) {
            message.channel.send(`Error: ${err}`, { allowedMentions: { parse: [] } })
            return;
        }

        if (def) {
            let msgs = [msg, ...Array(2).fill(0).map(() => cursed ? this.curse(num) : this.screm(num)), `🎙️ **${author}** said calmly.`];
            let curr = { stage: 2 }
            let interval = setInterval(async () => {
                if (curr.stage > msgs.length) {
                    clearInterval(interval);
                    return;
                }
                let tosend = msgs.slice(0, curr.stage);
                curr.stage++;
                try {
                    await sent.edit(tosend);
                } catch (err) {
                    clearInterval(interval);
                    return;
                }
            }, 1000);
        }

    }

    async void(message: Discord.Message): Promise<void> {

        let sent = await message.channel.send({
            embed: {
                title: `Scream into the Void`,
                description: `Screm your inner rage and pain in this channel. --end to send the agony into the void.`,
                color: 7419530
            }
        })
        let total = 0;
        let totalchars = 0;
        while (true) {
            let messages;
            try {
                messages = await message.channel.awaitMessages(() => true, { max: 1, errors: ["time"], time: 60 * 1000, });
            } catch (err) {
                break;
            }

            total++;
            totalchars += message.content.length;

            message = messages.first();
            if (message.content.startsWith("--end")) {
                break;
            }

        }

        if (message.channel instanceof Discord.TextChannel) {
            await message.channel.bulkDelete(total);

            sent.edit({
                embed: {
                    title: `Scream into the Void`,
                    description: `Stress relief session ended. ${total} messages and ${totalchars} characters of pure agony and school-directed hatred were scremed into the void.`,
                    color: 7419530
                }
            })

        }



    }
}
