const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require('nodemailer');
const CustomError = require('../utils/customError');

// Email service for sending transactional emails
class EmailService {
    static async sendInvoiceEmail(mailOptions) {
        try {
            let transporter;

            if (process.env.SMTP_HOST) {
                // Explicit SMTP Configuration (Recommended for Production)
                transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
            } else {
                // Fallback to Gmail Service (Legacy/Local)
                transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
            }

            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error("❌ Email sending failed:", error);
            throw new CustomError('Failed to send invoice email', 500);
        }
    }
}

module.exports = EmailService;