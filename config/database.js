require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;

module.exports = db;
