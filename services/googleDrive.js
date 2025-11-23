// services/googleDriveService.js
const { google } = require('googleapis');
const multer = require('multer');
const stream = require('stream');

const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_DRIVE_KEYFILE,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

const upload = multer();

const uploadToGoogleDrive = async (file) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const { data } = await drive.files.create({
        media: {
            mimeType: file.mimetype,
            body: bufferStream,
        },
        requestBody: {
            name: `${Date.now()}-${file.originalname}`,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        },
        fields: 'id, webViewLink',
    });

    // Make file publicly viewable
    await drive.permissions.create({
        fileId: data.id,
        requestBody: { role: 'reader', type: 'anyone' },
    });

    return data;
};

const deleteFromGoogleDrive = async (fileId) => {
    try {
        await drive.files.delete({ fileId });
    } catch (err) {
        console.log("File already deleted or not found:", fileId);
    }
};

module.exports = { upload, uploadToGoogleDrive, deleteFromGoogleDrive };