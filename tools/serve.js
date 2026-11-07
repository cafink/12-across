// A small static file server for local development.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

export function createStaticServer(root) {
  const base = resolve(root);

  return createServer(async (req, res) => {
    let path;
    try {
      path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      return send(res, 400, 'Bad request');
    }
    if (path.endsWith('/')) path += 'index.html';

    const file = resolve(base, `.${path}`);
    if (!file.startsWith(base + sep)) return send(res, 404, 'Not found');

    try {
      const body = await readFile(file);
      const type = CONTENT_TYPES[extname(file)] ?? 'application/octet-stream';
      send(res, 200, body, type);
    } catch {
      send(res, 404, 'Not found');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../site', import.meta.url));
  createStaticServer(root).listen(8000, () => {
    console.log('Serving site/ on port 8000');
  });
}
