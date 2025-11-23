// models/settings.js — THE ONLY FILE YOU WILL EVER NEED
const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
    // Platform Branding
    siteName: { type: String, default: "Active Classroom" },
    tagline: { type: String, default: "Bangladesh's Leading Ed-Tech Platform" },
    logo: { type: String, default: "" }, // URL to logo image

    // About & Mission
    aboutUs: {
        type: String,
        default: "Active Classroom is Bangladesh's #1 online education platform for SSC & HSC students. Founded by Shuvo Chakma."
    },

    // Contact Information
    email: { type: String, default: "support@activeclassroom.com" },
    phone: { type: String, default: "+880 1700-123456" },
    address: { type: String, default: "Dhaka, Bangladesh" },

    // Social Links (Flat structure for simplicity)
    facebook: { type: String, default: "https://facebook.com/activeclassroom" },
    youtube: { type: String, default: "https://youtube.com/@activeclassroom" },
    instagram: { type: String, default: "https://instagram.com/activeclassroom" },
    twitter: { type: String, default: "" },
    linkedin: { type: String, default: "" },

    // Founder & Credits
    founderName: { type: String, default: "Shuvo Chakma" },
    founderTitle: { type: String, default: "Founder & CEO" },

    // SEO & Meta
    metaDescription: { type: String, default: "Bangladesh's most trusted online learning platform for SSC & HSC students." },
    metaKeywords: { type: String, default: "SSC, HSC, online learning, Bangladesh, education" },

    // Legal & Policy URLs (Can be rich text or URLs)
    privacyPolicy: { type: String, default: "" },
    termsOfService: { type: String, default: "" },
    refundPolicy: { type: String, default: "" },

    // Footer Customization
    footerText: {
        type: String,
        default: "© 2025 Active Classroom • Made with ❤️ by Shuvo Chakma • For 50 Million Students"
    },
    copyrightText: { type: String, default: "© 2025 Active Classroom. All rights reserved." },

    // Platform Stats (Manual Override - 0 means auto-calculate)
    totalStudents: { type: Number, default: 0 },
    totalCourses: { type: Number, default: 0 },

    // Admin Control
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Always return only ONE document
settingsSchema.statics.get = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model("Setting", settingsSchema);