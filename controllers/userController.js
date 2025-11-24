const mongoose = require('mongoose');
const { admin, getAuth } = require('../config/firebase');
const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');

class UserController {
    // 1. Sync Firebase (Optimized with upsert: true)
    static async syncFirebase(req, res, next) {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                return ResponseHandler.error(res, 'ID token is required', 400);
            }

            const decodedToken = await getAuth().verifyIdToken(idToken, true);
            const { uid, email, name, picture } = decodedToken;

            // Check if user already exists
            const existingUser = await User.findOne({ userId: uid });

            // Data to update or set if the user exists
            const updateData = {
                email,
                name: name || email.split('@')[0],
                updatedAt: new Date(),
            };

            // CRITICAL FIX: Only update profileImage if user doesn't have a custom one
            // Custom images are stored in Cloudinary (contain 'cloudinary.com')
            // Google images are from Google's servers (contain 'googleusercontent.com')
            if (existingUser) {
                const hasCustomImage = existingUser.profileImage &&
                    existingUser.profileImage.includes('cloudinary.com');

                // Only overwrite with Google image if user doesn't have a custom upload
                if (!hasCustomImage && picture) {
                    updateData.profileImage = picture;
                }
            } else {
                // New user - use Google profile picture as default
                updateData.profileImage = picture || null;
            }

            // Fields to set ONLY on the initial creation (upsert)
            const setOnInsertData = {
                role: 'student',
                userId: uid,
            };

            // Use findOneAndUpdate with upsert: true for atomic creation/update
            let user = await User.findOneAndUpdate(
                { userId: uid }, // Query: Find by Firebase UID
                { $set: updateData, $setOnInsert: setOnInsertData },
                {
                    new: true,         // Return the updated/new document
                    upsert: true,      // Create the document if it doesn't exist
                    runValidators: true // Run schema validators
                }
            ).select('-__v'); // Exclude version key from the result

            // Cookie configuration for cross-domain auth
            const isProduction = process.env.NODE_ENV === 'production';

            res.cookie('token', idToken, {
                httpOnly: true,
                secure: isProduction, // true in production, false in development
                sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-domain in production
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: '/',
            });

