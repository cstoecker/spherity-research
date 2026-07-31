import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const projectDirectory = process.cwd();
const buildDirectory = path.join(projectDirectory, "dist");
const staticDirectory = path.join(buildDirectory, "client", "spherity-research");
const serverDirectory = path.join(buildDirectory, "server");

await rm(buildDirectory, { recursive: true, force: true });
await mkdir(staticDirectory, { recursive: true });
await mkdir(serverDirectory, { recursive: true });
await cp(path.join(projectDirectory, "_site"), staticDirectory, { recursive: true });

const worker = `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      url.pathname = "/spherity-research/";
      return Response.redirect(url.toString(), 302);
    }
    return env.ASSETS.fetch(request);
  }
};
`;

await writeFile(path.join(serverDirectory, "index.js"), worker, "utf8");
console.log("Prepared the verified static preview for Sites.");
