import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const defaultRoot = path.join(projectRoot, 'dist');
export const MIME = Object.freeze({ '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.geojson': 'application/geo+json; charset=utf-8', '.jsonld': 'application/ld+json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.sha256': 'text/plain; charset=utf-8', '.pdf': 'application/pdf' });

export function resolveRequestPath(root, requestTarget) {
  let pathname;
  try { pathname = decodeURIComponent(String(requestTarget || '/').split('?')[0]); }
  catch { throw Object.assign(new Error('Malformed request path.'), { status: 400 }); }
  if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('\0') || pathname.includes('\\') || pathname.includes(':') || pathname.split('/').includes('..')) {
    throw Object.assign(new Error('Invalid request path.'), { status: 400 });
  }
  const target = path.resolve(root, `.${pathname}`);
  const relative = path.relative(root, target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw Object.assign(new Error('Path is outside the preview.'), { status: 403 });
  }
  return target;
}

const inside = (root, target) => {
  const relative = path.relative(root, target);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};

export async function createPreviewServer({ root = defaultRoot } = {}) {
  const realRoot = await fs.realpath(root);
  return http.createServer(async (request, response) => {
    const sendError = (status, message) => {
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      response.end(request.method === 'HEAD' ? undefined : message);
    };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      sendError(405, 'Method not allowed.');
      return;
    }
    try {
      let filename = resolveRequestPath(realRoot, request.url);
      let realFile = await fs.realpath(filename);
      if (!inside(realRoot, realFile)) return sendError(403, 'Path is outside the preview.');
      if ((await fs.stat(realFile)).isDirectory()) {
        if (!String(request.url).split('?')[0].endsWith('/')) {
          const separator = String(request.url).indexOf('?');
          const pathname = separator < 0 ? request.url : request.url.slice(0, separator);
          const search = separator < 0 ? '' : request.url.slice(separator);
          response.writeHead(302, { Location: `${pathname}/${search}`, 'Cache-Control': 'no-store' });
          response.end();
          return;
        }
        filename = path.join(realFile, 'index.html');
        realFile = await fs.realpath(filename);
        if (!inside(realRoot, realFile)) return sendError(403, 'Path is outside the preview.');
      }
      const stat = await fs.stat(realFile);
      if (!stat.isFile()) return sendError(404, 'Not found.');
      const content = request.method === 'HEAD' ? undefined : await fs.readFile(realFile);
      response.writeHead(200, { 'Content-Type': MIME[path.extname(realFile).toLowerCase()] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      response.end(content);
    } catch (error) {
      sendError(error.status || (['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500), error.status ? error.message : ['ENOENT', 'ENOTDIR'].includes(error.code) ? 'Not found.' : 'Preview read failed.');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const port = args.length === 0 ? 4173 : args.length === 2 && args[0] === '--port' ? Number(args[1]) : NaN;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Usage: node scripts/serve.mjs [--port 4173]');
    process.exitCode = 1;
  } else {
    try {
      const server = await createPreviewServer();
      server.on('error', error => { console.error(`Preview failed: ${error.message}`); process.exitCode = 1; });
      server.listen(port, '127.0.0.1', () => console.log(`DPP Atlas preview: http://127.0.0.1:${port}/`));
    } catch (error) {
      console.error(`Preview unavailable: ${error.message}. Run the build first.`);
      process.exitCode = 1;
    }
  }
}
