"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const googleapis_1 = require("googleapis");
const dotenv = require("dotenv");
dotenv.config();
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
function authorize(credentials) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new googleapis_1.google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials({
        access_token: process.env.access_token,
        refresh_token: process.env.refresh_token,
        scope: process.env.scope,
        token_type: process.env.token_type,
        expiry_date: parseInt(process.env.expiry_date)
    });
    return (oAuth2Client);
}
const sheets = authorize({
    installed: {
        client_id: process.env.client_id_googleoath,
        project_id: process.env.project_id_googleoath,
        auth_uri: process.env.auth_uri_googleoath,
        token_uri: process.env.token_uri_googleoath,
        auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url_googleoath,
        client_secret: process.env.client_secret_googleoath,
        redirect_uris: [process.env.redirect_uris1_googleoath, process.env.redirect_uris2_googleoath]
    }
});
const admin = require("firebase-admin");
let serviceAccount = process.env;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://games-ff9af.firebaseio.com'
});
const db = admin.firestore();
const config = process.env.BOT_TOKEN;
const MW = process.env.MW_api_key;
module.exports = { sheets, db, config, MW };
