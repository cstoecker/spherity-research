import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";

const port = Number(process.argv[2] || 4173);
const siteDirectory = path.resolve("_site");
const basePath = "/spherity-research";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  if (url.pathname === "/") {
    response.writeHead(302, { Location: `${basePath}/` });
    response.end();
    return;
  }

  if (!url.pathname.startsWith(basePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  let relativePath = decodeURIComponent(url.pathname.slice(basePath.length)).replace(/^\/+/, "");
  if (!relativePath || relativePath.endsWith("/")) relativePath += "index.html";

  const target = path.resolve(siteDirectory, relativePath);
  if (!target.startsWith(siteDirectory)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    await access(target);
    const metadata = await stat(target);
    if (!metadata.isFile()) throw new Error("Not a file");
  } catch {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentTypes[path.extname(target).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(target).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview: http://127.0.0.1:${port}${basePath}/`);
});
