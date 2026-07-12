'use strict';

const http = require('http');

const BASE = 'http://localhost:3000';
let pass = 0; let fail = 0;

const req = (method, path, body, token) => new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
        method,
        hostname: 'localhost',
        port: 3000,
        path,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
    };
    const r = http.request(opts, (res) => {
        let raw = '';
        res.on('data', (c) => raw += c);
        res.on('end', () => {
            try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
            catch { resolve({ status: res.statusCode, body: raw }); }
        });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
});

const ok = (n, label, cond, detail = '') => {
    if (cond) { console.log(`\x1b[32mPASS\x1b[0m [${String(n).padStart(2, '0')}] ${label}${detail ? ' — ' + detail : ''}`); pass++; }
    else { console.log(`\x1b[31mFAIL\x1b[0m [${String(n).padStart(2, '0')}] ${label}${detail ? ' — ' + detail : ''}`); fail++; }
};

(async () => {
    console.log('\n\x1b[36m=== IMS COMPLETE E2E TEST SUITE ===\x1b[0m\n');

    // 1 — Login
    let r = await req('POST', '/auth/login', { email: 'admin@ims.com', password: 'Admin@12345' });
    ok(1, 'Login', r.status === 200 && r.body.data?.accessToken, `status=${r.status}`);
    const token = r.body.data.accessToken;
    const refreshTok = r.body.data.refreshToken;

    // 2 — /auth/me
    r = await req('GET', '/auth/me', null, token);
    ok(2, '/auth/me', r.status === 200 && r.body.data?.email === 'admin@ims.com', r.body.data?.fullName);

    // 3 — users list
    r = await req('GET', '/users', null, token);
    ok(3, '/users list', r.status === 200 && r.body.meta?.total >= 2, `total=${r.body.meta?.total}`);

    // 4 — employees list
    r = await req('GET', '/employees', null, token);
    ok(4, '/employees list', r.status === 200 && r.body.meta?.total >= 1, `total=${r.body.meta?.total}`);
    const empId = r.body.data[0].id;

    // 5 — create category (unique name per run to avoid conflicts)
    const runId = Date.now();
    r = await req('POST', '/categories', { name: `E2E Category ${runId}`, description: 'automated test' }, token);
    ok(5, 'Create category', r.status === 201 && r.body.data?.id, r.body.data?.name);
    const catId = r.body.data.id;

    // 6 — get category by id
    r = await req('GET', `/categories/${catId}`, null, token);
    ok(6, 'Get category by ID', r.status === 200 && r.body.data?.id === catId);

    // 7 — create product
    r = await req('POST', '/products', {
        name: `E2E Product ${runId}`, sellingPrice: 1500, costPrice: 900,
        minimumStock: 5, unit: 'pcs', categoryId: catId,
    }, token);
    ok(7, 'Create product', r.status === 201 && r.body.data?.sku, `SKU=${r.body.data?.sku}`);
    const prodId = r.body.data.id;

    // 8 — create supplier
    r = await req('POST', '/suppliers', { name: `E2E Supplier ${runId}`, phone: `+2519${runId.toString().slice(-8)}` }, token);
    ok(8, 'Create supplier', r.status === 201 && r.body.data?.id, r.body.data?.name);
    const supId = r.body.data.id;

    // 9 — stock in
    r = await req('POST', '/stock/in', {
        productId: prodId, supplierId: supId,
        quantity: 100, buyingPrice: 900, batchNumber: `E2E-BTC-${runId}`,
    }, token);
    ok(9, 'Stock In', r.status === 201 && r.body.data?.remainingQty === 100, `qty=${r.body.data?.remainingQty}`);

    // 10 — check product stock
    r = await req('GET', `/products/${prodId}`, null, token);
    ok(10, 'Product stock after stock-in', r.body.data?.currentStock === 100, `stock=${r.body.data?.currentStock}`);

    // 11 — create customer
    const custPhone = `+251${runId.toString().slice(-9)}`;
    r = await req('POST', '/customers', { name: `E2E Customer ${runId}`, phone: custPhone }, token);
    ok(11, 'Create customer', r.status === 201 && r.body.data?.id, r.body.data?.name);
    const custId = r.body.data.id;

    // 12 — create sale
    r = await req('POST', '/sales', {
        customerId: custId, employeeId: empId,
        paymentMethod: 'CASH', discount: 0, taxRate: 15, paidAmount: 5175,
        items: [{ productId: prodId, quantity: 3, unitPrice: 1500, discount: 0 }],
    }, token);
    ok(12, 'Create sale (POS)', r.status === 201 && r.body.data?.invoiceNumber,
        `inv=${r.body.data?.invoiceNumber} total=${r.body.data?.total} status=${r.body.data?.paymentStatus}`);
    const saleId = r.body.data.id;

    // 13 — check stock deducted after sale
    r = await req('GET', `/products/${prodId}`, null, token);
    ok(13, 'Stock deducted after sale', r.body.data?.currentStock === 97, `stock=${r.body.data?.currentStock} (expect 97)`);

    // 14 — today sales summary
    r = await req('GET', '/sales/today', null, token);
    ok(14, 'Today summary', r.status === 200, `count=${r.body.data?._count?.id}`);

    // 15 — create purchase order
    r = await req('POST', '/purchases', {
        supplierId: supId,
        items: [{ productId: prodId, quantity: 20, unitCost: 880 }],
    }, token);
    ok(15, 'Create purchase order', r.status === 201 && r.body.data?.purchaseNumber,
        `PO=${r.body.data?.purchaseNumber} status=${r.body.data?.status}`);
    const poId = r.body.data.id;

    // 16 — receive purchase
    r = await req('PATCH', `/purchases/${poId}/receive`, {}, token);
    ok(16, 'Receive purchase', r.status === 200 && r.body.data?.status === 'RECEIVED', `status=${r.body.data?.status}`);

    // 17 — stock after purchase receive
    r = await req('GET', `/products/${prodId}`, null, token);
    ok(17, 'Stock after purchase receive', r.body.data?.currentStock === 117, `stock=${r.body.data?.currentStock} (expect 117)`);

    // 18 — stock movements
    r = await req('GET', `/stock/movements?productId=${prodId}`, null, token);
    ok(18, 'Stock movements', r.status === 200 && r.body.meta?.total >= 3, `total=${r.body.meta?.total}`);

    // 19 — stock batches
    r = await req('GET', `/stock/batches/${prodId}`, null, token);
    ok(19, 'Stock batches', r.status === 200 && r.body.data?.length >= 2, `batches=${r.body.data?.length}`);

    // 20 — create expense category
    r = await req('POST', '/expenses/categories', { name: `E2E Expense Cat ${runId}` }, token);
    ok(20, 'Create expense category', r.status === 201, r.body.data?.name);
    const expCatId = r.body.data.id;

    // 21 — create expense
    r = await req('POST', '/expenses', {
        title: 'E2E Expense', amount: 350, categoryId: expCatId,
        expenseDate: new Date().toISOString(), status: 'PAID',
    }, token);
    ok(21, 'Create expense', r.status === 201, `title=${r.body.data?.title} amount=${r.body.data?.amount}`);

    // 22 — dashboard
    r = await req('GET', '/reports/dashboard', null, token);
    ok(22, 'Dashboard', r.status === 200 && r.body.data?.counts, `products=${r.body.data?.counts?.products}`);

    // 23 — sales report
    r = await req('GET', '/reports/sales?startDate=2024-01-01&endDate=2030-12-31', null, token);
    ok(23, 'Sales report', r.status === 200 && Array.isArray(r.body.data), `days=${r.body.data?.length}`);

    // 24 — inventory report
    r = await req('GET', '/reports/inventory', null, token);
    ok(24, 'Inventory report', r.status === 200 && Array.isArray(r.body.data), `rows=${r.body.data?.length}`);

    // 25 — profit & loss
    r = await req('GET', '/reports/profit-loss?startDate=2024-01-01&endDate=2030-12-31', null, token);
    ok(25, 'Profit & Loss', r.status === 200 && r.body.data?.length > 0,
        `revenue=${r.body.data?.[0]?.totalRevenue} profit=${r.body.data?.[0]?.netProfit}`);

    // 26 — employee sales report
    r = await req('GET', '/reports/employees?startDate=2024-01-01&endDate=2030-12-31', null, token);
    ok(26, 'Employee sales report', r.status === 200, `rows=${r.body.data?.length}`);

    // 27 — settings read
    r = await req('GET', '/settings', null, token);
    ok(27, 'Settings read', r.status === 200 && r.body.data?.currency, `currency=${r.body.data?.currency}`);

    // 28 — settings update
    r = await req('PATCH', '/settings/company_name', { value: 'IMS Test Store' }, token);
    ok(28, 'Settings update', r.status === 200 && r.body.data?.value === 'IMS Test Store');

    // 29 — notifications
    r = await req('GET', '/notifications', null, token);
    ok(29, 'Notifications', r.status === 200, `total=${r.body.meta?.total} unread=${r.body.meta?.unreadCount}`);

    // 30 — mark all notifications read
    r = await req('PATCH', '/notifications/read-all', null, token);
    ok(30, 'Mark all notifications read', r.status === 200);

    // 31 — attendance check-in
    r = await req('POST', '/employees/attendance/check-in', { employeeId: empId }, token);
    const checkInOk = r.status === 201 || (r.status === 409 && r.body.message?.includes('already'));
    ok(31, 'Attendance check-in', checkInOk, `status=${r.status} ${r.body.message || r.body.data?.status || ''}`);

    // 32 — attendance list
    r = await req('GET', '/employees/attendance/all', null, token);
    ok(32, 'Attendance list', r.status === 200, `total=${r.body.meta?.total}`);

    // 33 — attendance summary
    r = await req('GET', `/employees/${empId}/attendance/summary?startDate=2024-01-01&endDate=2030-12-31`, null, token);
    ok(33, 'Attendance summary', r.status === 200 && r.body.data?.summary, `PRESENT=${r.body.data?.summary?.PRESENT}`);

    // 34 — customer history
    r = await req('GET', `/customers/${custId}/history`, null, token);
    ok(34, 'Customer history', r.status === 200, `sales=${r.body.data?.meta?.total}`);

    // 35 — activity logs
    r = await req('GET', '/logs/activity', null, token);
    ok(35, 'Activity logs', r.status === 200 && r.body.meta?.total > 0, `total=${r.body.meta?.total}`);

    // 36 — audit logs
    r = await req('GET', '/logs/audit', null, token);
    ok(36, 'Audit logs', r.status === 200, `total=${r.body.meta?.total}`);

    // 37 — refresh token
    r = await req('POST', '/auth/refresh', { refreshToken: refreshTok });
    ok(37, 'Refresh token', r.status === 200 && r.body.data?.accessToken, `new token issued`);

    // 38 — validation rejection
    r = await req('POST', '/auth/login', { email: 'not-an-email', password: '' });
    ok(38, 'Validation rejection', r.status === 400 && r.body.errors?.length > 0, `errors=${r.body.errors?.length}`);

    // 39 — role protection (store can't access users)
    const storeLogin = await req('POST', '/auth/login', { email: 'store@ims.com', password: 'Store@12345' });
    const storeToken = storeLogin.body.data.accessToken;
    r = await req('GET', '/users', null, storeToken);
    ok(39, 'Role protection (STORE blocked from /users)', r.status === 403, `status=${r.status}`);

    // 40 — unauthenticated access rejected
    r = await req('GET', '/products');
    ok(40, 'Auth protection (no token rejected)', r.status === 401, `status=${r.status}`);

    // Summary
    const total = pass + fail;
    console.log('\n\x1b[36m' + '='.repeat(50) + '\x1b[0m');
    console.log(`\x1b[32m PASSED: ${pass}/${total}\x1b[0m  \x1b[31mFAILED: ${fail}/${total}\x1b[0m`);
    console.log('\x1b[36m' + '='.repeat(50) + '\x1b[0m\n');

    process.exit(fail > 0 ? 1 : 0);
})();
