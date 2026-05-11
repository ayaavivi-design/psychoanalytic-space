const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const PORT = 3001;

function readBody(req) {
  return new Promise((res, rej) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => res(Buffer.concat(chunks)));
    req.on('error', rej);
  });
}

function proxyJson(method, url, headers, body) {
  return new Promise((res, rej) => {
    const u = new URL(url);
    const opts = { hostname: u.hostname, port: 443, path: u.pathname + u.search, method, headers: { ...headers, host: u.hostname } };
    const req = https.request(opts, r => {
      const chunks = [];
      r.on('data', c => chunks.push(c));
      r.on('end', () => res({ status: r.statusCode, body: Buffer.concat(chunks), headers: r.headers }));
    });
    req.on('error', rej);
    if (body) req.write(body);
    req.end();
  });
}

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

const server = http.createServer(async (req, res) => {
  corsHeaders(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const u = new URL(req.url, 'http://localhost:' + PORT);

  if (u.pathname === '/' || u.pathname === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html); return;
  }

  if (u.pathname === '/api/upload-url' && req.method === 'POST') {
    const body = await readBody(req);
    const { filename, content_type, apiKey } = JSON.parse(body);
    const r = await proxyJson('POST', 'https://api.higgsfield.ai/v1/media/upload-url',
      { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      JSON.stringify({ filename, content_type }));
    res.writeHead(r.status, { 'Content-Type': 'application/json' });
    res.end(r.body); return;
  }

  if (u.pathname === '/api/upload-file' && req.method === 'PUT') {
    const uploadUrl = decodeURIComponent(u.searchParams.get('url'));
    const contentType = u.searchParams.get('ct') || 'image/jpeg';
    const body = await readBody(req);
    const r = await proxyJson('PUT', uploadUrl, { 'Content-Type': contentType, 'Content-Length': body.length }, body);
    res.writeHead(r.status); res.end(r.body); return;
  }

  if (u.pathname === '/api/confirm' && req.method === 'POST') {
    const body = await readBody(req);
    const { media_id, type, apiKey } = JSON.parse(body);
    const r = await proxyJson('POST', 'https://api.higgsfield.ai/v1/media/confirm',
      { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      JSON.stringify({ media_id, type }));
    res.writeHead(r.status, { 'Content-Type': 'application/json' });
    res.end(r.body); return;
  }

  if (u.pathname === '/api/generate' && req.method === 'POST') {
    const body = await readBody(req);
    const { apiKey, ...payload } = JSON.parse(body);
    const r = await proxyJson('POST', 'https://api.higgsfield.ai/v1/generations',
      { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      JSON.stringify(payload));
    res.writeHead(r.status, { 'Content-Type': 'application/json' });
    res.end(r.body); return;
  }

  if (u.pathname.startsWith('/api/status/') && req.method === 'GET') {
    const id = u.pathname.split('/api/status/')[1];
    const apiKey = u.searchParams.get('apiKey');
    const r = await proxyJson('GET', 'https://api.higgsfield.ai/v1/generations/' + id,
      { 'Authorization': 'Bearer ' + apiKey });
    res.writeHead(r.status, { 'Content-Type': 'application/json' });
    res.end(r.body); return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => console.log('\n✦ AI Video Creator running at http://localhost:' + PORT + '\n'));
