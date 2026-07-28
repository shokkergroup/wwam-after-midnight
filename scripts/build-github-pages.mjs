import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(projectRoot, "public", "demo");
const outputDir = path.join(projectRoot, "_site");
const wikiDir = path.join(outputDir, "wiki");
const publicImage = path.join(projectRoot, "public", "og.png");
const pagesBase = String(
  process.env.WWAM_PAGES_BASE || "https://shokkergroup.github.io/wwam-after-midnight/"
).replace(/\/?$/, "/");

for (const required of [
  path.join(sourceDir, "index.html"),
  path.join(sourceDir, "app.js"),
  path.join(sourceDir, "media-bridge.html"),
  publicImage,
]) {
  if (!fs.existsSync(required)) {
    throw new Error(`Missing GitHub Pages release input: ${path.relative(projectRoot, required)}`);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(wikiDir, { recursive: true });
fs.cpSync(sourceDir, wikiDir, { recursive: true });
fs.copyFileSync(publicImage, path.join(outputDir, "og.png"));
fs.writeFileSync(path.join(outputDir, ".nojekyll"), "", "utf8");

const canonicalUrl = `${pagesBase}wiki/index.html`;
const socialImageUrl = `${pagesBase}og.png`;
const wikiIndexPath = path.join(wikiDir, "index.html");
let wikiIndex = fs.readFileSync(wikiIndexPath, "utf8");
wikiIndex = wikiIndex
  .replace(
    "  <meta property=\"og:title\"",
    `  <link rel="canonical" href="${canonicalUrl}">\n  <meta property="og:url" content="${canonicalUrl}">\n  <meta property="og:title"`,
  )
  .replace('<meta property="og:image" content="/og.png">', `<meta property="og:image" content="${socialImageUrl}">`)
  .replace('<meta name="twitter:image" content="/og.png">', `<meta name="twitter:image" content="${socialImageUrl}">`);
fs.writeFileSync(wikiIndexPath, wikiIndex, "utf8");

const redirect = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="0; url=./wiki/index.html">
  <link rel="canonical" href="${canonicalUrl}">
  <title>WWAM After Midnight — The Living Archive</title>
</head>
<body>
  <p><a href="./wiki/index.html">Open WWAM After Midnight — The Living Archive</a></p>
  <script>location.replace("./wiki/index.html" + location.search + location.hash);</script>
</body>
</html>
`;
fs.writeFileSync(path.join(outputDir, "index.html"), redirect, "utf8");

const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else files.push(absolute);
  }
};
walk(outputDir);
const bytes = files.reduce((total, file) => total + fs.statSync(file).size, 0);
console.log(`GitHub Pages bundle ready: ${files.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MiB`);
console.log(`Public entry: ${canonicalUrl}`);