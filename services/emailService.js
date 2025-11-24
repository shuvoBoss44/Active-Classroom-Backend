const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require('nodemailer');
const CustomError = require('../utils/customError');

// Email service for sending transactional emails
class EmailService {
    static async sendInvoiceEmail(mailOptions, retries = 2) {
        let lastError = null;

        for (let attempt = 0; attempt <= retries; attempt++) {
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
                        },
                        // Connection timeout and socket timeout settings
                        connectionTimeout: 10000, // 10 seconds to establish connection
                        greetingTimeout: 5000,    // 5 seconds for greeting
                        socketTimeout: 15000,     // 15 seconds for socket inactivity
                        // Connection pool settings
                        pool: true,
                        maxConnections: 5,
                        maxMessages: 100
                    });
                } else {
                    // Fallback to Gmail Service (Legacy/Local)
                    transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS
                        },
                        connectionTimeout: 10000,
                        greetingTimeout: 5000,
                        socketTimeout: 15000
                    });
                }

                await transporter.sendMail(mailOptions);
                console.log(`✅ Email sent successfully${attempt > 0 ? ` (attempt ${attempt + 1})` : ''}`);
                return; // Success - exit the retry loop
            } catch (error) {
                lastError = error;
                console.error(`❌ Email sending failed (attempt ${attempt + 1}/${retries + 1}):`, error.message);

                // If this wasn't the last attempt, wait before retrying
                if (attempt < retries) {
                    const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s
                    console.log(`⏳ Retrying in ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }

        // If we get here, all retries failed
        console.error("❌ All email sending attempts failed. Last error:", lastError.message);
        throw new CustomError(`Failed to send invoice email after ${retries + 1} attempts: ${lastError.message}`, 500);
    }
}

module.exports = EmailService;