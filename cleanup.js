'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('🔍 Checking database contents before cleanup...\n');

  const counts = await Promise.all([
    prisma.auditLog.count(),
    prisma.activityLog.count(),
    prisma.notification.count(),
    prisma.session.count(),
    prisma.refreshToken.count(),
    prisma.passwordReset.count(),
    prisma.payment.count(),
    prisma.saleItem.count(),
    prisma.sale.count(),
    prisma.purchaseItem.count(),
    prisma.purchase.count(),
    prisma.stockMovement.count(),
    prisma.batch.count(),
    prisma.product.count(),
    prisma.productImage.count(),
    prisma.category.count(),
    prisma.supplier.count(),
    prisma.customer.count(),
    prisma.expense.count(),
    prisma.expenseCategory.count(),
    prisma.attendance.count(),
    prisma.leave.count(),
    prisma.employee.count(),
    prisma.warehouse.count(),
    prisma.branch.count(),
    prisma.setting.count(),
    prisma.user.count(),
    prisma.role.count(),
  ]);

  const labels = [
    'auditLogs', 'activityLogs', 'notifications', 'sessions', 'refreshTokens',
    'passwordResets', 'payments', 'saleItems', 'sales', 'purchaseItems',
    'purchases', 'stockMovements', 'batches', 'products', 'productImages',
    'categories', 'suppliers', 'customers', 'expenses', 'expenseCategories',
    'attendances', 'leaves', 'employees', 'warehouses', 'branches',
    'settings', 'users', 'roles',
  ];

  labels.forEach((l, i) => console.log(`  ${l.padEnd(20)}: ${counts[i]}`));

  console.log('\n🗑️  Starting cleanup — deleting ALL test/sample data...\n');

  // Delete in dependency order (children before parents)
  await prisma.auditLog.deleteMany({});
  console.log('  ✅ Audit logs cleared');

  await prisma.activityLog.deleteMany({});
  console.log('  ✅ Activity logs cleared');

  await prisma.notification.deleteMany({});
  console.log('  ✅ Notifications cleared');

  await prisma.session.deleteMany({});
  console.log('  ✅ Sessions cleared');

  await prisma.refreshToken.deleteMany({});
  console.log('  ✅ Refresh tokens cleared');

  await prisma.passwordReset.deleteMany({});
  console.log('  ✅ Password resets cleared');

  await prisma.payment.deleteMany({});
  console.log('  ✅ Payments cleared');

  await prisma.saleItem.deleteMany({});
  console.log('  ✅ Sale items cleared');

  await prisma.sale.deleteMany({});
  console.log('  ✅ Sales cleared');

  await prisma.purchaseItem.deleteMany({});
  console.log('  ✅ Purchase items cleared');

  await prisma.purchase.deleteMany({});
  console.log('  ✅ Purchases cleared');

  await prisma.stockMovement.deleteMany({});
  console.log('  ✅ Stock movements cleared');

  await prisma.batch.deleteMany({});
  console.log('  ✅ Batches cleared');

  await prisma.productImage.deleteMany({});
  console.log('  ✅ Product images cleared');

  await prisma.product.deleteMany({});
  console.log('  ✅ Products cleared');

  await prisma.category.deleteMany({});
  console.log('  ✅ Categories cleared');

  await prisma.supplier.deleteMany({});
  console.log('  ✅ Suppliers cleared');

  await prisma.customer.deleteMany({});
  console.log('  ✅ Customers cleared');

  await prisma.expense.deleteMany({});
  console.log('  ✅ Expenses cleared');

  await prisma.expenseCategory.deleteMany({});
  console.log('  ✅ Expense categories cleared');

  await prisma.attendance.deleteMany({});
  console.log('  ✅ Attendance records cleared');

  await prisma.leave.deleteMany({});
  console.log('  ✅ Leave records cleared');

  await prisma.employee.deleteMany({});
  console.log('  ✅ Employees cleared');

  await prisma.warehouse.deleteMany({});
  console.log('  ✅ Warehouses cleared');

  await prisma.branch.deleteMany({});
  console.log('  ✅ Branches cleared');

  await prisma.setting.deleteMany({});
  console.log('  ✅ Settings cleared');

  // Delete all users EXCEPT admin and store (keep seeded system accounts)
  // Actually delete everyone — seed will recreate the two system users
  await prisma.user.deleteMany({});
  console.log('  ✅ Users cleared');

  // Roles stay — they are enum-backed and required
  console.log('  ℹ️  Roles kept (ADMIN, STORE — required by schema)');

  console.log('\n✅ Database fully cleaned.\n');
  console.log('🌱 Re-seeding system defaults (roles, admin user, settings, branch, warehouse)...\n');
}

cleanup()
  .catch((e) => { console.error('❌ Cleanup failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
