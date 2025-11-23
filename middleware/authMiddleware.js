// middleware/authMiddleware.js
const admin = require("firebase-admin");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        // STEP 1: Get token from httpOnly cookie OR Authorization header
        let token = req.cookies?.token;

        // Fallback to Bearer token if cookie is missing
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided. Please login again."
            });
        }

        // STEP 2: Verify Firebase ID Token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;

        // STEP 3: Find user in MongoDB using Firebase UID
        const mongoUser = await User.findOne({ userId: uid });

        if (!mongoUser) {
            return res.status(404).json({
                success: false,
                message: "User not found in database. Please contact support."
            });
        }

        // STEP 4: Attach FULL user with role & data to req.user
        req.user = {
            userId: mongoUser.userId,
            _id: mongoUser._id,
            name: mongoUser.name,
            email: mongoUser.email,
            role: mongoUser.role,                    // admin, teacher, moderator, student
            phone: mongoUser.phone,
            school: mongoUser.school,
            college: mongoUser.college,
            session: mongoUser.session,
            profileImage: mongoUser.profileImage,
            purchasedCourses: mongoUser.purchasedCourses,
            facebookId: mongoUser.facebookId,
            createdAt: mongoUser.createdAt,
        };
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);

        // Clear invalid cookie
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        });

        return res.status(401).json({
            success: false,
            message: "Session expired or invalid. Please login again."
        });
    }
};

// Role-based middleware
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
    });
};

const isTeacher = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher privileges required.'
    });
};

const isModerator = (req, res, next) => {
    if (req.user && (req.user.role === 'moderator' || req.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Access denied. Moderator privileges required.'
    });
};

module.exports = authMiddleware;
module.exports.verifyToken = authMiddleware;
module.exports.isAdmin = isAdmin;
module.exports.isTeacher = isTeacher;
module.exports.isModerator = isModerator;