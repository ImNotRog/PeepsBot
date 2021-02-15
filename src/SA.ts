import crypto = require('crypto');
import OAuth = require("oauth-1.0a");
import nodefetch = require('node-fetch');
import { Utilities } from './Utilities';

import * as dotenv from "dotenv";
dotenv.config();


type CourseResponse = {
    id: string,
    course_id:string,
    course_code: string,
    course_title: string,
    section_title: string,
    profile_url: string,
    grading_periods: string[],
    links: {
        self: string
    }
}

type DocumentDataSnippetResponse = {
    id: string,
    location: string,
    title: string,
    type: "document",
    document_type: string,
    completion_status: string,
    completed: number,
    body: string,
}

type PageDataSnippetResponse = {
    id: string,
    location: string,
    title: string,
    type: "page",
    document_type: string,
    completion_status: string,
    completed: number,
    body: string,
}

type AssignmentDataSnippetResponse = {
    id: string,
    location: string,
    title: string,
    type: "assignment" | "managed_assessment" | "assessment_v2",
    document_type: string,
    completion_status: string,
    completed: number,
    body: string,
    assignment_type: string,
    web_url: string,
}

type MediaAlbumDataSnippetResponse = {
    id: string,
    title:string,
    body: string,
    type: 'media-album'
}

type DiscussionDataSnippetResponse = {
    id: string,
    title: string,
    body: string,
    type: 'discussion'
}

type FolderDataResponse = {
    id: string,
    location: string,
    title: string,
    body: string,
    type: "folder",
    color: string,
    completion_status: string,
    completed: number
}

type FolderResponse = {
    self: FolderDataResponse
    ["folder-item"]: SnippetResponse[]
}

type PageResponse = {
    id: number,
    title: string,
    body: string,
    inline: number,
    created: number,
    completed: number,
    completion_status: string
}

type DocumentResponse = {
    id: number,
    title: string,
    completed: number,
    completion_status: string,
    attachments: {
        links: {
            link: {
                id: string,
                type: string,
                url: string,
                title: string,
                favicon: string
            }[]
        }
    }
}

type AssignmentResponse = {
    id: number,
    title:string,
    description:string,
    due:string,
    type:string,
    grading_category: string,
    grading_period:string,
    completed:number,
    allow_dropbox:number,
    dropbox_locked:number,
    show_rubric:boolean,
    folder_id:string,
    assignment_type:string
}

type MediaAlbumResponse = {
    id: string,
    title:string,
    description: string,
    photo_count:number,
    video_count:number,
    audio_count:number,
    cover_image_url:string,
}

type DiscussionResponse = {
    id: string,
    title: string,
    body: string,
    type: 'discussion',
    require_initial_post: number
}

type SnippetResponse = (FolderDataResponse | AssignmentDataSnippetResponse | DocumentDataSnippetResponse | PageDataSnippetResponse | MediaAlbumDataSnippetResponse | DiscussionDataSnippetResponse);
type FullReponse = (FolderResponse | AssignmentResponse | DocumentResponse | PageResponse | MediaAlbumResponse | DiscussionResponse)

export class SchoologyAccessor {

    // BASIC METHODS

    public static readonly base: string = 'https://api.schoology.com/v1';
    public static token = { key: process.env.schoology_key, secret: process.env.schoology_secret }
    public static num = { num: 0 };

    private constructor() {};

    static async get(path) {
        let res = await SchoologyAccessor.rawGet(SchoologyAccessor.base + path);
        if(!res.ok) console.log(res);
        return res;
    }

