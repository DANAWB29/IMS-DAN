'use strict';

const prisma = require('../prisma');

/**
 * Generate a unique EAN-13 compatible barcode string
 * Format: IMS + timestamp_suffix + random digits
 */
const generateBarcode = () => {
    const timestamp = Date.now().toString().slice(-7);
    const random = Math.floor(Math.random() * 900 + 100).toString(); // 3 digits
    const raw = `IMS${timestamp}${random}`;
    return raw.substring(0, 13).padEnd(13, '0');
};

/**
 * Generate a unique SKU
 * Format: CATPREFIX-YYYYMMDD-RANDOM4
 * @param {string} categoryName - category name to build prefix
 */
const generateSKU = (categoryName = 'GEN') => {
    const prefix = categoryName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .substring(0, 3)
        .padEnd(3, 'X');

    const now = new Date();
    const datePart = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('');

    const random = Math.floor(Math.random() * 9000 + 1000); // 4 digits
    return `${prefix}-${datePart}-${random}`;
};

/**
 * Ensure the generated barcode is unique in the database
 */
const generateUniqueBarcode = async () => {
    let barcode;
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 10) {
        barcode = generateBarcode();
        const found = await prisma.product.findUnique({ where: { barcode } });
        exists = !!found;
        attempts++;
    }

    if (exists) throw new Error('Failed to generate a unique barcode after 10 attempts.');
    return barcode;
};

/**
 * Ensure the generated SKU is unique in the database
 */
const generateUniqueSKU = async (categoryName) => {
    let sku;
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 10) {
        sku = generateSKU(categoryName);
        const found = await prisma.product.findUnique({ where: { sku } });
        exists = !!found;
        attempts++;
    }

    if (exists) throw new Error('Failed to generate a unique SKU after 10 attempts.');
    return sku;
};

module.exports = { generateBarcode, generateSKU, generateUniqueBarcode, generateUniqueSKU };
