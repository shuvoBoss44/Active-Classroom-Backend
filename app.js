require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const progressRoutes = require("./routes/progressRoutes");
const examRoutes = require("./routes/examRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const couponRoutes = require("./routes/couponRoutes");
const notesRoutes = require("./routes/notesRoutes");
const settingRoutes = require("./routes/settingRoutes");
const statsRoutes = require("./routes/statsRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const contactRoutes = require("./routes/contactRoutes");
const ResponseHandler = require("./utils/responseHandler");
const CustomError = require("./utils/customError");

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
    console.log("Connected to MongoDB database");
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/contact", contactRoutes);


// Health check endpoint
app.get("/health", (req, res) => {
    ResponseHandler.success(res, {}, "Server is healthy");
});

// Root endpoint to prevent 404s on base URL
app.get("/", (req, res) => {
    ResponseHandler.success(res, {}, "Active Classroom Backend API is running");
});

// Ignore favicon requests
app.get("/favicon.ico", (req, res) => res.status(204).end());

// 404 handler for undefined routes
app.use((req, res, next) => {
    console.error(`❌ 404 Error: Route not found - ${req.method} ${req.originalUrl}`);
    const error = new CustomError(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});

// Global error handler
// Global error handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler Caught:", err);
    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    if (err.message === 'Only images are allowed') {
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large' });
    }
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error', error: err });
});

// Listening to the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});