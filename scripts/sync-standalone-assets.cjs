/**
 * Next.js `output: "standalone"` traces server code into `.next/standalone` but does not
 * copy `.next/static` or `public`. Serving without this step yields HTML that references
 * chunk URLs which404 on the origin (and in the browser).
 *
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/output
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standaloneRoot = path.join(root, ".next", "standalone");

if (!fs.existsSync(standaloneRoot)) {
  console.log("[sync-standalone] No .next/standalone — skip (not a standalone build).");
  process.exit(0);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error("[sync-standalone] Missing source:", src);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log("[sync-standalone]", path.relative(root, src), "→", path.relative(root, dest));
}

const standaloneNext = path.join(standaloneRoot, ".next");
fs.mkdirSync(standaloneNext, { recursive: true });
copyDir(path.join(root, ".next", "static"), path.join(standaloneNext, "static"));
copyDir(path.join(root, "public"), path.join(standaloneRoot, "public"));
