// Minimal stand-in for Gumroad's license API, used by the e2e tests only.
// POST /__register {key, product_id, email, ...purchase fields} registers a license.
import { createServer } from 'node:http';

const licenses = new Map();
const read = (req) => new Promise((resolve) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => resolve(b)); });

createServer(async (req, res) => {
  const body = await read(req);
  if (req.method === 'POST' && req.url === '/__register') {
    const l = JSON.parse(body);
    licenses.set(l.key, l);
    res.writeHead(200).end('ok');
    return;
  }
  if (req.method === 'POST' && req.url === '/v2/licenses/verify') {
    const p = new URLSearchParams(body);
    const l = licenses.get(p.get('license_key'));
    if (!l || l.product_id !== p.get('product_id')) {
      res.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({ success: false, message: 'That license does not exist for the provided product.' }));
      return;
    }
    const { key, ...purchase } = l;
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ success: true, uses: 1, purchase: { sale_id: `sale_${key}`, refunded: false, disputed: false, chargebacked: false, subscription_ended_at: null, subscription_cancelled_at: null, subscription_failed_at: null, ...purchase } }));
    return;
  }
  res.writeHead(404).end();
}).listen(3999);
