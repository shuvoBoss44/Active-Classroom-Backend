const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Check if Cloudinary env vars are set
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("❌ MISSING CLOUDINARY ENVIRONMENT VARIABLES in uploadProfile.js");
}

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        console.log("📸 Processing profile upload:", file.originalname);

        // Ensure user is authenticated before generating ID
        const userId = req.user ? req.user.userId : 'anonymous';
        if (!req.user) console.warn("⚠️ Warning: req.user is missing in uploadProfile middleware!");

        return {
            folder: 'active-classroom/profiles',
            public_id: `profile_${userId}_${Date.now()}`,
            transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }], // Optimized for profiles
        };
    },
});

const uploadProfile = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const types = /jpeg|jpg|png|webp/;
        const ext = file.originalname.toLowerCase().split('.').pop();
        if (types.test(ext)) {
            cb(null, true);
        } else {
            console.error("❌ Rejected profile image type:", file.originalname);
            cb(new Error('Only images are allowed'));
        }
    }
});

module.exports = uploadProfile;
