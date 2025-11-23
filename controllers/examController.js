const Exam = require('../models/Exam');
const Result = require('../models/Result');
const ResponseHandler = require('../utils/responseHandler');

class ExamController {
    // 1. Create Exam (Admin/Teacher)
    static async createExam(req, res, next) {
        try {
            const { title, courseId, duration, totalMarks, passMarks, questions } = req.body;

            const exam = await Exam.create({
                title,
                courseId,
                duration,
                totalMarks,
                passMarks,
                questions
            });

            ResponseHandler.created(res, { exam }, 'Exam created successfully');
        } catch (error) {
            next(error);
        }
    }

    // 1.5 Update Exam (Admin/Teacher)
    static async updateExam(req, res, next) {
        try {
            const { examId } = req.params;
            const { title, courseId, duration, totalMarks, passMarks, questions } = req.body;

            const exam = await Exam.findByIdAndUpdate(
                examId,
                { title, courseId, duration, totalMarks, passMarks, questions },
                { new: true, runValidators: true }
            );

            if (!exam) {
                return ResponseHandler.error(res, 'Exam not found', 404);
            }

            ResponseHandler.success(res, { exam }, 'Exam updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // 1.6 Delete Exam (Admin/Teacher)
    static async deleteExam(req, res, next) {
        try {
            const { examId } = req.params;

            const exam = await Exam.findByIdAndDelete(examId);

            if (!exam) {
                return ResponseHandler.error(res, 'Exam not found', 404);
            }

            // Optionally delete associated results
            await Result.deleteMany({ examId });

            ResponseHandler.success(res, {}, 'Exam deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    // 2. Get Exams by Course (Student/Admin)
    static async getExamsByCourse(req, res, next) {
        try {
            const { courseId } = req.params;
            // Exclude questions for the list view to save bandwidth
            const exams = await Exam.find({ courseId, isActive: true })
                .select('-questions')
                .lean();

            ResponseHandler.success(res, { exams }, 'Exams retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // 2.5 Get All Exams (Public/Student)
    static async getAllExams(req, res, next) {
        try {
            const exams = await Exam.find({ isActive: true })
                .select('-questions')
                .lean();
            ResponseHandler.success(res, { exams }, 'All exams retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // 3. Get Exam Details (Student - Taking Exam)
    static async getExamById(req, res, next) {
        try {
            const { examId } = req.params;
            const exam = await Exam.findById(examId).lean();

            if (!exam) {
                return ResponseHandler.error(res, 'Exam not found', 404);
            }

            // For students, we MUST hide the correctOption from the response
            if (req.user.role === 'student') {
                exam.questions = exam.questions.map(q => {
                    const { correctOption, ...rest } = q;
                    return rest;
                });
            }

            ResponseHandler.success(res, { exam }, 'Exam retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // 4. Submit Exam (Student)
    static async submitExam(req, res, next) {
        try {
            const { examId, answers } = req.body; // answers: [{ questionId, selectedOption }]
            const userId = req.user._id;

            const exam = await Exam.findById(examId);
            if (!exam) {
                return ResponseHandler.error(res, 'Exam not found', 404);
            }

            let score = 0;
            let correctAnswers = 0;
            let wrongAnswers = 0;
            const resultDetails = [];

            // Calculate Score
            exam.questions.forEach(question => {
                const studentAnswer = answers.find(a => a.questionId === question._id.toString());

                if (studentAnswer && studentAnswer.selectedOption === question.correctOption) {
                    score += question.marks;
                    correctAnswers++;
                    resultDetails.push({
                        questionId: question._id,
                        selectedOption: studentAnswer.selectedOption,
                        isCorrect: true
                    });
                } else {
                    wrongAnswers++;
                    resultDetails.push({
                        questionId: question._id,
                        selectedOption: studentAnswer ? studentAnswer.selectedOption : null,
                        isCorrect: false
                    });
                }
            });

            // Save Result
            const result = await Result.create({
                userId,
                examId,
                score,
                totalMarks: exam.totalMarks,
                correctAnswers,
                wrongAnswers,
                answers: resultDetails
            });

            ResponseHandler.created(res, { result }, 'Exam submitted successfully');
        } catch (error) {
            next(error);
        }
    }

    // 5. Get User Results (Student)
    static async getUserResults(req, res, next) {
        try {
            const userId = req.user._id;
            const results = await Result.find({ userId })
                .populate('examId', 'title')
                .sort({ createdAt: -1 })
                .lean();

            ResponseHandler.success(res, { results }, 'Results retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
    // 6. Get Single Result with Full Details (Solution View)
    static async getResultById(req, res, next) {
        try {
            const { resultId } = req.params;
            const userId = req.user._id;

            const result = await Result.findById(resultId)
                .populate('examId') // Populate full exam details including questions
                .lean();

            if (!result) {
                return ResponseHandler.error(res, 'Result not found', 404);
            }

            // Authorization Check: User must own the result or be an admin/teacher
            if (result.userId.toString() !== userId.toString() && !['admin', 'teacher'].includes(req.user.role)) {
                return ResponseHandler.error(res, 'Unauthorized access to this result', 403);
            }

            ResponseHandler.success(res, { result }, 'Result details retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ExamController;
