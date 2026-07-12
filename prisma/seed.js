'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
    console.log('🌱 Starting database seed...');

    // ── Roles ──────────────────────────────────────────────────
    console.log('  → Seeding roles...');
    const adminRole = await prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN' },
    });
    const storeRole = await prisma.role.upsert({
        where: { name: 'STORE' },
        update: {},
        create: { name: 'STORE' },
    });
    console.log('  ✅ Roles seeded.');

    // ── Admin User ────────────────────────────────────────────
    console.log('  → Seeding admin user...');
    const adminPassword = await bcrypt.hash('Admin@12345', SALT_ROUNDS);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@ims.com' },
        update: {},
        create: {
            fullName: 'System Administrator',
            email: 'admin@ims.com',
            password: adminPassword,
            roleId: adminRole.id,
            isActive: true,
        },
    });
    console.log(`  ✅ Admin user: admin@ims.com / Admin@12345`);

    // ── Store User ────────────────────────────────────────────
    console.log('  → Seeding store user...');
    const storePassword = await bcrypt.hash('Store@12345', SALT_ROUNDS);
    await prisma.user.upsert({
        where: { email: 'store@ims.com' },
        update: {},
        create: {
            fullName: 'Store Manager',
            email: 'store@ims.com',
            password: storePassword,
            roleId: storeRole.id,
            isActive: true,
        },
    });
    console.log(`  ✅ Store user: store@ims.com / Store@12345`);

    // ── Company Settings ──────────────────────────────────────
    console.log('  → Seeding company settings...');
    const settings = [
        { key: 'company_name', value: 'My Company', description: 'Company name' },
        { key: 'company_email', value: 'info@mycompany.com', description: 'Company email' },
        { key: 'company_phone', value: '+251900000000', description: 'Company phone' },
        { key: 'company_address', value: 'Addis Ababa, Ethiopia', description: 'Company address' },
        { key: 'currency', value: 'ETB', description: 'Default currency' },
        { key: 'tax_rate', value: '15', description: 'Default tax rate (%)' },
        { key: 'low_stock_threshold', value: '10', description: 'Default low stock alert threshold' },
        { key: 'invoice_prefix', value: 'INV', description: 'Invoice number prefix' },
        { key: 'purchase_prefix', value: 'PO', description: 'Purchase order number prefix' },
    ];

    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: {},
            create: s,
        });
    }
    console.log('  ✅ Settings seeded.');

    // ── Default Branch ────────────────────────────────────────
    console.log('  → Seeding default branch...');
    const branch = await prisma.branch.upsert({
        where: { name: 'Main Branch' },
        update: {},
        create: {
            name: 'Main Branch',
            address: 'Addis Ababa, Ethiopia',
            phone: '+251900000000',
        },
    });
    console.log('  ✅ Default branch seeded.');

    // ── Default Warehouse ─────────────────────────────────────
    console.log('  → Seeding default warehouse...');
    await prisma.warehouse.upsert({
        where: { name: 'Main Warehouse' },
        update: {},
        create: {
            name: 'Main Warehouse',
            location: 'Addis Ababa, Ethiopia',
            branchId: branch.id,
            isActive: true,
        },
    });
    console.log('  ✅ Default warehouse seeded.');

    // ── Sample Employee ───────────────────────────────────────
    console.log('  → Seeding sample employee...');
    await prisma.employee.upsert({
        where: { email: 'john.doe@ims.com' },
        update: {},
        create: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@ims.com',
            phone: '+251911000001',
            salary: 15000,
            hireDate: new Date('2024-01-01'),
            position: 'Sales Associate',
            department: 'Sales',
            branchId: branch.id,
            isActive: true,
        },
    });
    console.log('  ✅ Sample employee seeded.');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin → admin@ims.com / Admin@12345');
    console.log('   Store → store@ims.com / Store@12345');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
