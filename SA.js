const crypto = require('crypto')
const OAuth = require("oauth-1.0a")
const fetch = require('node-fetch')
class SchoologyAccessor {
    constructor(){
        this.base = 'https://api.schoology.com/v1'
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

        const oauth = OAuth({
            consumer: this.token,
            signature_method: 'HMAC-SHA1',
            hash_function: hash_function_sha1,
        })

        return await fetch(url,
        {
            method,
            headers: oauth.toHeader(oauth.authorize({url, method})),
        });
    }

    async methodswithdata(path,data,method) {
        const url = this.base + path;

        function hash_function_sha1(base_string, key) {
            return crypto
                .createHmac('sha1', key)
                .update(base_string)
                .digest('base64')
        }

        const oauth = OAuth({
            consumer: this.token,
            signature_method: 'HMAC-SHA1',
            hash_function: hash_function_sha1,
        })

        return await fetch(url,
        {
            method,
            body: JSON.stringify(data),
            headers: {
                'Content-Type': "application/json",
                ...oauth.toHeader(oauth.authorize({url, method}))
            },
        });
    }

    async post(path,data) {
        return await this.methodswithdata(path,data,"POST");
    }

    async put(path,data){
        return await this.methodswithdata(path,data,"PUT");
    }

    async delete(path,data){
        return await this.methodswithdata(path,data,"DELETE");
    }
}

module.exports = { SchoologyAccessor };

