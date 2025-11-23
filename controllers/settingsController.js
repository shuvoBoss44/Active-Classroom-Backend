// controllers/settingsController.js
const Setting = require("../models/Settings");

const getSettings = async (req, res) => {
    try {
        const settings = await Setting.get();
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const updateSettings = async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admin only" });
    }

    try {
        const settings = await Setting.get();
        Object.assign(settings, req.body);
        settings.updatedBy = req.user._id;
        settings.updatedAt = Date.now();
        await settings.save();

        res.json({ success: true, data: settings, message: "Settings updated!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Update failed" });
    }
};

module.exports = { getSettings, updateSettings };