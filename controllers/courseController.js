// controllers/courseController.js
const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const ResponseHandler = require('../utils/responseHandler');
const CustomError = require('../utils/customError');

// Configure Cloudinary (from .env)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CourseController {
    // CREATE COURSE
    static async createCourse(req, res, next) {
        try {
            if (!req.file) {
                throw new CustomError('Thumbnail is required', 400);
            }

            const { title, classType, price, discountedPrice, overview, description, faq, facebookGroupLink, demoVideo, facebookGroupVideos, instructors } = req.body;

            let parsedFaq = [];
            if (faq) {
                parsedFaq = typeof faq === 'string' ? JSON.parse(faq) : faq;
            }

            let parsedVideos = [];
            if (facebookGroupVideos) {
                parsedVideos = typeof facebookGroupVideos === 'string' ? JSON.parse(facebookGroupVideos) : facebookGroupVideos;
            }

            let parsedInstructors = [req.user._id]; // Default to creator
            if (instructors) {
                try {
                    const parsed = typeof instructors === 'string' ? JSON.parse(instructors) : instructors;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        parsedInstructors = parsed;
                    }
                } catch (e) {
                    console.error("Error parsing instructors:", e);
                }
            }

            const course = new Course({
                title: title?.trim(),
                thumbnail: req.file.path, // DIRECT CLOUDINARY URL
                classType,
                price: Number(price),
                discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
                overview: overview?.trim(),
                description: description?.trim(),
                faq: parsedFaq,
                facebookGroupLink,
                facebookGroupVideos: parsedVideos,
                demoVideo,
                instructors: parsedInstructors,
                examsNumber: 0,
                lectureNumber: 0,
                studentsEnrolled: 0,
            });

            await course.save();
            ResponseHandler.created(res, { course }, 'Course created successfully');
        } catch (error) {
            next(error);
        }
    }

    // UPDATE COURSE - WITH INSTRUCTOR PARSING AND OLD IMAGE DELETION
    static async updateCourse(req, res, next) {
        try {
            const { courseId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                throw new CustomError('Invalid course ID', 400);
            }

            const course = await Course.findById(courseId);
            if (!course) throw new CustomError('Course not found', 404);

            const updates = { ...req.body };

            // 1. Handle Thumbnail Update and Old Image Deletion 🗑️
            if (req.file) {
                // Upload new image
                const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'active-classroom/courses',
                });
                updates.thumbnail = uploadResult.secure_url;

                // Delete old image only if a new one was uploaded
                if (course.thumbnail) {
                    try {
                        // Extract the Public ID from the URL (e.g., active-classroom/courses/abcde123)
                        const parts = course.thumbnail.split('/');
                        const publicIdWithFolder = parts.slice(parts.indexOf('active-classroom')).join('/').split('.')[0];
                        await cloudinary.uploader.destroy(publicIdWithFolder);
                    } catch (e) {
                        console.warn('Could not delete old thumbnail from Cloudinary:', e.message);
                        // Continue processing even if delete fails
                    }
                }
            }

            // 2. Parse FAQ (Required because of frontend FormData handling)
            if (updates.faq && typeof updates.faq === 'string') {
                updates.faq = JSON.parse(updates.faq);
            }


            // 2.1 Parse Facebook Group Videos
            console.log('🔍 DEBUG: facebookGroupVideos RAW:', updates.facebookGroupVideos, 'Type:', typeof updates.facebookGroupVideos);
            if (updates.facebookGroupVideos && typeof updates.facebookGroupVideos === 'string') {
                updates.facebookGroupVideos = JSON.parse(updates.facebookGroupVideos);
                console.log('✅ DEBUG: facebookGroupVideos PARSED:', updates.facebookGroupVideos);
            }

            // 3. Parse and Validate Instructors (FIX for BSONError) 🧑‍🏫
            if (updates.instructors && typeof updates.instructors === 'string') {
                let parsedInstructors;
                try {
                    parsedInstructors = JSON.parse(updates.instructors);
                } catch (e) {
                    throw new CustomError('Invalid instructors data format.', 400);
                }

                // Validate against MongoDB ID format to prevent Mongoose cast error
                const objectIdRegex = /^[0-9a-fA-F]{24}$/;
                const validInstructors = Array.isArray(parsedInstructors)
                    ? parsedInstructors.filter(id => typeof id === 'string' && objectIdRegex.test(id))
                    : [];

                updates.instructors = validInstructors;
            }

            // 4. Convert price fields
            if (updates.price) updates.price = Number(updates.price);
            if (updates.discountedPrice) updates.discountedPrice = Number(updates.discountedPrice);

            console.log('📦 DEBUG: Final updates object:', JSON.stringify(updates, null, 2));

            const updatedCourse = await Course.findByIdAndUpdate(
                courseId,
                updates,
                { new: true, runValidators: true }
            ).populate('instructors', 'name');

            console.log('✨ DEBUG: Updated course facebookGroupVideos:', updatedCourse.facebookGroupVideos);

            ResponseHandler.success(res, { course: updatedCourse }, 'Course updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // DELETE COURSE
    static async deleteCourse(req, res, next) {
        try {
            const { courseId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                throw new CustomError('Invalid course ID', 400);
            }
            const course = await Course.findByIdAndDelete(courseId);
            if (!course) throw new CustomError('Course not found', 404);

            // Optional: Delete from Cloudinary
            if (course.thumbnail) {
                try {
                    // Extract the Public ID from the URL: e.g. 'active-classroom/courses/abcde123'
                    const parts = course.thumbnail.split('/');
                    const publicIdWithFolder = parts.slice(parts.indexOf('active-classroom')).join('/').split('.')[0];
                    await cloudinary.uploader.destroy(publicIdWithFolder);
                } catch (e) {
                    console.warn('Could not delete thumbnail from Cloudinary:', e.message);
                }
            }

            ResponseHandler.success(res, {}, 'Course deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    // LIST COURSES
    static async listCourses(req, res, next) {
        try {
            const { classType } = req.query;
            const query = classType ? { classType } : {};
            const courses = await Course.find(query)
                .select('title thumbnail classType price discountedPrice studentsEnrolled examsNumber demoVideo')
                .sort({ studentsEnrolled: -1 })
                .lean();

            ResponseHandler.success(res, { courses }, 'Courses retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // Place this revised method in your controllers/courseController.js

    static async getCourseDetails(req, res, next) {
        try {
            const { courseId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                throw new CustomError('Invalid course ID', 400);
            }

            const course = await Course.findById(courseId)
                .populate('instructors', 'name email profileImage')
                .populate({
                    path: 'subjects',
                    populate: { path: 'chapters', select: 'title lectures notes' }
                });

            if (!course) throw new CustomError('Course not found', 404);

            // Determine if the user is enrolled or has an administrative role
            const isEnrolled = req.user && (
                req.user.purchasedCourses.map(id => id.toString()).includes(courseId) ||
                ['admin', 'moderator', 'teacher'].includes(req.user.role)
            );

            const response = {
                _id: course._id,
                title: course.title,
                thumbnail: course.thumbnail,
                classType: course.classType,
                price: course.price,
                discountedPrice: course.discountedPrice || course.price,
                overview: course.overview,
                description: course.description,
                faq: course.faq || [],
                demoVideo: course.demoVideo,
                instructors: course.instructors,
                studentsEnrolled: course.studentsEnrolled,
                examsNumber: course.examsNumber,
                subjects: course.subjects, // ⭐️ ADDED: Include subjects
                // ⭐️ FIX: Include the link here unconditionally for the Admin
                facebookGroupLink: course.facebookGroupLink,
                facebookGroupVideos: course.facebookGroupVideos || [], // ⭐️ ADDED: Include Facebook Group Videos
            };

            if (isEnrolled) {
                // Only add this block if there are other sensitive fields you still want
                // to restrict, like internal notes or chapter content.
                // For now, this conditional block is less critical since the main field is moved.
                // Future: populate subjects, chapters, lectures
            }

            ResponseHandler.success(res, { course: response }, 'Course details retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // ENROLLMENT
    static async updateEnrollment(req, res, next) {
        try {
            const { courseId } = req.body;
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                throw new CustomError('Invalid course ID', 400);
            }

            const course = await Course.findById(courseId);
            if (!course) throw new CustomError('Course not found', 404);

            const user = req.user; // Already populated by auth middleware

            if (user.purchasedCourses.map(id => id.toString()).includes(courseId)) {
                throw new CustomError('Already enrolled', 400);
            }

            course.studentsEnrolled += 1;
            user.purchasedCourses.push(course._id);

            await Promise.all([course.save(), user.save()]);

            ResponseHandler.success(res, { message: 'Enrolled successfully' });
        } catch (error) {
            next(error);
        }
    }

    // LIST POPULAR COURSES
    static async listPopularCourses(req, res) {
        try {
            // 1. Attempt to fetch courses sorted by studentsEnrolled descending
            let popularCourses = await Course.find({})
                .sort({ studentsEnrolled: -1, createdAt: 1 }) // Primary sort: highest enrollment. Secondary sort: oldest courses first (if enrollment is tied/0)
                .limit(10) // Limit to a reasonable number for the popular section
                .select('title thumbnail overview classType price discountedPrice studentsEnrolled examsNumber instructors')
                .populate('instructors', 'name profileImage role'); // Populate necessary instructor fields

            if (!popularCourses || popularCourses.length === 0) {
                // 2. Fallback: If no enrollments exist (e.g., new site), show the 3 newest courses
                const fallbackCourses = await Course.find({})
                    .sort({ createdAt: -1 }) // Sort by newest first
                    .limit(3)
                    .select('title thumbnail overview classType price discountedPrice studentsEnrolled examsNumber instructors')
                    .populate('instructors', 'name profileImage role');

                return res.status(200).json({
                    success: true,
                    courses: fallbackCourses,
                    message: "Showing fallback courses due to low enrollment data."
                });
            }

            // 3. Success: Return the enrolled list
            res.status(200).json({ success: true, courses: popularCourses });
        } catch (error) {
            console.error("Error fetching popular courses:", error);
            res.status(500).json({ success: false, message: "Server error fetching popular courses." });
        }
    };
}

module.exports = CourseController;