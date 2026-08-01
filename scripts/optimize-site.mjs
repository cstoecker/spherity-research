import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";
import { minify } from "html-minifier-terser";
import { transform } from "lightningcss";

const getArgument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};

const siteDirectory = path.resolve(getArgument("--site-dir", "_site"));
const htmlFiles = await glob("**/*.html", {
  cwd: siteDirectory,
  nodir: true,
  windowsPathsNoEscape: true
});
const cssFiles = await glob("**/*.css", {
  cwd: siteDirectory,
  nodir: true,
  windowsPathsNoEscape: true
});

let originalBytes = 0;
let optimizedBytes = 0;

for (const file of htmlFiles) {
  const target = path.join(siteDirectory, file);
  const source = await readFile(target, "utf8");
  const output = await minify(source, {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    decodeEntities: true,
    keepClosingSlash: true,
    minifyCSS: true,
    minifyJS: false,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortAttributes: false,
    sortClassName: false
  });
  originalBytes += Buffer.byteLength(source);
  optimizedBytes += Buffer.byteLength(output);
  await writeFile(target, output, "utf8");
}

for (const file of cssFiles) {
  const target = path.join(siteDirectory, file);
  const source = await readFile(target);
  const output = transform({
    filename: file,
    code: source,
    minify: true,
    sourceMap: false
  }).code;
  originalBytes += source.byteLength;
  optimizedBytes += output.byteLength;
  await writeFile(target, output);
}

const savedBytes = Math.max(0, originalBytes - optimizedBytes);
const percentage = originalBytes ? ((savedBytes / originalBytes) * 100).toFixed(1) : "0.0";
console.log(
  `Optimized ${htmlFiles.length} HTML and ${cssFiles.length} CSS files; saved ${Math.ceil(savedBytes / 1024)} KB (${percentage}%).`
);

for (const file of [...htmlFiles, ...cssFiles]) {
  await stat(path.join(siteDirectory, file));
}
