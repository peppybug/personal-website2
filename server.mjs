// Minimal zero-dependency static server for local preview.
// Usage: npm run dev  (PORT=8080 npm run dev to change the port)
//        node server.mjs _site            serve the built site
//        BASE=/my-repo node server.mjs _site   mimic a GitHub project page URL
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = resolve(fileURLToPath(new URL('.', import.meta.url)));
const root = resolve(here, process.argv[2] || '.');
const base = (process.env.BASE || '').replace(/\/$/, '');
const port = Number(process.env.PORT) || 5173;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (base) {
      if (path === base) { res.writeHead(301, { Location: base + '/' }); return res.end(); }
      if (!path.startsWith(base + '/')) throw 404;
      path = path.slice(base.length);
    }
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(root, path));
    if (!file.startsWith(root) || /[\\/](node_modules|\.git)[\\/]/.test(file)) throw 403;
    const info = await stat(file);
    if (!info.isFile()) throw 404;
    res.writeHead(200, { 'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch (err) {
    const code = err === 403 ? 403 : 404;
    res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(code === 403 ? 'Forbidden' : 'Not found');
  }
}).listen(port, () => console.log(`Portfolio running at http://localhost:${port}${base}/`));
