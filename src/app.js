'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const routes = require('./routes');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const logger = require('./utils/logger');
const env = require('./config/env');

const app = express();

// ── Security ─────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving uploaded images
}));

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
    origin: env.isProd
        ? [env.FRONTEND_URL]
        : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// ── Compression ──────────────────────────────────────────────
app.use(compression());

// ── HTTP Logging ─────────────────────────────────────────────
const morganFormat = env.isDev ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.url === '/system/health', // Don't log health checks
}));

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files (Uploads) ───────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Rate Limiting ────────────────────────────────────────────
app.use(apiLimiter);

// ── Routes ───────────────────────────────────────────────────
app.use('/', routes);

// ── 404 ──────────────────────────────────────────────────────
app.use(notFound);

// ── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
