"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageBot = void 0;
const Discord = require("discord.js");
const ProcessMessage_1 = require("./ProcessMessage");
const DriveUser_1 = require("./DriveUser");
const SheetsUser_1 = require("./SheetsUser");
const Utilities_1 = require("./Utilities");
const fs = require("fs");
const https = require("https");
/**
 * @todo Fix category system
 */
class ImageBot {
    constructor(auth, client) {
        this.prefix = "--";
        this.imagesFolder = '1Bil_W-7kd43marLiwlL6nZ7nEZAUzKQ2';
        this.imagesSheet = '17iYieSC2zDKpxgSPqhk6fcJZQjVBvJFE5S5KS1IcON8';
        this.jackChannels = ['809143110302826497'];
        this.approvedChannels = ['808469386746789938', '809143110302826497'];
        this.voting = ['Jack', 'Nature'];
        this.client = client;
        this.driveUser = new DriveUser_1.DriveUser(auth);
        let map = new Map();
        map.set('images', this.imagesSheet);
        this.sheetUser = new SheetsUser_1.SheetsUser(auth, map);
        this.categoriesInfo = new Map();
        this.client.on("messageReactionAdd", (reaction, user) => { this.onReaction(reaction, user); });
        this.client.on("messageReactionRemove", (reaction, user) => { this.onReaction(reaction, user); });
        this.helpEmbed = {
            title: `Help - Image Bot`,
            description: `A bot that archives images in certain channels, then adds them to Google Drive for storage.`,
            fields: [
                {
                    name: `${this.prefix}[category]`,
                    value: `Enter the category, and it will send a randomly chosen image from that category. Any category name with spaces should have spaces replaced with "_"s.`
                },
                {
                    name: `${this.prefix}imagecategories`,
                    value: `Lists the categories.`
                },
                {
                    name: `${this.prefix}merge [from category] [to category]`,
                    value: `Merges two categories.`
                },
                {
                    name: `How to Add Images`,
                    value: `Whenever you post an image in one of the designated channels, it defaults to a certain category. ` +
                        `To override it, just enter the category name as the image caption when uploading. \n\n` +
                        `(There's actually a way to get more metadata into your photo, but 1. that's nerd shtuff and ` +
                        `2. it's so miserably overcomplicated that explaining it would exceed your goldfish attention span tenfold.)`
                }
            ]
        };
    }
    available(message) {
        return message.guild.id === '748669830244073533';
    }
    defaultCat(message) {
        return this.jackChannels.includes(message.channel.id) ? 'Jack' : 'Archive';
    }
    parseInfo(message) {
        const content = message.content;
        let cat = '';
        let cap = '';
        let tags = [];
        if (content.startsWith("```") && content.endsWith("```")) {
            let lines = content.split('\n');
            for (const line of lines) {
                if (line.includes(':')) {
                    let param = line.slice(0, line.indexOf(':'));
                    let value = line.slice(line.indexOf(':') + 1);
                    if (value.startsWith(' '))
                        value = value.slice(1);
                    if (param.startsWith('cat')) {
                        cat = value;
                    }
                    if (param.startsWith('cap')) {
                        cap = value;
                    }
                    if (param.startsWith('tag')) {
                        let tagstr = value;
                        while (tagstr.includes('"')) {
                            let first = tagstr.indexOf('"');
                            let second = tagstr.slice(first + 1).indexOf('"') + first + 1;
                            if (second === -1)
                                break;
                            let arg = tagstr.slice(first + 1, second);
                            tags.push(arg);
                            tagstr = tagstr.slice(0, first) + tagstr.slice(second + 1);
                        }
                        tags.push(...tagstr.split(' '));
                        tags = tags.filter(a => a !== "");
                    }
                }
            }
        }
        else {
            const args = content.split(' ');
            const argnums = Array(args.length).fill(-1);
            const dashargs = ['-cat', '-cap', '-tag'];
            for (let i = 0; i < args.length; i++) {
                argnums[i] = dashargs.indexOf(args[i]);
            }
            const until = (from, cond) => {
                let last = from;
                while (last < args.length) {
                    last++;
                    if (cond(argnums[last])) {
                        break;
                    }
                }
                return last;
            };
            let catarg = argnums.indexOf(0);
            if (catarg === -1) {
                if (argnums[0] === -1) {
                    cat = args.slice(0, until(0, (a) => a !== -1)).join(' ');
                }
            }
            else {
                cat = args.slice(catarg + 1, until(catarg, (a) => a !== -1)).join(' ');
            }
            let caparg = argnums.indexOf(1);
            if (caparg !== -1) {
                cap = args.slice(caparg + 1, until(caparg, (a) => a !== -1)).join(' ');
            }
            let tagarg = argnums.indexOf(2);
            let tagstr = '';
            if (tagarg !== -1) {
                tagstr = args.slice(tagarg + 1, until(tagarg, (a) => a !== -1)).join(' ');
                while (tagstr.includes('"')) {
                    let first = tagstr.indexOf('"');
                    let second = tagstr.slice(first + 1).indexOf('"') + first + 1;
                    if (second === -1)
                        break;
                    let arg = tagstr.slice(first + 1, second);
                    tags.push(arg);
                    tagstr = tagstr.slice(0, first) + tagstr.slice(second + 1);
                }
                tags.push(...tagstr.split(' '));
                tags = tags.filter(a => a !== "");
            }
            // -cat -cap -tag
            // return { cat };
        }
        if (cat === '')
            cat = this.defaultCat(message);
        cat = this.capitilize(cat);
        return { cat, cap, tags };
    }
    uploadFromDiscordToDrive(message, override) {
        return __awaiter(this, void 0, void 0, function* () {
            let obj = this.parseInfo(message);
            if (override) {
                obj = Object.assign(Object.assign({}, obj), override);
            }
            let { cat, cap, tags } = obj;
            if (!this.isCategory(cat)) {
                let approved = yield Utilities_1.Utilities.sendApprove(message, Object.assign({ title: `Create new Category "${cat}"?`, description: `Make sure this is what you meant to do.` }, Utilities_1.Utilities.embedInfo(message)), 10000);
                if (approved) {
                    // New category
                    this.categoriesInfo.set(cat, {
                        DID: yield this.driveUser.createFolder(cat, this.imagesFolder),
                        sheetscache: [[]]
                    });
                    yield this.sheetUser.createSubsheet("images", cat, {
                        columnResize: [200, 200, 100, 300, 200, 200, 300, 300, 100],
                        headers: ["File Name", "M-ID", "File Type", "D-ID", "UID", "User", "Caption", "Tags", "Stars"]
                    });
                }
                else {
                    cat = this.defaultCat(message);
                }
            }
            yield message.react('👀');
            const url = message.attachments.first().url;
            const filetype = url.slice(url.lastIndexOf('.') + 1);
            console.log(`Uploading ${filetype}, category ${cat}`);
            const path = `./temp/${message.id}.${filetype}`;
            let p = new Promise((r, j) => {
                https.get(url, (res) => {
                    res.on('end', () => {
                        r();
                    });
                    const writestream = fs.createWriteStream(path);
                    writestream.on('open', () => {
                        res.pipe(writestream);
                    });
                });
            });
            yield p;
            let id = yield this.driveUser.uploadFile(`${message.id}.${filetype}`, path, this.categoriesInfo.get(cat).DID);
            yield this.sheetUser.add("images", cat, [
                `${message.id}.${filetype}`,
                message.id,
                filetype,
                id,
                message.author.id,
                message.author.username + '#' + message.author.discriminator,
                cap,
                tags.join('|'),
                0
            ]);
            this.categoriesInfo.set(cat, Object.assign(Object.assign({}, this.categoriesInfo.get(cat)), { sheetscache: yield this.sheetUser.readSheet("images", cat) }));
            yield message.reactions.removeAll();
            yield message.react('✅');
        });
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.approvedChannels.includes(message.channel.id)) {
                if (message.attachments.size > 0 && !message.author.bot) {
                    yield this.uploadFromDiscordToDrive(message);
                }
            }
            else {
                if (message.attachments.size > 0 && !message.author.bot) {
                    message.react("⬆️");
                    message.react("❌");
                    let filter = (reaction, user) => {
                        return ["⬆️", "❌"].includes(reaction.emoji.name) && (!user.bot && message.guild.member(user)).hasPermission("ADMINISTRATOR");
                    };
                    try {
                        let reaction = yield message.awaitReactions(filter, {
                            max: 1,
                            time: 30000,
                            errors: ['time']
                        });
                        if (reaction.first().emoji.name === "❌") {
                            yield message.reactions.removeAll();
                        }
                        else {
                            yield this.uploadFromDiscordToDrive(message, { cat: "Archive", cap: message.content });
                        }
                    }
                    catch (err) {
                        yield message.reactions.removeAll();
                    }
                }
            }
            const result = ProcessMessage_1.PROCESS(message);
            if (result) {
                if (this.categoriesInfo.has(this.capitilize(result.command.replace(/_/g, " ")))) {
                    let time = Date.now();
                    const cat = this.capitilize(result.command.replace(/_/g, " "));
                    let msg = yield message.channel.send(`Fetching random "${cat}" image. Expect a delay of around 1-4 seconds.`);
                    let entries = this.categoriesInfo.get(cat).sheetscache.length - 1;
                    let index = Math.floor(Math.random() * entries) + 1;
                    let row = this.categoriesInfo.get(cat).sheetscache[index];
                    let DID = row[3];
                    let filename = row[0];
                    if (!this.inCache(filename)) {
                        yield this.driveUser.downloadFile(DID, `./temp/${filename}`);
                    }
                    const a = new Discord.MessageAttachment(`./temp/${filename}`);
                    yield message.channel.send(`Random image of category ${cat}`, a);
                    yield msg.edit(`Latency: ${Date.now() - time} ms`);
                }
                if (result.command === 'imagecategories') {
                    yield message.channel.send({
                        embed: Object.assign({ title: 'Image Categories', description: 'When using categories with spaces, replace spaces with _', fields: [
                                {
                                    name: 'Categories',
                                    value: this.listCategories().join('\n')
                                }
                            ] }, Utilities_1.Utilities.embedInfo(message))
                    });
                }
                if (result.command === 'merge') {
                    if (!message.member.hasPermission("ADMINISTRATOR")) {
                        yield message.channel.send(`You must have permission ADMINISTRATOR!`);
                        return;
                    }
                    let cats = result.args.slice(0, 2).map(a => a.replace(/_/g, ' ')).map(a => this.capitilize(a));
                    if (cats.length < 2) {
                        yield message.channel.send(`Invalid parameters! You must include two categories, the first one from, the second one to.`);
                        return;
                    }
                    if (!(this.isCategory(cats[0]) && this.isCategory(cats[1]) && cats[0] !== cats[1])) {
                        yield message.channel.send(`Invalid categories! ${cats}`);
                        return;
                    }
                    yield message.react('👀');
                    const { num } = yield this.merge(cats[0], cats[1]);
                    yield message.channel.send(`Success! ${num} images merged from ${cats[0]} into ${cats[1]}!`);
                    yield message.reactions.removeAll();
                    yield message.react('✅');
                }
            }
        });
    }
    inCache(filename) {
        return fs.existsSync(`./temp/${filename}`);
    }
    onReaction(reaction, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.approvedChannels.indexOf(reaction.message.channel.id) === -1)
                return;
            try {
                yield reaction.fetch();
            }
            catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                return;
            }
            if (reaction.emoji.name === "👍" && reaction.message.attachments.size > 0) {
                const { cat } = this.parseInfo(reaction.message);
                console.log(`${reaction.message.id} has ${reaction.count} in category ${cat}`);
                if (true) {
                    // if(this.voting.includes(cat)) {
                    yield this.sheetUser.addWithoutDuplicates("images", cat, ["File Name", reaction.message.id, "File Type", "D-ID", "UID", "User", "Caption", "Tags", reaction.count], ["KEEP", true, "KEEP", "KEEP", "KEEP", "KEEP", "KEEP", "KEEP", "CHANGE"]);
                    this.categoriesInfo.set(cat, Object.assign(Object.assign({}, this.categoriesInfo.get(cat)), { sheetscache: yield this.sheetUser.readSheet("images", cat) }));
                }
            }
        });
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield this.driveUser.getItemsInFolder(this.imagesFolder);
            for (const file of files) {
                if (file.mimeType === DriveUser_1.DriveUser.FOLDER) {
                    this.categoriesInfo.set(file.name, {
                        DID: file.id,
                        sheetscache: [[]]
                    });
                }
            }
            yield this.sheetUser.onConstruct();
            let valueranges = yield this.sheetUser.bulkRead("images");
            for (const valuerange of valueranges) {
                let range = valuerange.range;
                if (range) {
                    let cat = range.slice(0, range.lastIndexOf('!')).replace(/['"]/g, '');
                    this.categoriesInfo.set(cat, Object.assign(Object.assign({}, this.categoriesInfo.get(cat)), { sheetscache: valuerange.values }));
                }
            }
            for (const id of this.approvedChannels) {
                let channel = yield this.client.channels.fetch(id);
                // @ts-ignore
                const test = yield channel.messages.fetch({
                    limit: 90
                });
            }
        });
    }
    merge(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            let fromarr = this.categoriesInfo.get(from).sheetscache.slice(1);
            for (const row of fromarr) {
                let did = row[3];
                yield this.driveUser.moveFile(did, this.categoriesInfo.get(to).DID);
            }
            const num = fromarr.length;
            fromarr = fromarr.map(row => {
                let tags = row[7].split('|');
                tags.push(from);
                if (tags[0] === '')
                    tags = tags.slice(1);
                row[7] = tags.join('|');
                return row;
            });
            yield this.sheetUser.bulkAdd("images", to, fromarr);
            yield this.sheetUser.deleteSubSheet("images", from);
            yield this.driveUser.deleteFile(this.categoriesInfo.get(from).DID);
            this.categoriesInfo.delete(from);
            this.categoriesInfo.set(to, Object.assign(Object.assign({}, this.categoriesInfo.get(to)), { sheetscache: yield this.sheetUser.readSheet("images", to) }));
            return { num };
        });
    }
    capitilize(a) {
        return a[0].toUpperCase() + a.slice(1).toLowerCase();
    }
    isCategory(cat) {
        return this.categoriesInfo.has(cat);
    }
    listCategories() {
        return [...this.categoriesInfo.keys()];
    }
}
exports.ImageBot = ImageBot;
