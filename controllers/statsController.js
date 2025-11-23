const User = require('../models/User');
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const ResponseHandler = require('../utils/responseHandler');
const CustomError = require('../utils/customError');

/**
 * Get dashboard statistics for admin
 * Calculates: Total Revenue, Active Students, Live Courses, Pending Exams
 */
exports.getDashboardStats = async (req, res, next) => {
    try {
        // 1. Calculate Total Revenue from successful transactions
        const revenueResult = await Transaction.aggregate([
            {
                $match: { status: 'success' }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' }
                }
            }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        // 2. Count Active Students (users with role 'student')
        const totalStudents = await User.countDocuments({ role: 'student' });

        // 3. Count Live Courses (all courses in the database)
        const totalCourses = await Course.countDocuments();

        // 4. Count Pending Exams (exams that need review or are upcoming)
        // Assuming pending exams are those without results or need grading
        const totalExams = await Exam.countDocuments();
        const completedResults = await Result.countDocuments();
        const pendingExams = Math.max(0, totalExams - completedResults);

        // 5. Additional useful stats
        const recentTransactions = await Transaction.find({ status: 'success' })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'name email')
            .populate('courseId', 'title');

        const stats = {
            totalRevenue,
            totalStudents,
            totalCourses,
            pendingExams,
            recentTransactions
        };

        ResponseHandler.success(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        next(new CustomError('Failed to fetch dashboard statistics', 500));
    }
};

/**
 * Get detailed analytics for revenue trends
 */
exports.getRevenueAnalytics = async (req, res, next) => {
    try {
        const { period = '30days' } = req.query;

        let startDate;
        const now = new Date();

        switch (period) {
            case '7days':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case '30days':
                startDate = new Date(now.setDate(now.getDate() - 30));
                break;
            case '90days':
                startDate = new Date(now.setDate(now.getDate() - 90));
                break;
            case '1year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                startDate = new Date(now.setDate(now.getDate() - 30));
        }

        const revenueByDay = await Transaction.aggregate([
            {
                $match: {
                    status: 'success',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        ResponseHandler.success(res, { period, data: revenueByDay }, 'Revenue analytics retrieved successfully');
    } catch (error) {
        console.error('Error fetching revenue analytics:', error);
        next(new CustomError('Failed to fetch revenue analytics', 500));
    }
};

/**
 * Get student growth analytics
 */
exports.getStudentGrowth = async (req, res, next) => {
    try {
        const { period = '30days' } = req.query;

        let startDate;
        const now = new Date();

        switch (period) {
            case '7days':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case '30days':
                startDate = new Date(now.setDate(now.getDate() - 30));
                break;
            case '90days':
                startDate = new Date(now.setDate(now.getDate() - 90));
                break;
            case '1year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                startDate = new Date(now.setDate(now.getDate() - 30));
        }

        const studentsByDay = await User.aggregate([
            {
                $match: {
                    role: 'student',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        ResponseHandler.success(res, { period, data: studentsByDay }, 'Student growth analytics retrieved successfully');
    } catch (error) {
        console.error('Error fetching student growth:', error);
        next(new CustomError('Failed to fetch student growth analytics', 500));
    }
};
