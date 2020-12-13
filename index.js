
/**
 * @todo Add help
 * @todo Add shop
 * @todo Add User Checkpoint Complete System 
 * @todo Add other assignments
 * @todo Add updates
 */
process.on('warning', e => console.warn(e.stack));

const Discord = require("discord.js");

const client = new Discord.Client();

const { sheets, db, config, MW } = require("./src/Authorize")
const { ProcessorBot } = require("./src/ProcessorBot");

(async () => {
    
    let processorbot = new ProcessorBot(sheets, db, client, MW);

    await client.login(config);
    await processorbot.onConstruct();

    console.log("Up now!")

})();

