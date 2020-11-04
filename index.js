
/**
 * @todo Better Get system
 * @todo Add updates
 * @todo Currency
 */


const Discord = require("discord.js");

const client = new Discord.Client();

const { sheets, db, config } = require("./Authorize")
const { ProcessorBot } = require("./ProcessorBot");

(async () => {
    
    let processorbot = new ProcessorBot(sheets, db, client);

    await client.login(config);
    await processorbot.onConstruct(client);

    console.log("Up now!")

})();

