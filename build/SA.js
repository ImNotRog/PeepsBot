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
const crypto = require("crypto");
const OAuth = require("oauth-1.0a");
const nodefetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();
class SchoologyAccessor {
    constructor() {
        this.base = 'https://api.schoology.com/v1';
        this.token = { key: process.env.schoology_key, secret: process.env.schoology_secret };
    }
    get(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.base + path;
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
    methodswithdata(path, data, method) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.base + path;
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
    post(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.methodswithdata(path, data, "POST");
        });
    }
    put(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.methodswithdata(path, data, "PUT");
        });
    }
    delete(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.methodswithdata(path, data, "DELETE");
        });
    }
}
module.exports = { SchoologyAccessor };
