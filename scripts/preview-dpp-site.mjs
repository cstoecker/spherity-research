import { createPreviewServer } from '../dpp-explorer/scripts/serve.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = parse(await readFile(path.join(root, 'docs/_config.yml'), 'utf8'));
const base = config.baseurl.replace(/\/$/, '');
const port = Number(process.env.DPP_PREVIEW_PORT || 4184);
const server = await createPreviewServer({ root: path.join(root, '_site') });
const serve = server.listeners('request')[0];
server.removeAllListeners('request');
server.on('request', (request, response) => {
  response.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (request.url === '/' || request.url === base) {
    response.writeHead(302, { Location: `${base}/global-digital-product-passport-regulation.html` });
    response.end();
    return;
  }
  if (!request.url.startsWith(`${base}/`)) {
    response.writeHead(404); response.end('Preview uses the repository base path.'); return;
  }
  request.url = request.url.slice(base.length);
  const writeHead = response.writeHead.bind(response);
  response.writeHead = (status, headers) => {
    if (headers?.Location?.startsWith('/')) headers.Location = base + headers.Location;
    return writeHead(status, headers);
  };
  serve(request, response);
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}${base}/global-digital-product-passport-regulation.html`));
