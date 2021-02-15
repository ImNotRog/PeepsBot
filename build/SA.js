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
exports.File = exports.Course = exports.SchoologyAccessor = void 0;
const crypto = require("crypto");
const OAuth = require("oauth-1.0a");
const nodefetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();
class SchoologyAccessor {
    constructor() { }
    ;
    static get(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield SchoologyAccessor.rawGet(SchoologyAccessor.base + path);
        });
    }
    static rawGet(path) {
        return __awaiter(this, void 0, void 0, function* () {
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
    static listCourses() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = (yield SchoologyAccessor.get("/users/2016549/sections"));
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
}
exports.SchoologyAccessor = SchoologyAccessor;
// BASIC METHODS
SchoologyAccessor.base = 'https://api.schoology.com/v1';
SchoologyAccessor.token = { key: process.env.schoology_key, secret: process.env.schoology_secret };
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
            this.baseFolder = new File(this, baseInfo.self);
            yield this.baseFolder.onConstruct();
        });
    }
}
exports.Course = Course;
class File {
    constructor(course, data, parent) {
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
    }
    onConstruct() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.type === "folder") {
                const me = yield SchoologyAccessor.getFolder(this.course.getData().id, this.data.id);
                this.fulldatacache = me;
                this.cached = true;
                if (me['folder-item']) {
                    let promises = [];
                    for (const child of me["folder-item"]) {
                        const childfile = new File(this.course, child, this);
                        promises.push(childfile.onConstruct());
                        this.children.push(childfile);
                    }
                    yield Promise.all(promises);
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
            if (this.data.type === "assignment") {
                const me = yield SchoologyAccessor.getAssignment(this.course.getData().course_id, this.data.id);
                this.fulldatacache = me;
                this.cached = true;
                return me;
            }
            if (this.data.type === "document") {
                const me = yield SchoologyAccessor.getDocument(this.course.getData().course_id, this.data.id);
                this.fulldatacache = me;
                this.cached = true;
                return me;
            }
            if (this.data.type === "page") {
                const me = yield SchoologyAccessor.getPage(this.course.getData().course_id, this.data.id);
                this.fulldatacache = me;
                this.cached = true;
                return me;
            }
        });
    }
}
exports.File = File;
