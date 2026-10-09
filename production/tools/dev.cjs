'use strict';
// Local preview of the actual production frontend. API requests go to the local backend.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../public');
const target = new URL(process.env.BACKEND_URL || 'http://127.0.0.1:3100');
if (target.protocol !== 'http:') throw new Error('Local BACKEND_URL must use http:');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/internal/')) {
    const proxy = http.request({ hostname: target.hostname, port: target.port || 80, path: req.url, method: req.method, headers: req.headers }, upstream => { res.writeHead(upstream.statusCode, upstream.headers); upstream.pipe(res); });
    proxy.on('error', () => { if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' }); res.end('Local backend is not running'); });
    req.pipe(proxy); return;
  }
  let name;
  try { name = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.replace(/^\/app\//, '')); } catch { res.writeHead(400); return res.end(); }
  const file = path.resolve(root, '.' + path.sep + name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT || 5173), '127.0.0.1', () => console.log('Production frontend preview: http://127.0.0.1:' + (process.env.PORT || 5173)));
