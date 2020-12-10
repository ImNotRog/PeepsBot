const Discord = require("discord.js")
class ScremBot {
    constructor() {
        this.chars = ["a", "A"]
        this.cursedchars = ["a", "A", "ḁ̶̧̡͉̹͖̭̈͒͛͂́̀̐̿̎͆͛̓̕͠͝", "ä̷̢̨̛͓̙̗̗̼̝͇̦͖͙̦͚̳̪̘̟̩̘̤͚͕͈̩̭̦͎̱͉̘̳̣̫͙͎̫̜̬̝̺͇̮̲͔̮͔̯̀̃̓̌̀̀̆͛͐̃̆̈́͑͆̈́͌̔͒̋̋̔̃̐̂̿̉͂̂̆̈́͋̆̈́̀͒͘̕͘͝͠͝͝", "a̸̡̨̡̡̨̛̛̤̲̱̲̗͇̦̦͉͕̬͔̞̺͇̘̼̲̖̬̖͎̖̦̳̺̦̪̱͎͈͕͓̖͈͍̼͇͖̳͙̖͓̼͈̖̙͔̱͚̞̗̖̝̻̞̬̮͙̳̘̺͕̞̟̩͓̙͉͈̩͔͗̆̍͒̄͊̎̏̄̈́̿̇̂̓̌̈́͗͋͋͆̋͒͗͐̒̉̅̾̃̐̓̃͛̀̋͋͌̔̓͌̐͛̌̾̉̇́̑͛͛̋̊́̃̚͘̕͜͜͜͝͝͠͠͝͠ͅ", "Ằ̵̡̨̢̨̢̧̨̨̢̤͓͓̩͚̤̮͇̤͇̠̦̝̝̯͎͍̫̮̦̬̰̝̪͙͇̪̥̖̭͎̼͔̺̝͓͚̻̤̣̥̭̲̮̯̣̺̝͕͕̰͉͚͔̘̜̗͈̳͉̼̞̟͈̗̄̋́̉̿̇͒̅́̈́͆̄̔̍͆̒̀͂͒̄̾̅̚̚͝͠͝ͅͅ", "Á̵̧̦̟̘̯̩̱̥̰̹̙̮̲̹̀̽͊͛́̈́͐̓́́̋͋́̓͂̾̂̏͊̓̊̕̚͝͝"];
    }

    choice(arr) {
        return arr[Math.floor( arr.length * Math.random() )];
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

            if(i === num-1) space = true;

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

        let emphasis = [ ["","*"], ["", "**"], ["", "", "", "~~"], ["","__"] ];
        for(let i = 0; i < words.length; i++) {
            let curr = "";
            for(const emph of emphasis) {
                curr += this.choice(emph);
            }
            let rev = "";
            for(const char of curr) {
                rev = char + rev;
            }
            words[i] = curr + words[i] + rev;
        }
        
        msg = words.join(" ");

        return msg;
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async scream(message,args, cursed) {

        let def = args.length === 0;
        let num = args[0] ? parseInt(args[0]) : 32;
        if(isNaN(num)) num = 32;

        await message.delete();
        let author = message.author.username + "#" + message.author.discriminator;

        let msg = cursed ? this.curse(num) : this.screm(num);

        if (!def) msg = `"${msg}", 🎙️ **${author}** said calmly.`
        let sent;
        try {
            sent = await message.channel.send(msg);
        } catch(err) {
            message.channel.send(`Error: ${err}`)
            return;
        }
        
        if(def) {
            let msgs = [msg, ...Array(2).fill(0).map(() => cursed ? this.curse(num) : this.screm(num)), `🎙️ **${author}** said calmly.`];
            let curr = {stage: 2}
            let interval = setInterval(async () => {
                if(curr.stage > msgs.length) {
                    clearInterval(interval);
                    return;
                }
                let tosend = msgs.slice(0,curr.stage);
                curr.stage ++;
                try {
                    await sent.edit(tosend);
                } catch(err) {
                    clearInterval(interval);
                    return;
                }
            }, 1000);
        }
        
    }

    /**
     *
     * @param {Discord.Message} message
     */
    async void(message) {
        let sent = await message.channel.send({
            embed: {
                title: `Scream into the Void`,
                description: `Screm your inner rage and pain in this channel. --end to send the agony into the void.`,
                color: 7419530
            }
        })
        let total = 0;
        let totalchars = 0;
        while(true){ 
            let messages;
            try {
                messages = await message.channel.awaitMessages(() => true, { max: 1, errors: ["time"], time: 60 * 1000, });
            } catch(err) {
                break;
            }
            
            total ++;
            totalchars += message.content.length;

            message = messages.first();
            if(message.content.startsWith("--end")) {
                break;
            }
            
        }

        await message.channel.bulkDelete(total);

        sent.edit( {
            embed: {
                title: `Scream into the Void`,
                description: `Stress relief session ended. ${total} messages and ${totalchars} characters of pure agony and school-directed hatred were scremed into the void.`,
                color: 7419530
            }
        })
        
    }
}


module.exports = { ScremBot }