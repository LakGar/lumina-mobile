/**
 * Reads lexical-editor/dist/index.html and writes constants/lexical-editor-html.ts
 * so the app can use source={{ html: LEXICAL_EDITOR_HTML }}.
 * Run after: cd lexical-editor && npm run build
 */
const fs = require("fs");
const path = require("path");

const distPath = path.join(
  __dirname,
  "..",
  "lexical-editor",
  "dist",
  "index.html",
);
const outPath = path.join(
  __dirname,
  "..",
  "constants",
  "lexical-editor-html.ts",
);

if (!fs.existsSync(distPath)) {
  console.error("Run: cd lexical-editor && npm run build");
  process.exit(1);
}

let html = fs.readFileSync(distPath, "utf8");
// So WebView runs the script without requiring module support
html = html.replace(/\s*type="module"\s*/g, " ");

// Escape for template literal: ` \ ${
const escaped = html
  .replace(/\\/g, "\\\\")
  .replace(/`/g, "\\`")
  .replace(/\$\{/g, "\\${");

const content = `/**
 * Lexical rich-text editor — built from lexical-editor/ and embedded for WebView.
 * Regenerate with: cd lexical-editor && npm run build && node scripts/embed-lexical-editor.js
 */
export const LEXICAL_EDITOR_HTML = \`${escaped}\`;
`;

fs.writeFileSync(outPath, content, "utf8");
console.log("Wrote", outPath);
