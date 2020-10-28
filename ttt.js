
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const UPPERALPHABET = ALPHABET.toUpperCase();
const ALPHABETEMOJIS = "🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇱 🇲 🇳 🇴 🇵 🇶 🇷 🇸 🇹 🇺 🇻 🇼 🇽 🇾 🇿".split(" ")
/**
 * A TTT game class
 * @class
*/
class TTT {

    /**
     * @constructor
     * @param {Object} dbref - Database Reference to the Tic Tac Toe board
     */
    constructor(dbref) {
        
        this.ref = dbref;

        this.board = [[]];
        this.status = 0;
        this.get();

        this.turn = 1;

        this.XEMOJI = "<:obamaprism:748993582043627622>";
        this.OEMOJI = "<:obamasphere:750493919661260800>";
        this.NONEEMOJI = "⬛";
        this.NL = "\n"
        this.DIVIDER = "|"
        this.BLANK = "\\_"

        this.X = "Obama Prism";
        this.O = "Obama Sphere";

    }

    /**
     * @async 
     * @returns {number[][]} - Retrieves 
     */
    async get() {
        this.board = (await this.ref.once("value")).val();
        return this.board;
    }

    /**
     * 
     */
    set() {
        this.ref.set(this.board);
    }

    /**
     * Checks the status of the board
     * @returns {number} - 0 for neutral, 1 if 1 won, 2 if 2 won, 3 if cat's tie
     */
    check() {
        
        this.status = 0;
        
        /* Checks rows */
        for(let i = 0; i < this.board.length; i++){
            if(this.board[i][0] === this.board[i][1] && this.board[i][0] === this.board[i][2] && this.board[i][0] !== 0){
                this.status = this.board[i][0];
            }
        }

        /* Checks columns */
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[0][i] === this.board[1][i] && this.board[0][i] === this.board[2][i] && this.board[0][i] !== 0) {
                this.status = this.board[0][i];
            }
        }

        /* Diagonals */
        if (this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2] && this.board[0][0] !== 0) this.status = this.board[0][0];
        if (this.board[2][0] === this.board[1][1] && this.board[1][1] === this.board[0][2] && this.board[2][0] !== 0) this.status = this.board[2][0];

        if(this.status === 0){
            let allFilled = true;
            for (let i = 0; i < this.board.length; i++) {
                for (let j = 0; j < this.board.length; j++) {
                    if (this.board[i][j] === 0) { allFilled = false; break; }
                }
            }
            if(allFilled){
                this.status = 3;
            }
        }

        return this.status;

    }

    /**
     * @async
     */
    async clear() {
        this.board = [[0,0,0],[0,0,0],[0,0,0]];
        this.turn = 1;
        this.check();
        this.set();
    }

    /**
     * Returns a message for the status
     * @returns {string} - a string for the status
     */
    statusText() {
        this.check();
        if(this.status === 0){
            return "Game is still in session.";
        } else if(this.status === 1) {
            return "Player 1 has won."
        } else if(this.status === 2) {
            return ("Player 2 has won.");
        } else {
            return "It was a tie.";
        }
    }

    /**
     * Returns whether its ended
     * @returns {boolean} - whether's its over
     */
    ended() {
        this.check();
        return this.status !== 0;
    }

    /**
     * @returns {Object} - returns representations
     */
    representations() {
        let text = "";
        let moves = "";

        let available = [];

        let emojitext = "";
        let emojimoves = "";

        for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board[i].length; j++) {

                if (this.board[i][j] === 0) {

                    text += this.BLANK;
                    moves += UPPERALPHABET[3 * i + j];
                    available.push(3 * i + j);
                    emojitext += this.NONEEMOJI;
                    emojimoves += ALPHABETEMOJIS[3*i + j];

                } else if (this.board[i][j] === 1) {
                    text += this.X;
                    moves += this.X;
                    emojitext += this.XEMOJI;
                    emojimoves += this.XEMOJI;
                } else {
                    text += this.O;
                    moves += this.O;
                    emojitext += this.OEMOJI;
                    emojimoves += this.OEMOJI;
                }

                emojimoves += " ";
                emojitext += " ";
                text += this.DIVIDER;
                moves += this.DIVIDER;

            }
            text += this.NL;
            moves += this.NL;
            emojitext += this.NL;
            emojimoves += this.NL;
        }

        const emojis = [];

        for (const num of available) {

            emojis.push(ALPHABETEMOJIS[num]);

        }

        return { text, moves, available, emojis, emojitext, emojimoves };

    }

    /**
     * @returns {string} - returns "Player 1" or "Player 2"
     */
    getPlayer() {
        return "Player " + this.turn + ", playing " + (this.turn === 1 ? this.X : this.O) ;
    }

    /**
     * @param {number} placement - placement
     */
    move(placement) {
        let i = Math.floor(placement/3);
        let j = placement % 3;
        this.board[i][j] = this.turn;
        this.turn = 3 - this.turn;
        this.set();
    }
    
    /**
     * Passes the turn
     */
    pass(){
        this.turn = 3 - this.turn;
    }

    /**
     * @param {string} emojistr - string of emoji
     */
    moveWithEmoji(emojistr) {
        const placement = ALPHABETEMOJIS.indexOf(emojistr);
        this.move(placement);
    }

}

