'use strict';

const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('./logger');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: env.isProd,
    },
});

/**
 * Send an email
 * @param {object} options - to, subject, html, text
 */
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const info = await transporter.sendMail({
            from: env.SMTP_FROM,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML as text fallback
        });
        logger.info(`Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (err) {
        logger.error(`Failed to send email to ${to}: ${err.message}`);
        throw err;
    }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (to, fullName, resetToken) => {
    const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    const subject = `${env.APP_NAME} — Password Reset Request`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>We received a request to reset your password for your <strong>${env.APP_NAME}</strong> account.</p>
      <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="background-color: #4F46E5; color: white; padding: 14px 28px;
                  text-decoration: none; border-radius: 6px; font-size: 16px;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        If you did not request a password reset, you can safely ignore this email.
        Your password will not change.
      </p>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">
        ${env.APP_NAME} &bull; This is an automated email, do not reply.
      </p>
    </div>
  `;
    return sendEmail({ to, subject, html });
};

/**
 * Send welcome email after registration
 */
const sendWelcomeEmail = async (to, fullName) => {
    const subject = `Welcome to ${env.APP_NAME}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to ${env.APP_NAME}!</h2>
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>Your account has been created successfully. You can now log in and start managing your inventory.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.FRONTEND_URL}/auth/login"
           style="background-color: #4F46E5; color: white; padding: 14px 28px;
                  text-decoration: none; border-radius: 6px; font-size: 16px;">
          Login Now
        </a>
      </div>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">
        ${env.APP_NAME} &bull; This is an automated email, do not reply.
      </p>
    </div>
  `;
    return sendEmail({ to, subject, html });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendWelcomeEmail };
