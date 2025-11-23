// middleware/upload.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Check if Cloudinary env vars are set
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("❌ MISSING CLOUDINARY ENVIRONMENT VARIABLES in upload.js");
}

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        console.log("📸 Uploading file to Cloudinary:", file.originalname);
        return {
            folder: 'active-classroom/courses',
            // allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Relying on fileFilter instead
            transformation: [{ width: 800, height: 600, crop: 'fill' }],
        };
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const types = /jpeg|jpg|png|webp/;
        const ext = file.originalname.toLowerCase().split('.').pop();
        if (types.test(ext)) {
            cb(null, true);
        } else {
            console.error("❌ Rejected file type:", file.originalname);
            cb(new Error('Only images are allowed'));
        }
    }
});

module.exports = upload;