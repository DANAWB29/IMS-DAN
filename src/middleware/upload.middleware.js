'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');
const env = require('../config/env');

// Ensure upload directory exists
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

/**
 * Create a multer storage engine for a given subdirectory
 */
const createStorage = (subDir) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path.join(env.UPLOAD_DIR, subDir);
            ensureDir(uploadPath);
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `${uniqueSuffix}${ext}`);
        },
    });
};

// Image file filter — only allow common image types
const imageFileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Only image files are allowed (jpeg, jpg, png, webp, gif).', 400), false);
    }
};

// Document file filter
const documentFileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Only PDF or image files are allowed.', 400), false);
    }
};

// Product image upload — up to 5 images
const uploadProductImages = multer({
    storage: createStorage('products'),
    fileFilter: imageFileFilter,
    limits: { fileSize: env.MAX_FILE_SIZE, files: 5 },
});

// Avatar upload — single image
const uploadAvatar = multer({
    storage: createStorage('avatars'),
    fileFilter: imageFileFilter,
    limits: { fileSize: env.MAX_FILE_SIZE, files: 1 },
});

// Receipt/document upload
const uploadReceipt = multer({
    storage: createStorage('receipts'),
    fileFilter: documentFileFilter,
    limits: { fileSize: env.MAX_FILE_SIZE, files: 1 },
});

module.exports = { uploadProductImages, uploadAvatar, uploadReceipt };