/**
 * A text bot that parses commands for a TTT game
 * @class
 */
class TTTbot { 
    /**
     * @constructor
     * @param {Object} dbref - Database reference
     */
    constructor(dbref) {
        this.ttt = new TTT(dbref);

        this.running = true;

        this.players = ["","",""];

        this.DOGGO1 = "https://lh3.googleusercontent.com/pw/ACtC-3dcVBptJlQ3_jIEjuQOUYytgaWf86H7ki93UR4nCOrPDPImMG9PPbm5peZLsi-ibviO5Qb3k4SCCVPoxc61xgTOo4ha6d5Zy7usNJFYjIyqi_N608rMxuEt63xL3xqfPOszDGkwtA3q-5lz1TxGwKdL=w1238-h928-no?authuser=0";
        this.DOGGO2 = "https://lh3.googleusercontent.com/10EsBINt0tqsyJ_IOR_I71S4MjcmZTrUI-Zp_heNDPNPLBdmgArgReAqSBtaQj2p3ox9FYWOSi5SyCsVLqsEsVBAmJEz3NrGHDqC6FDawSJ25-Rv4lNVhpjRqfDf9Y0OECSn5M4p0zLKqo_vCeFzznXgYgN6c3NONxoAaYhPmiTFI8z6xwAP19s-nLo4AbvP6zvfIuZ58iv3wk2pN2lBdkZlKF5UfpoVWEP1-cxZ4NumJvthfPowcO9L0lALt911aVCGXTuevThyWB7Sr_E_wXf9wgNVgX0iQO2iP1meWyILBowPu6zeue6i2uOJhS8ptAIRfSm2EHaf-4oZdRO4QrkwkhJQYSnR5FLSQxr4e5oADdQJHIhcsuFj7DGxRmzeHw5DJg0CpiDKRIeYTGjVLwZ-UZyrIuJkfT6WBtCT43HKuRJgM_73oiF8dTOy58veQPV43DcdepBXP9gGNrrPuL1NwjWYF1GrZHxblSkmMsZi_V4bZmAZlW0dOFDBrA36C_2p99y-CSCEccpIb7g8FtMCChymNaKiti3nRpWSuAVTMxaT7HjOic_4DmM5tLbs6IEOdtWvx8SYtOuSkV7qwoa3wHE5qHDRumJjynBtszTPtGIUNgaaeWIdb2p8JXL-wK0B-biBLO4Rq1zLEBD7EhthcSpK1yzF9mnM3aXYwde2wL2N8Szke2jxxi4Vrw=w696-h928-no?authuser=0";

    }

