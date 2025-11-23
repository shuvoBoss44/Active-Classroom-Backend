const Progress = require('../models/Progress');
const Course = require('../models/Course');

// Get progress for a specific course
exports.getProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.uid; // From auth middleware

        let progress = await Progress.findOne({ userId, courseId });

        if (!progress) {
            // If no progress exists, return 0
            return res.status(200).json({
                success: true,
                data: {
                    completedLectures: 0,
                    totalLectures: 0,
                    percentage: 0
                }
            });
        }

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Get Progress Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch progress'
        });
    }
};

// Update progress (e.g., mark a lecture as complete)
exports.updateProgress = async (req, res) => {
    try {
        const { courseId, videoId } = req.body;
        const userId = req.user.uid;

        // Get course details to know total lectures
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Find existing progress or create new
        let progress = await Progress.findOne({ userId, courseId });

        if (!progress) {
            progress = new Progress({
                userId,
                courseId,
                completedVideoIds: [],
                completedLectures: 0,
                totalLectures: course.lectureNumber || 0,
                percentage: 0
            });
        }

        // Add videoId if provided and not already present
        if (videoId && !progress.completedVideoIds.includes(videoId)) {
            progress.completedVideoIds.push(videoId);
        }

        // Recalculate stats
        progress.completedLectures = progress.completedVideoIds.length;
        progress.totalLectures = course.videos?.length || course.lectureNumber || 0; // Prefer actual video count

        progress.percentage = progress.totalLectures > 0
            ? Math.round((progress.completedLectures / progress.totalLectures) * 100)
            : 0;

        progress.lastAccessed = Date.now();

        await progress.save();

        res.status(200).json({
            success: true,
            message: 'Progress updated',
            data: progress
        });
    } catch (error) {
        console.error('Update Progress Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update progress'
        });
    }
};