            console.log("COOKIE SET SUCCESSFULLY FOR:", user.name);
            // Return token in body for header-based auth fallback
            ResponseHandler.created(res, { user, token: idToken }, 'User synced successfully');
        } catch (error) {
            console.error('Sync Firebase Error:', error);
            next(error);
        }
    }

    // 2. Logout
    static async logout(req, res, next) {
        try {
            const isProduction = process.env.NODE_ENV === 'production';

            res.clearCookie("token", {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                path: '/',
            });
            ResponseHandler.success(res, {}, 'Logout successful');
        } catch (error) {
            next(error);
        }
    }

    // 3. Get Profile (Detailed)
    // controllers/userController.js (Revised)

    static async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const user = await User.findOne({ userId })
                // 💡 FIX: Select all fields needed by CourseCard (thumbnail, price, etc.)
                .populate('purchasedCourses', 'title classType thumbnail price discountedPrice studentsEnrolled examsNumber')
                .select('-__v');

            if (!user) {
                return ResponseHandler.error(res, 'User not found', 404);
            }
            ResponseHandler.success(res, { user }, 'Profile retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // 4. Get Teachers List
    static async getTeachers(req, res, next) {
        try {
            // Added .lean() for potentially faster reads when not modifying the document
            const teachers = await User.find({ role: 'teacher' })
                .select('name email profileImage school college session')
                .lean();
            ResponseHandler.success(res, { teachers }, 'Teachers retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // 5. Update Profile (Optimized with findOneAndUpdate)
    static async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;

            // Only allow explicitly defined fields to be updated
            const {
                name,
                phone,
                guardianPhone,
                school,
                college,
                session,
                facebookId,
                profileImage
            } = req.body;

            // Construct update object only with provided and non-empty values
            const updates = {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(guardianPhone && { guardianPhone }),
                ...(school && { school }),
                ...(college && { college }),
                ...(session && { session }),
                ...(facebookId && { facebookId }),
                ...(profileImage && { profileImage }),
            };

            if (Object.keys(updates).length === 0) {
                return ResponseHandler.error(res, 'No valid fields provided for update', 400);
            }

            const user = await User.findOneAndUpdate(
                { userId },
                { $set: updates },
                { new: true, runValidators: true }
            ).select('-__v');

            if (!user) {
                return ResponseHandler.error(res, 'User not found', 404);
            }

            ResponseHandler.success(res, { user }, 'Profile updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // 6. Update User Role
    static async updateRole(req, res, next) {
        try {
            const { userId, role } = req.body;
            if (!['student', 'teacher', 'moderator', 'admin'].includes(role)) {
                return ResponseHandler.error(res, 'Invalid role', 400);
            }

            // Prevent creating new admins via API
            if (role === 'admin') {
                return ResponseHandler.error(res, 'Admins cannot create other admins', 403);
            }

            const user = await User.findOne({ userId });
            if (!user) {
                return ResponseHandler.error(res, 'User not found', 404);
            }

            // Prevent admin from demoting themselves
            if (user.userId === req.user.userId && role !== 'admin') {
                return ResponseHandler.error(res, 'Admins cannot demote themselves', 403);
            }

            user.role = role;
            await user.save();
            ResponseHandler.success(res, { user }, `User role updated to ${role}`);
        } catch (error) {
            next(error);
        }
    }

    // 7. Filter Users
    static async filterUsers(req, res, next) {
        try {
            const { role, school, college, session } = req.query;
            const query = {};
            if (role) query.role = role;
            // Use regex for partial, case-insensitive matches on school/college
            if (school) query.school = new RegExp(school, 'i');
            if (college) query.college = new RegExp(college, 'i');
            if (session) query.session = session;
            const users = await User.find(query)
                .select('name email role school college session')
                .lean();
            ResponseHandler.success(res, { users }, 'Users filtered successfully');
        } catch (error) {
            next(error);
        }
    }

    // 8. List All Users
    static async listUsers(req, res, next) {
        try {
            // Ensure sensitive fields are excluded (like the version key, and any password field)
            const users = await User.find().select("-password -__v").lean();
            ResponseHandler.success(res, { users }, 'Users retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // 9. Delete User
    static async deleteUser(req, res, next) {
        try {
            const { userId } = req.params;
            if (userId === req.user.userId) {
                return ResponseHandler.error(res, 'Users cannot delete themselves', 403);
            }
            const user = await User.findOneAndDelete({ userId });
            if (!user) {
                return ResponseHandler.error(res, 'User not found', 404);
            }
            ResponseHandler.success(res, {}, 'User deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    // 10. Get User by ID (Mongoose ID)
    static async getUserById(req, res, next) {
        try {
            // Note: This endpoint uses the Mongoose ObjectId, not the Firebase UID
            const { userId } = req.params;
            const user = await User.findById(userId)
                .populate('purchasedCourses', 'title classType thumbnail price discountedPrice studentsEnrolled examsNumber')
                .select('-password -__v');
            if (!user) {
                return ResponseHandler.error(res, 'User not found', 404);
            }
            ResponseHandler.success(res, { user }, 'User retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // 11. Get Current User (from auth middleware)
    static async getMe(req, res, next) {
        try {
            // The req.user object is populated by your authentication middleware
            // Return only safe fields
            const safeUser = { ...req.user };
            delete safeUser.password;

            return ResponseHandler.success(res, { user: safeUser }, 'User profile retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // 12. Upload Profile Image
    static async uploadProfileImage(req, res, next) {
        try {
            console.log("📸 UploadProfileImage Controller Hit");
            console.log("👤 User:", req.user?.userId, req.user?.name);
            console.log("📁 Req.file:", req.file);
            console.log("📋 Req.body:", req.body);

            if (!req.file) {
                console.error("❌ No file received in controller");
                return ResponseHandler.error(res, 'No image file provided', 400);
            }

            const userId = req.user.userId;
            const profileImage = req.file.path; // Cloudinary URL
            console.log(`✅ File uploaded to Cloudinary: ${profileImage}`);
            console.log(`🔄 Updating user ${userId} with new profile image...`);

            const user = await User.findOneAndUpdate(
                { userId },
                { $set: { profileImage } },
                { new: true }
            ).select('-password -__v');

            if (!user) {
                console.error(`❌ User not found for update: ${userId}`);
                return ResponseHandler.error(res, 'User not found', 404);
            }

            console.log(`🎉 User profile updated successfully. New Image: ${user.profileImage}`);
            ResponseHandler.success(res, { user, profileImage }, 'Profile image updated successfully');
        } catch (error) {
            console.error("❌ Error in uploadProfileImage:", error);
            console.error("Error stack:", error.stack);
            next(error);
        }
    }
}

module.exports = UserController;