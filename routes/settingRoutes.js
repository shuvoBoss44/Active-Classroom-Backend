// routes/settings.js
const express = require("express");
const router = express.Router();
const { getSettings, updateSettings } = require("../controllers/settingsController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Anyone can read
router.get("/", getSettings);

// Only admin can update
router.put("/", authMiddleware, roleMiddleware(["admin"]), updateSettings);

module.exports = router;