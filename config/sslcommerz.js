const mongoose = require('mongoose');
const SSLCommerzPayment = require('sslcommerz-lts');
const Transaction = require('../models/Transaction');
const Course = require('../models/Course');
const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');
const CustomError = require('../utils/customError');
const { v4: uuidv4 } = require('uuid');
const EmailService = require('../services/emailService');
const Enrollment = require('../models/Enrollment');

// Extract config once for readability and consistency
const STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
const STORE_PASSWD = process.env.SSLCOMMERZ_STORE_PASSWORD;
const IS_LIVE = false;

class SSLCommerzService {
    static async initiatePayment(req, res, next) {
        try {
            const { courseId, phone, facebookId, schoolCollege, session } = req.body;

            // Validate required enrollment fields
            if (!phone || !facebookId || !schoolCollege || !session) {
                throw new CustomError('Missing required enrollment information', 400);
            }

            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                throw new CustomError('Invalid course ID', 400);
            }

            const course = await Course.findById(courseId);
            if (!course) throw new CustomError('Course not found', 404);

            const user = await User.findById(req.user._id);
            if (!user) throw new CustomError('User not found', 404);

            if (user.purchasedCourses.map(id => id.toString()).includes(courseId)) {
                throw new CustomError('User already enrolled in this course', 400);
            }

            const amount = Number(course.discountedPrice || course.price);

            const tranId = uuidv4();
            const customerName = String(user.name || 'Anonymous');
            const customerEmail = String(user.email || 'contact@example.com');
            const customerPhone = String(phone || '01000000000'); // Use provided phone

            const data = {
                total_amount: amount,
                currency: 'BDT',
                tran_id: tranId,

                // Frontend redirect URLs should be handled by these backend routes
                success_url: `${process.env.BACKEND_URL}/api/transactions/success`,
                fail_url: `${process.env.BACKEND_URL}/api/transactions/fail`,
                cancel_url: `${process.env.BACKEND_URL}/api/transactions/cancel`,
                ipn_url: `${process.env.BACKEND_URL}/api/transactions/ipn`,

                cus_name: customerName,
                cus_email: customerEmail,
                cus_phone: customerPhone,

                product_name: String(course.title),
                product_category: 'Course',
                product_profile: 'general',
                shipping_method: 'NO',

                // Store enrollment details in value_a, value_b, value_c, value_d for later retrieval
                value_a: phone,
                value_b: facebookId,
                value_c: schoolCollege,
                value_d: session
            };

            const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASSWD, false);
            const response = await sslcz.init(data);

            if (response.GatewayPageURL) {
                const transaction = new Transaction({
                    userId: user._id,
                    courseId,
                    amount,
                    currency: 'BDT',
                    tranId,
                    status: 'initiated'
                });

                await transaction.save();

                // 🛠️ CRITICAL FIX: Match property name 'paymentUrl' expected by the client
                return ResponseHandler.success(
                    res,
                    {
                        paymentUrl: response.GatewayPageURL, // <--- Corrected for client
                        amount: response.total_amount
                    },
                    'Payment initiated successfully'
                );
            } else {
                throw new CustomError('Failed to initiate payment', 500);
            }

        } catch (error) {
            next(error);
        }
    }

    static async handleSuccess(req, res, next) {
        try {
            const { tran_id, val_id } = req.body;

            const transaction = await Transaction.findOne({ tranId: tran_id });
            if (!transaction) {
                return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?tranId=${tran_id}&reason=TransactionNotFound`);
            }
            if (transaction.status === 'success') {
                return res.redirect(`${process.env.FRONTEND_URL}/payment/success?tranId=${tran_id}`);
            }

            const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASSWD, IS_LIVE);
            const validationResponse = await sslcz.validate({ val_id });

            if (validationResponse.status !== 'VALID') {
                transaction.status = 'failed';
                await transaction.save();
                return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?tranId=${tran_id}&reason=ValidationFailed`);
            }

            transaction.status = 'success';
            transaction.valId = val_id;

            const [course, user] = await Promise.all([
                Course.findById(transaction.courseId),
                User.findById(transaction.userId)
            ]);

            if (!course || !user) {
                transaction.status = 'failed';
                await transaction.save();
                return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?tranId=${tran_id}&reason=UserOrCourseNotFound`);
            }

            // Enrollment Update
            course.studentsEnrolled += 1;
            user.purchasedCourses.push(course._id);

            // Update user profile with enrollment information
            user.phone = req.body.value_a || user.phone;
            user.facebookId = req.body.value_b || user.facebookId;
            user.schoolCollege = req.body.value_c || user.schoolCollege;
            user.session = req.body.value_d || user.session;

            // Create Enrollment Record
            const enrollment = new Enrollment({
                user: user._id,
                course: course._id,
                phone: req.body.value_a || '01000000000',
                facebookId: req.body.value_b || 'N/A',
                schoolCollege: req.body.value_c || 'N/A',
                session: req.body.value_d || 'N/A',
                transactionId: transaction.tranId,
                amount: transaction.amount,
                enrollmentDate: new Date()
            });

            await Promise.all([course.save(), user.save(), transaction.save(), enrollment.save()]);

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: `Invoice for ${course.title} Purchase`,
                html: `
                    <h2>Thank You for Your Purchase!</h2>
                    <p>Dear ${user.name || 'Customer'},</p>
                    <p>Your purchase of <strong>${course.title}</strong> has been successfully completed.</p>
                    <h3>Transaction Details:</h3>
                    <ul>
                        <li>Transaction ID: ${transaction.tranId}</li>
                        <li>Course: ${course.title}</li>
                        <li>Amount: ${transaction.amount} ${transaction.currency}</li>
                        <li>Status: ${transaction.status}</li>
                    </ul>
                    <p>Thank you for choosing our platform!</p>
                    <p>Best regards,<br>Active Classroom Team</p>
                `
            };

            await EmailService.sendInvoiceEmail(mailOptions);

            // 🛠️ CRITICAL FIX: Redirect to frontend success page
            return res.redirect(`${process.env.FRONTEND_URL}/payment/success?tranId=${tran_id}`);

        } catch (error) {
            next(error);
        }
    }

    static async handleFail(req, res, next) {
        try {
            const { tran_id } = req.body;
            const transaction = await Transaction.findOne({ tranId: tran_id });

            if (transaction) {
                transaction.status = 'failed';
                await transaction.save();
            }

            // 🛠️ CRITICAL FIX: Redirect to frontend failed page
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?tranId=${tran_id || 'N/A'}&reason=PaymentFailed`);
        } catch (error) {
            next(error);
        }
    }

    static async handleCancel(req, res, next) {
        try {
            const { tran_id } = req.body;
            const transaction = await Transaction.findOne({ tranId: tran_id });

            if (transaction) {
                transaction.status = 'cancelled';
                await transaction.save();
            }

            // 🛠️ CRITICAL FIX: Redirect to frontend failed/cancelled page
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?tranId=${tran_id || 'N/A'}&reason=UserCancelled`);
        } catch (error) {
            next(error);
        }
    }

    // handleIPN remains the same as it returns 200 JSON to the gateway, not a redirect
    static async handleIPN(req, res, next) {
        try {
            const { tran_id, status, val_id } = req.body;

            const transaction = await Transaction.findOne({ tranId: tran_id });
            if (!transaction) {
                return res.status(200).json({ message: 'Transaction not found in DB.' });
            }
            if (transaction.status === 'success') {
                return res.status(200).json({ message: 'Transaction already successful.' });
            }

            if (status === 'VALID') {
                transaction.status = 'success';
                transaction.valId = val_id;

                const [course, user] = await Promise.all([
                    Course.findById(transaction.courseId),
                    User.findById(transaction.userId)
                ]);

                if (course && user) {
                    const isAlreadyEnrolled = user.purchasedCourses.some(id => id.toString() === course._id.toString());

                    if (!isAlreadyEnrolled) {
                        course.studentsEnrolled += 1;
                        user.purchasedCourses.push(course._id);
                        await Promise.all([course.save(), user.save()]);
                    }
                }
            } else if (status === 'FAILED') {
                transaction.status = 'failed';
            } else if (status === 'CANCELLED') {
                transaction.status = 'cancelled';
            }

            await transaction.save();
            res.status(200).json({ message: 'IPN processed successfully' });

        } catch (error) {
            console.error("IPN Processing Error:", error);
            res.status(200).json({ message: 'IPN processed, but internal error occurred.' });
        }
    }
}

module.exports = SSLCommerzService;