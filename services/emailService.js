const nodemailer = require('nodemailer');
const CustomError = require('../utils/customError');

// Email service for sending transactional emails
class EmailService {
    static async sendInvoiceEmail(mailOptions) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error("❌ Email Service Error:", error);
            throw new CustomError(`Failed to send invoice email: ${error.message}`, 500);
        }
    }
}

module.exports = EmailService;