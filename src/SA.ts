import crypto = require('crypto');
import OAuth = require("oauth-1.0a");
import nodefetch = require('node-fetch');

import * as dotenv from "dotenv";
dotenv.config();

class SchoologyAccessor {

    private readonly base: string = 'https://api.schoology.com/v1';
    private token: { key:string, secret:string };

    constructor(){
        this.token = { key: process.env.schoology_key, secret: process.env.schoology_secret }
    }

    async get(path){
        const url = this.base + path;
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

    async methodswithdata(path: string,data:Object,method: string) {
        const url = this.base + path;

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

    async post(path:string,data:Object) {
        return await this.methodswithdata(path,data,"POST");
    }

    async put(path:string,data:Object){
        return await this.methodswithdata(path,data,"PUT");
    }

    async delete(path:string,data:Object){
        return await this.methodswithdata(path,data,"DELETE");
    }
}

module.exports = { SchoologyAccessor };

