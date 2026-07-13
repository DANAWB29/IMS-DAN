'use strict';

require('dotenv').config();

const required = (key) => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
};

module.exports = {
    // Server
    PORT: parseInt(process.env.PORT, 10) || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',

    // Database
    DATABASE_URL: required('DATABASE_URL'),

    // JWT
    JWT_SECRET: required('JWT_SECRET'),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // Email
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM: process.env.SMTP_FROM || 'IMS System <no-reply@ims.com>',

    // App
    APP_NAME: process.env.APP_NAME || 'Inventory Management System',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

    // Uploads
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
    LOG_DIR: process.env.LOG_DIR || 'logs',
};