    /**
     * Stops the game
     */
    stop() {
        this.running = false;
    }

    /**
     * @async
     * @param {Discord.Message} message - the message that was received
     * @param {string[]} args - arguments
     */
    async onTTT (message, args) {

        try {
            if (args[0] === "COM") {
                throw "Computer not set up."
            } else if (args[0] && args[0].endsWith(">") && args[0].startsWith("<@!")) {
                this.players[1] = message.author.id;
                this.players[2] = args[0].slice(3,args[0].length - 1);
            } else {
                throw "Invalid arg";
            }

            this.playersmessage = await message.channel.send(`Player 1: <@!${this.players[1]}>, Player 2: <@!${this.players[2]}>`);
            this.currplayer = await message.channel.send("Please wait for the emojis to load...")
            this.actualboard = await message.channel.send("Please wait for the emojis to load...");
            this.movesboard = await message.channel.send("Please wait for the emojis to load...");
            this.embed = await message.channel.send("Info:");


            let promises = [];
            for (const emoji of ALPHABETEMOJIS.slice(0,9)) {

                promises.push(this.embed.react(emoji));

            }

            await Promise.all(promises);

        } catch(err) {
            message.reply("There was an error.");
            return;
        }

        this.clear();
        await this.sendTurn();

    }

    /**
     * 
     */
    clear() {
        this.ttt.clear();
        this.running = true;
    }

    ended() {
        return !this.running;
    }

    /**
     * @return
     */
    createEmbed() {
        return new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Tic Tac Toe')
            .setURL('https://photos.app.goo.gl/78opUCCzf6ZmJzDh8')
            .setAuthor('PeepsBot', this.DOGGO2, 'https://photos.app.goo.gl/78opUCCzf6ZmJzDh8')
            .setDescription('Playing TTT. Please wait until all the reactions have been finished before reacting yourself.')
            .setThumbnail(this.DOGGO1)

            .addFields({
                name: "Player",
                value: this.ttt.getPlayer()
            })

            .setTimestamp()
            .setFooter('TTT', this.DOGGO2);
    }

    /**
     * @param {Discord.Collection} collected
     */
    moveWith(collected) {
        const reaction = collected.first().emoji.name;
        this.ttt.moveWithEmoji(reaction);

        if (this.ttt.ended()) {
            // this.embed.reply(this.ttt.statusText());
            this.running = false;
            this.end();
        } else {
            this.sendTurn();
        }
    }

    /**
     * 
     */
    async end() {
        await this.ttt.get();

        const { text, moves, emojitext, emojis, emojimoves } = this.ttt.representations();

        this.currplayer.edit(this.ttt.statusText());
        this.actualboard.edit(emojitext)
        this.movesboard.delete();

        const embed = this.createEmbed();

        await this.embed.edit(embed);
    }

    /**
     * 
     */
    sendError(){
        if (!this.ended()) {
            this.embed.channel.send("<@!" + this.players[this.ttt.turn] + ">, you didn't react.");

            this.ttt.pass();

            this.sendTurn();
        }
    }

    /**
     * @async
     */
    async sendTurn() {

        if(!this.running) return;

        await this.ttt.get();

        const { text, moves, emojitext, emojis, emojimoves } = this.ttt.representations();
        
        this.currplayer.edit(`It's Player ${this.ttt.turn}'s turn.`)
        this.actualboard.edit(emojitext)
        this.movesboard.edit(emojimoves)

        const embed = this.createEmbed();

        await this.embed.edit(embed);

        const filter = (reaction, user) => {
            return emojis.includes(reaction.emoji.name) && user.id === this.players[this.ttt.turn];
        };

        this.embed.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
            .then(collected => {
                this.moveWith(collected);
            })
            .catch(collected => {
                this.sendError();
            });
    }

}