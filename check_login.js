const http = require('http');
function post(path, body) {
    return new Promise((resolve) => {
        const data = JSON.stringify(body);
        const opts = {
            method: 'POST', hostname: 'localhost', port: 3000, path,
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };
        const r = http.request(opts, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { resolve({ raw }); } });
        });
        r.on('error', e => resolve({ error: e.message }));
        r.write(data); r.end();
    });
}
(async () => {
    const r = await post('/auth/login', { email: 'admin@ims.com', password: 'Admin@12345' });
    console.log('success:', r.success);
    console.log('token:', r.data?.accessToken ? 'OK' : 'MISSING');
    console.log('message:', r.message);
})();
