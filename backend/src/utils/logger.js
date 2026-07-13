'use strict';

const winston = require('winston');
const path = require('path');
const env = require('../config/env');

const { combine, timestamp, printf, colorize, align, json, errors } = winston.format;

// Custom log format for console
const consoleFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    align(),
    printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`)
);

// JSON format for file logs
const fileFormat = combine(
    errors({ stack: true }),
    timestamp(),
    json()
);

const transports = [
    new winston.transports.Console({
        format: consoleFormat,
        silent: env.NODE_ENV === 'test',
    }),
];

// Write to files only in production or development (not test)
if (env.NODE_ENV !== 'test') {
    transports.push(
        new winston.transports.File({
            filename: path.join(env.LOG_DIR, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(env.LOG_DIR, 'combined.log'),
            format: fileFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        })
    );
}

const logger = winston.createLogger({
    level: env.LOG_LEVEL || 'info',
    transports,
    exitOnError: false,
});

module.exports = logger;