    static async rawGet(path){

        if(SchoologyAccessor.num.num >= 0) {
            let awaitpromise = new Promise<void> ((r,j) => {
                let int = setInterval(() => {
                    if(SchoologyAccessor.num.num < 0){
                        SchoologyAccessor.num.num ++;
                        r();
                        clearInterval(int);
                    }

                }, 1000);
            })

            await awaitpromise;

        }
        SchoologyAccessor.num.num++;

        const url = path;
        const method = "GET";

        function hash_function_sha1(base_string, key) {
            return crypto
                .createHmac('sha1', key)
                .update(base_string)
                .digest('base64')
        }

        // @ts-ignore
        const oauth = OAuth({
            consumer: this.token,
            signature_method: 'HMAC-SHA1',
            hash_function: hash_function_sha1,
        })

        // @ts-ignore
        return await nodefetch(url,
        {
            method,
            headers: oauth.toHeader(oauth.authorize({url, method})),
        });
    }

    static async methodswithdata(path: string,data:Object,method: string) {
        const url = SchoologyAccessor.base + path;

        function hash_function_sha1(base_string, key) {
            return crypto
                .createHmac('sha1', key)
                .update(base_string)
                .digest('base64')
        }

        // @ts-ignore
        const oauth = OAuth({
            consumer: this.token,
            signature_method: 'HMAC-SHA1',
            hash_function: hash_function_sha1,
        })

        // @ts-ignore
        return await nodefetch(url,
        {
            method,
            body: JSON.stringify(data),
            headers: {
                'Content-Type': "application/json",
                ...oauth.toHeader(oauth.authorize({url, method}))
            },
        });

    }

    static async post(path:string,data:Object) {
        return await SchoologyAccessor.methodswithdata(path,data,"POST");
    }

    static async put(path:string,data:Object){
        return await SchoologyAccessor.methodswithdata(path,data,"PUT");
    }

    static async delete(path:string,data:Object){
        return await SchoologyAccessor.methodswithdata(path,data,"DELETE");
    }

    // ADVANCED METHODS

    static async listCourses(id:string) {
        const res = (await SchoologyAccessor.get(`/users/${id}/sections`));
        const data: CourseResponse[] = (await res.json()).section;
        return data;
    }

    static async listAssignments(sectionid:string) {
        const res = (await SchoologyAccessor.get(`/sections/${sectionid}/assignments`));
        const data: AssignmentResponse[] = (await res.json()).assignment;
        return data;
    }

    static async getFolder(courseid: string, folderid?: string) {
        const res = (await SchoologyAccessor.get(`/courses/${courseid}/folder/${folderid ? folderid : ''}`));
        try {
            const data: FolderResponse = (await res.json());
            return data;
        } catch (err){
            console.error(err);
        }
    }

    static async getPage(sectionid: string, pageid: string) {
        const res = (await SchoologyAccessor.get(`/sections/${sectionid}/pages/${pageid}`));
        const data: PageResponse = (await res.json());
        return data;
    }

    static async getDocument(sectionid: string, documentid: string) {
        const res = (await SchoologyAccessor.get(`/sections/${sectionid}/documents/${documentid}`));
        const data: DocumentResponse = (await res.json());
        return data;
    }

    static async getAssignment(sectionid: string, assignmentid: string) {
        const res = (await SchoologyAccessor.get(`/sections/${sectionid}/assignments/${assignmentid}`));
        const data: AssignmentResponse = (await res.json());
        return data;
    }

    static async getAlbum(sectionid: string, albumid: string) {
        const res = (await SchoologyAccessor.get(`/sections/${sectionid}/albums/${albumid}`));
        const data: MediaAlbumResponse = (await res.json());
        return data;
    }

    static async getDiscussion(sectionid: string, discussionid: string) {
        const res = (await SchoologyAccessor.get(`/sections/${sectionid}/discussions/${discussionid}`));
        const data: DiscussionResponse = (await res.json());
        return data;
    }
}

setInterval(() => {
    SchoologyAccessor.num.num = -15;
}, 1000)

export class User {
    public id: string;
    public courses: Course[];
    constructor(id:string) {
        this.id = "2016549";
        this.courses = [];
    }

    async onConstruct() {
        let courses = await SchoologyAccessor.listCourses(this.id);
        let promises = [];
        for(const course of courses) {
            let c = (new Course(course));
            promises.push(c.onConstruct());
            this.courses.push(c);
        }
        await Promise.all(promises);
    }
}

