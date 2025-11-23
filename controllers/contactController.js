// controllers/contactController.js
const nodemailer = require('nodemailer');
const Setting = require('../models/Settings');

const sendContactEmail = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    // Get platform email from settings
    const settings = await Setting.get();
    const platformEmail = settings.email || process.env.ADMIN_EMAIL || 'support@activeclassroom.com';

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or use 'smtp' for custom SMTP
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: platformEmail,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="margin: 20px 0;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
            <p style="margin: 0;"><strong>Message:</strong></p>
            <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            This email was sent from the Active Classroom contact form.
          </p>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
    });
  } catch (error) {
    console.error('Contact email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
    });
  }
};

module.exports = { sendContactEmail };
