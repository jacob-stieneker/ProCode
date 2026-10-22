const { readFile } = require('node:fs/promises');
const path = require('node:path');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.py': 'text/plain; charset=utf-8',
};

async function serveAsset(root, request) {
  try {
    const url = new URL(request.url);
    if (url.protocol !== 'procode:' || url.host !== 'app' || url.username || url.password)
      return new Response('Not found', { status: 404 });
    if (!['GET', 'HEAD'].includes(request.method))
      return new Response('Method not allowed', { status: 405 });
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(path.resolve(root) + path.sep) || pathname.includes('\0'))
      return new Response('Forbidden', { status: 403 });
    const data = await readFile(file);
    return new Response(request.method === 'HEAD' ? null : data, {
      headers: {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

module.exports = { serveAsset };
