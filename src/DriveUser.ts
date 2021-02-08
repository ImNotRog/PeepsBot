import { drive_v3, google } from 'googleapis';

export class DriveUser {
    
    private drive:drive_v3.Drive;
    
    constructor(auth) {
        this.drive = google.drive({ version: 'v3', auth });
    }

    async onConstruct() {
        const res = await this.drive.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)',
        });
        const files = res.data.files;

        console.log(files);
    }
}