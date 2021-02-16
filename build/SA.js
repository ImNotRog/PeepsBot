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
exports.SFile = exports.Course = exports.User = exports.SchoologyAccessor = void 0;
const crypto = require("crypto");
const OAuth = require("oauth-1.0a");
const nodefetch = require("node-fetch");
const Utilities_1 = require("./Utilities");
const dotenv = require("dotenv");
dotenv.config();
class SchoologyAccessor {
    constructor() { }
    ;
    static get(path) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield SchoologyAccessor.rawGet(SchoologyAccessor.base + path);
            if (!res.ok)
                console.log(res);
            return res;
        });
    }
    static rawGet(path) {
        return __awaiter(this, void 0, void 0, function* () {
            if (SchoologyAccessor.num.num >= 0) {
                let awaitpromise = new Promise((r, j) => {
                    let int = setInterval(() => {
                        if (SchoologyAccessor.num.num < 0) {
                            SchoologyAccessor.num.num++;
                            r();
                            clearInterval(int);
                        }
                    }, 1000);
                });
                yield awaitpromise;
            }
            SchoologyAccessor.num.num++;
            const url = path;
            const method = "GET";
            function hash_function_sha1(base_string, key) {
                return crypto
                    .createHmac('sha1', key)
                    .update(base_string)
                    .digest('base64');
            }
            // @ts-ignore
            const oauth = OAuth({
                consumer: this.token,
                signature_method: 'HMAC-SHA1',
                hash_function: hash_function_sha1,
            });
            // @ts-ignore
            return yield nodefetch(url, {
                method,
                headers: oauth.toHeader(oauth.authorize({ url, method })),
            });
        });
    }
    static methodswithdata(path, data, method) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = SchoologyAccessor.base + path;
            function hash_function_sha1(base_string, key) {
                return crypto
                    .createHmac('sha1', key)
                    .update(base_string)
                    .digest('base64');
            }
            // @ts-ignore
            const oauth = OAuth({
                consumer: this.token,
                signature_method: 'HMAC-SHA1',
                hash_function: hash_function_sha1,
            });
            // @ts-ignore
            return yield nodefetch(url, {
                method,
                body: JSON.stringify(data),
                headers: Object.assign({ 'Content-Type': "application/json" }, oauth.toHeader(oauth.authorize({ url, method }))),
            });
        });
    }
    static post(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield SchoologyAccessor.methodswithdata(path, data, "POST");
        });
    }
    static put(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield SchoologyAccessor.methodswithdata(path, data, "PUT");
        });
    }
    static delete(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield SchoologyAccessor.methodswithdata(path, data, "DELETE");
        });
    }
    // ADVANCED METHODS
    static listCourses(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = (yield SchoologyAccessor.get(`/users/${id}/sections`));
            const data = (yield res.json()).section;
            return data;
        });
    }
    static listAssignments(sectionid) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = (yield SchoologyAccessor.get(`/sections/${sectionid}/assignments`));
            const data = (yield res.json()).assignment;
            return data;
        });
    }
    static getFolder(courseid, folderid) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = (yield SchoologyAccessor.get(`/courses/${courseid}/folder/${folderid ? folderid : ''}`));
            try {
                const data = (yield res.json());
                return data;
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    static getPage(sectionid, pageid) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = (yield SchoologyAccessor.get(`/sections/${sectionid}/pages/${pageid}`));
            const data = (yield res.json());
            return data;
        });
    }
    static getDocument(sectionid, documentid) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = (yield SchoologyAccessor.get(`/sections/${sectionid}/documents/${documentid}`));
            const data = (yield res.json());
            return data;
        });
    }
    static getAssignment(sectionid, assignmentid) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = (yield SchoologyAccessor.get(`/sections/${sectionid}/assignments/${assignmentid}`));
            const data = (yield res.json());
            return data;
        });
    }
    static getAlbum(sectionid, albumid) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = (yield SchoologyAccessor.get(`/sections/${sectionid}/albums/${albumid}`));
            const data = (yield res.json());
            return data;
        });
    }
    static getDiscussion(sectionid, discussionid) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = (yield SchoologyAccessor.get(`/sections/${sectionid}/discussions/${discussionid}`));
            const data = (yield res.json());
            return data;
        });
    }
}
exports.SchoologyAccessor = SchoologyAccessor;
// BASIC METHODS
SchoologyAccessor.base = 'https://api.schoology.com/v1';
SchoologyAccessor.token = { key: process.env.schoology_key, secret: process.env.schoology_secret };
SchoologyAccessor.num = { num: 0 };
setInterval(() => {
    SchoologyAccessor.num.num = -15;
}, 1000);
class User {
    constructor(id) {
        this.id = "2016549";
        this.courses = [];
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            let courses = yield SchoologyAccessor.listCourses(this.id);
            let promises = [];
            for (const course of courses) {
                let c = (new Course(course));
                promises.push(c.onConstruct());
                this.courses.push(c);
            }
            yield Promise.all(promises);
        });
    }
}
exports.User = User;
class Course {
    constructor(data) {
        this.data = data;
    }
    getData() {
        return this.data;
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            const baseInfo = yield SchoologyAccessor.getFolder(this.data.id);
            this.baseFolder = new SFile(this, baseInfo.self);
            yield this.baseFolder.onConstructRecursive();
        });
    }
}
exports.Course = Course;
class SFile {
    constructor(...params) {
        if (typeof params[2] === "string") {
        }
        else {
            const [course, data, parent] = params;
            this.course = course;
            this.data = data;
            this.parent = null;
            this.base = true;
            this.cached = false;
            this.fulldatacache = null;
            this.children = [];
            if (parent) {
                this.parent = parent;
                this.base = false;
            }
            this.type = this.data.type;
            this.name = this.data.title;
            this.id = this.data.id;
        }
    }
    onConstructRecursive() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.type === "folder") {
                const me = yield SchoologyAccessor.getFolder(this.course.getData().id, this.id);
                if (me) {
                    this.fulldatacache = me;
                    this.cached = true;
                    if (me['folder-item']) {
                        let promises = [];
                        for (const child of me["folder-item"]) {
                            const childfile = new SFile(this.course, child, this);
                            promises.push(childfile.onConstructRecursive());
                            this.children.push(childfile);
                        }
                        yield Promise.all(promises);
                    }
                }
            }
        });
    }
    getSnippet() {
        return this.data;
    }
    getData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cached) {
                return this.fulldatacache;
            }
            if (this.type === "assignment" || this.type === "managed_assessment" || this.type === "assessment_v2") {
                const me = yield SchoologyAccessor.getAssignment(this.course.getData().id, this.id);
                this.fulldatacache = me;
                this.cached = true;
                return me;
            }
            if (this.type === "document") {
                const me = yield SchoologyAccessor.getDocument(this.course.getData().course_id, this.id);
                this.fulldatacache = me;
                this.cached = true;
                return me;
            }
            if (this.type === "page") {
                const me = yield SchoologyAccessor.getPage(this.course.getData().id, this.id);
                this.fulldatacache = me;
                this.cached = true;
                return me;
            }
            if (this.type === "media-album") {
                const me = yield SchoologyAccessor.getAlbum(this.course.getData().id, this.id);
                this.fulldatacache = me;
                this.cached = true;
                return me;
            }
            if (this.type === "discussion") {
                const me = yield SchoologyAccessor.getDiscussion(this.course.getData().id, this.id);
                this.fulldatacache = me;
                this.cached = true;
                return me;
            }
        });
    }
    listAllChildren() {
        if (this.type !== "folder") {
            return [this];
        }
        else {
            return [this, ...this.children.reduce((acc, file) => acc.concat(file.listAllChildren()), [])];
        }
    }
    wordSearch(str) {
        let allchildren = (this.listAllChildren());
        allchildren.sort((a, b) => {
            return Utilities_1.Utilities.RatcliffObershelpCustom(str, b.data.title) - Utilities_1.Utilities.RatcliffObershelpCustom(str, a.data.title);
        });
        return allchildren;
    }
    find(suchthat) {
        if (suchthat(this)) {
            return this;
        }
        else if (this.type === "folder") {
            return this.children.find(suchthat);
        }
        else {
            return false;
        }
    }
    findall(suchthat) {
        return this.listAllChildren().filter(suchthat);
    }
    toEmbedFields() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.getData();
            let fields = [];
            fields.push({
                name: `Name`,
                value: `${this.icon()} ${this.name}`,
                inline: false
            });
            fields.push({
                name: `Type`,
                value: `${this.type}`,
                inline: true
            });
            fields.push({
                name: `ID`,
                value: `${this.id}`,
                inline: true
            });
            if (!this.base) {
                fields.push({
                    name: `Parent Folder ID`,
                    value: `${this.parent.data.id}`,
                    inline: true
                });
            }
            if (this.data.body.length > 0) {
                fields.push({
                    name: `Description`,
                    value: `${this.data.body}`
                });
            }
            if (this.type === "assignment" || this.type === "managed_assessment" || this.type === "assessment_v2") {
                // @ts-ignore
                let d = data;
                fields.push({
                    name: `Assignment Type`,
                    value: `${d.assignment_type}`,
                    inline: true
                });
                fields.push({
                    name: `Due`,
                    value: `${d.due}`,
                    inline: true
                });
                fields.push({
                    name: `Type`,
                    value: `${d.type}`,
                    inline: true
                });
            }
            if (this.type === "document") {
                // @ts-ignore
                let d = data;
                fields.push({
                    name: `Link`,
                    value: `${d.attachments.links.link[0].url}`,
                    inline: true
                });
            }
            if (this.type === "page") {
                // @ts-ignore
                let d = data;
            }
            if (this.type === "folder") {
                // @ts-ignore
                let d = data;
                fields.push({
                    name: `Color`,
                    value: `${d.self.color}`,
                    inline: true
                });
                fields.push({
                    name: `Children`,
                    value: `${this.children.map(child => child.toString(1)).join('\n')}`,
                    inline: false
                });
            }
            if (this.type === "media-album") {
                // @ts-ignore
                let d = data;
                fields.push({
                    name: `Cover Image`,
                    value: `${d.cover_image_url}`,
                    inline: false
                });
                fields.push({
                    name: `Audio Count`,
                    value: `${d.audio_count}`,
                    inline: true
                });
                fields.push({
                    name: `Image Count`,
                    value: `${d.photo_count}`,
                    inline: true
                });
                fields.push({
                    name: `Video Count`,
                    value: `${d.video_count}`,
                    inline: true
                });
            }
            if (this.type === "discussion") {
                // @ts-ignore
                let d = data;
                fields.push({
                    name: `Requires Post to See?`,
                    value: `${d.require_initial_post === 1 ? "Yes" : "No"}`,
                    inline: true
                });
            }
            fields.push({
                name: `Schoology Link`,
                value: `${this.link()}`
            });
            let fieldsfinal = [];
            for (const field of fields) {
                fieldsfinal.push({
                    name: field.name,
                    value: (field.value.length >= 1024 ? field.value.slice(0, 1000) + '...' : field.value.length > 0 ? field.value : 'N/A').replace(/\n\n+/g, '\n'),
                    inline: field.inline
                });
            }
            return fieldsfinal;
        });
    }
    icon() {
        switch (this.type) {
            case "assessment_v2":
            case "managed_assessment":
            case "assignment":
                return "🗒️";
            case "document":
                return "🔗";
            case "folder":
                return "📁";
            case "page":
                return "📄";
            case "media-album":
                return "🖼️";
            case "discussion":
                return "💬";
            default:
                return "-";
        }
    }
    toString(num) {
        if (!num || (num === 0) || this.type !== "folder") {
            return `${this.icon()} ${this.name} - ${this.id}`;
        }
        else {
            return `${this.icon()} ${this.name} - ${this.id}\n${this.children.map(a => `--> ${a.toString(num - 1)}`).join('\n')}`;
        }
    }
    link() {
        switch (this.type) {
            case "assessment_v2":
                return `https://pausd.schoology.com/course/${this.course.data.id}/assessments/${this.id}`;
            case "managed_assessment":
                return `https://pausd.schoology.com/course/${this.course.data.id}/common-assessment/${this.id}`;
            case "assignment":
                return `https://pausd.schoology.com/assignment/${this.id}/info`;
            case "folder":
                return `https://pausd.schoology.com/course/${this.course.data.id}/materials?f=${this.id}`;
            case "page":
                return `https://pausd.schoology.com/page/${this.id}`;
            case "media-album":
                return `https://pausd.schoology.com/album/${this.id}`;
            case "document":
                return this.parent.link();
            case "discussion":
                return `https://pausd.schoology.com/course/${this.course.data.id}/materials/discussion/view/${this.id}`;
            default:
                return "N/A";
        }
    }
}
exports.SFile = SFile;
