import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist/procode/browser');
const port = Number(process.env.PORT || 4200);
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
  '.ico': 'image/x-icon',
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(root, '.' + pathname);
    if (!file.startsWith(root + sep) && file !== root) {
      res.writeHead(403);
      return res.end();
    }
    if (!extname(file)) file = resolve(root, 'index.html');
    if (!(await stat(file)).isFile()) {
      res.writeHead(404);
      return res.end();
    }
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': pathname.startsWith('/runtime/pyodide/')
        ? 'public, max-age=3600'
        : 'no-cache',
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () =>
  console.log(`ProCode production preview: http://127.0.0.1:${port}`),
);