export class Course {

    public data: CourseResponse;
    public baseFolder: SFile;
    
    constructor(data: CourseResponse) {
        this.data = data;
    }

    getData() {
        return this.data;
    }
    
    async onConstruct() {
        const baseInfo = await SchoologyAccessor.getFolder(this.data.id);
        this.baseFolder = new SFile(this, baseInfo.self);
        await this.baseFolder.onConstruct();
    }
}

export class SFile {

    public data: SnippetResponse;
    public parent: SFile;
    public base:boolean;
    public children: SFile[];
    public type: string;
    public course:Course;
    public name:string;

    public fulldatacache: FullReponse;
    public cached:boolean;

    constructor(course: Course, data: SnippetResponse, parent?:SFile) {
        this.course = course;
        this.data = data;
        this.parent = null;
        this.base = true;
        this.cached = false;
        this.fulldatacache = null;
        this.children = [];
        if(parent) {
            this.parent = parent;
            this.base = false;
        }

        this.type = this.data.type;
        this.name = this.data.title;
    }

    async onConstruct(): Promise<void> {

        if (this.type === "folder") {
            const me = await SchoologyAccessor.getFolder(this.course.getData().id, this.data.id);
            if (me) {

                this.fulldatacache = me;
                this.cached = true;

                if (me['folder-item']) {
                    let promises = [];
                    for (const child of me["folder-item"]) {
                        const childfile = new SFile(this.course, child, this);
                        promises.push(childfile.onConstruct());
                        this.children.push(childfile);
                    }
                    await Promise.all(promises);
                }

            }

        }
        
    }

    getSnippet() {
        return this.data;
    }

    async getData():Promise<FullReponse> {
        if(this.cached) {
            return this.fulldatacache;
        }
        if (this.data.type === "assignment" || this.data.type === "managed_assessment" || this.data.type === "assessment_v2") {
            const me = await SchoologyAccessor.getAssignment(this.course.getData().id, this.data.id);
            this.fulldatacache = me;
            this.cached = true;
            return me;
        }
        if (this.data.type === "document") {
            const me = await SchoologyAccessor.getDocument(this.course.getData().course_id, this.data.id);
            this.fulldatacache = me;
            this.cached = true;
            return me;
        }
        if (this.data.type === "page") {
            const me = await SchoologyAccessor.getPage(this.course.getData().id, this.data.id);
            this.fulldatacache = me;
            this.cached = true;
            return me;
        }
        if(this.data.type === "media-album") {
            const me = await SchoologyAccessor.getAlbum(this.course.getData().id, this.data.id);
            this.fulldatacache = me;
            this.cached = true;
            return me;
        }
        if(this.data.type === "discussion") {
            const me = await SchoologyAccessor.getDiscussion(this.course.getData().id, this.data.id);
            this.fulldatacache = me;
            this.cached = true;
            return me;
        }
    }

    listAllChildren():SFile[] {
        if(this.data.type !== "folder") {
            return [this];
        } else {
            return [this, ...this.children.reduce((acc, file) => acc.concat(file.listAllChildren() ), []) ]
        }
    }

    wordSearch(str:string): SFile[] {
        let allchildren = (this.listAllChildren());

        allchildren.sort((a, b) => {
            return Utilities.RatcliffObershelpCustom(str, b.data.title) - Utilities.RatcliffObershelpCustom(str, a.data.title);
        })

        return allchildren;
    }

    find(suchthat: (sfile: SFile) => boolean): (boolean | SFile) {
        if(suchthat(this)) {
            return this;
        } else if(this.type === "folder") {
            return this.children.find(suchthat);
        } else {
            return false;
        }
    }

    findall(suchthat: (sfile: SFile) => boolean): SFile[] {
        return this.listAllChildren().filter(suchthat);
    }

    async toEmbedFields(): Promise<{ name: string, value: string, inline?: boolean }[]> {
        let data = await this.getData();
        let fields = [];
        fields.push(
            {
                name: `Name`,
                value: `${this.icon()} ${this.name}`,
                inline: false
            }
        )
        fields.push(
            {
                name: `Type`,
                value: `${this.type}`,
                inline: true
            }
        );
        
        fields.push(
            {
                name: `ID`,
                value: `${this.data.id}`,
                inline: true
            }
        );

        if(!this.base) {
            fields.push(
                {
                    name: `Parent Folder ID`,
                    value: `${this.parent.data.id}`,
                    inline: true
                }
            );
        }

        if(this.data.body.length > 0) {
            fields.push(
                {
                    name: `Description`,
                    value: `${this.data.body}`
                }
            )
        }
        
        if (this.data.type === "assignment" || this.data.type === "managed_assessment" || this.data.type === "assessment_v2") {
            // @ts-ignore
            let d: AssignmentResponse = data;
            fields.push(
                {
                    name: `Assignment Type`,
                    value: `${d.assignment_type}`,
                    inline: true
                }
            );
            fields.push(
                {
                    name: `Due`,
                    value: `${d.due}`,
                    inline: true
                }
            )
            fields.push(
                {
                    name: `Type`,
                    value: `${d.type}`,
                    inline: true
                }
            )
        }

        if (this.data.type === "document") {
            // @ts-ignore
            let d: DocumentResponse = data;
            fields.push(
                {
                    name: `Link`,
                    value: `${d.attachments.links.link[0].url}`,
                    inline: true
                }
            );
        }

        if (this.data.type === "page") {
            // @ts-ignore
            let d: PageResponse = data;
            
        }

        if (this.data.type === "folder") {
            // @ts-ignore
            let d: FolderResponse = data;

            fields.push(
                {
                    name: `Color`,
                    value: `${d.self.color}`,
                    inline: true
                }
            ); 

            fields.push(
                {
                    name: `Children`,
                    value: `${this.children.map(child => child.toString(1)).join('\n')}`,
                    inline: false
                }
            );

        }

        if (this.data.type === "media-album") {
            // @ts-ignore
            let d: MediaAlbumResponse = data;
            fields.push(
                {
                    name: `Cover Image`,
                    value: `${d.cover_image_url}`,
                    inline: false
                }
            )
            fields.push(
                {
                    name: `Audio Count`,
                    value: `${d.audio_count}`,
                    inline: true
                }
            )
            fields.push(
                {
                    name: `Image Count`,
                    value: `${d.photo_count}`,
                    inline: true
                }
            )
            fields.push(
                {
                    name: `Video Count`,
                    value: `${d.video_count}`,
                    inline: true
                }
            )
        }

        if (this.data.type === "discussion") {
            // @ts-ignore
            let d: DiscussionResponse = data;
            fields.push(
                {
                    name: `Requires Post to See?`,
                    value: `${d.require_initial_post === 1 ? "Yes" : "No"}`,
                    inline:true
                }
            )
        }
        
        let fieldsfinal = [];
        for(const field of fields) {
            fieldsfinal.push({
                name: field.name,
                value: (field.value.length >= 1024 ? field.value.slice(0,1000) + '...' : field.value.length > 0 ? field.value : 'N/A').replace(/\n\n+/g,'\n'),
                inline: field.inline
            })
        }
        
        return fieldsfinal;
    }

    icon():string {
        switch(this.data.type) {
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
                return "🖼️"
            case "discussion":
                return "💬"
            default:
                return "-"
        }
    }

    toString(num?:number) {
        if( !num || (num === 0) || this.data.type !== "folder") {
            return `${this.icon()} ${this.name} - ${this.data.id}`
        } else {
            return `${this.icon()} ${this.name} - ${this.data.id}\n${this.children.map(a => `--> ${a.toString(num-1)}`).join('\n')}`
        }
    }
}
