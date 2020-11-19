const Discord = require('discord.js');


class ReactBot {
    constructor() {
        this.reactmap = new Map();
        this.reactmap.set("little", "754075455304499211")
        this.reactmap.set("trg", "776946465780006913")
        this.reactmap.set("checkpoint", "776946929706729482");
        this.reactmap.set("cer", "776947387796029451");
        this.reactmap.set("pain", "776522384642932766");
        this.reactmap.set("fperbio", "776522302669062154");
        this.reactmap.set("hw", "755144784083026101");

        this.carrot = "🥕"

        this.fs = ["f", "<:bfruh:776525118330503189>"]
        this.f = "776525118330503189"


        this.chainmap = new Map();
        this.chainmap.set("🥕",
            [
                {
                    value: "^",
                    method: "CONTAINS"
                }
            ]);
        this.chainmap.set("776525118330503189",
            [
                {
                    value: "f",
                    method: "ONLY"
                },
                {
                    value: "<:bfruh:776525118330503189>",
                    method: "ONLY"
                }
            ]);
        // brr

    }

    isChain(content,chainobj) {
        return [false, ...chainobj].reduce((prev,curr) => {
            if(curr.method === "ONLY") {
                // Poorly written code here v
                for(let i = 0; i < content.length; ) {
                    if(i >= content.length || content.slice(i, i+curr.value.length) !== curr.value) {
                        return prev;
                    } else {
                        i += curr.value.length;
                        if(i >= content.length) {
                            return true;
                        } else if(content[i] === " ") {
                            i++;
                        } 
                        if (i >= content.length) {
                            return true;
                        }
                    }
                }
            } else if(curr.method === "CONTAINS") {
                return prev || content.includes(curr.value);
            }
        })
    }

    /**
     * 
     * @param {Discord.Message} msg 
     */
    async onMessage(msg) {
        for(const key of this.reactmap.keys()) {
            if( msg.content.toLowerCase().includes(key) ){
                msg.react(this.reactmap.get(key));
            }
        }

        for(const emoji of this.chainmap.keys()) {
            if(this.isChain(msg.content, this.chainmap.get(emoji))) {
                let messages = await msg.channel.messages.fetch({
                    limit: 10
                })

                for (const key of messages.keyArray().slice(1)) { 
                    if (!this.isChain(messages.get(key).content, this.chainmap.get(emoji))) {
                        messages.get(key).react(emoji);
                        break;
                    }
                }
            }
        }
        
    }
}

module.exports = { ReactBot };
