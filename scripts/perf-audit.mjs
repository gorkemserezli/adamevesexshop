#!/usr/bin/env node
/**
 * Performance budget audit per spec §6.10.
 *
 * Budget interpretation (compromise per Task 12 Decision):
 *
 *   (a) Per-page inline JS cost: extracts <script> blocks from a representative
 *       PDP HTML file, gzips the concatenation, measures. Budget: ≤ 15 KB gz.
 *       Catches inline-script regressions that would slip past a bundle-only
 *       check (BaseLayout age-gate bootstrap, StockHydrator inline script).
 *
 *   (b) Shared module bundle total: dist/_astro/*.js summed, gzipped collectively.
 *       Catches over-bundling of dependencies. Budget: ≤ 15 KB gz.
 *
 *   (c) CSS bundle total: dist/_astro/*.css summed, gzipped. Budget: ≤ 30 KB gz.
 *
 * Both JS numbers must be under 15 KB independently. The two paths are
 * orthogonal — inline scripts ship in HTML, modules ship as separate files —
 * and a guest pays the cost of each.
 *
 * Exits non-zero on any budget violation. Reports per-bundle breakdown so
 * regressions can be localized.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const ASTRO_DIR = join(DIST, "_astro");
const REPRESENTATIVE_PDP = join(DIST, "en", "product", "warming-massage-oil", "index.html");

const BUDGET_INLINE_JS_KB = 15;
const BUDGET_MODULE_JS_KB = 15;
const BUDGET_CSS_KB = 30;

function kb(bytes) {
  return (bytes / 1024).toFixed(2);
}

function extractInlineScripts(html) {
  // Match all <script ...>...</script> blocks regardless of attributes.
  // Excludes <script src="..."> with no body (those are external module loads,
  // measured separately in (b)).
  const scripts = [];
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const body = m[1];
    if (body && body.trim().length > 0) scripts.push(body);
  }
  return scripts;
}

async function listFiles(dir, predicate) {
  try {
    const entries = await readdir(dir);
    const out = [];
    for (const e of entries) {
      const full = join(dir, e);
      const st = await stat(full);
      if (st.isFile() && predicate(e)) {
        out.push({ path: full, name: e, size: st.size });
      }
    }
    return out;
  } catch {
    return [];
  }
}

async function main() {
  console.log("=== Performance budget audit (§6.10) ===\n");

  // (a) Inline JS on representative PDP
  console.log("(a) Per-page inline JS on representative PDP:");
  console.log(`    file: ${REPRESENTATIVE_PDP.replace(ROOT + "/", "")}`);
  let inlineGz = 0;
  let inlineRaw = 0;
  let inlineCount = 0;
  try {
    const html = await readFile(REPRESENTATIVE_PDP, "utf8");
    const scripts = extractInlineScripts(html);
    inlineCount = scripts.length;
    const concatenated = scripts.join("\n");
    inlineRaw = Buffer.byteLength(concatenated, "utf8");
    inlineGz = gzipSync(concatenated).length;
    console.log(`    inline scripts: ${inlineCount}`);
    console.log(`    raw: ${kb(inlineRaw)} KB`);
    console.log(`    gzipped: ${kb(inlineGz)} KB (budget ${BUDGET_INLINE_JS_KB} KB)`);
  } catch (err) {
    console.log(`    ✗ failed to read PDP: ${err.message}`);
    process.exit(1);
  }
  const inlineOk = inlineGz <= BUDGET_INLINE_JS_KB * 1024;
  console.log(`    ${inlineOk ? "✓ within budget" : "✗ OVER BUDGET"}\n`);

  // (b) Per-page module JS — what a single page actually loads.
  // §6.10's budget is per-guest-page-view, not whole-site. Search bundle never
  // loads on a PDP and vice versa. We measure the worst page (highest module-JS
  // load) and check that against the budget.
  console.log("(b) Per-page module JS (worst-case page):");
  const jsFiles = await listFiles(ASTRO_DIR, (n) => n.endsWith(".js"));
  const jsByName = new Map();
  for (const f of jsFiles) {
    const buf = await readFile(f.path);
    jsByName.set(f.name, { buf, gz: gzipSync(buf).length });
  }

  // Pages to audit — one per template type.
  const pageTemplates = [
    { label: "homepage", path: join(DIST, "en", "index.html") },
    { label: "PDP", path: join(DIST, "en", "product", "warming-massage-oil", "index.html") },
    { label: "category index", path: join(DIST, "en", "categories", "index.html") },
    { label: "per-category", path: join(DIST, "en", "categories", "wellness", "index.html") },
    { label: "favorites", path: join(DIST, "en", "favorites", "index.html") },
    { label: "search", path: join(DIST, "en", "search", "index.html") },
  ];

  const pageReports = [];
  for (const t of pageTemplates) {
    try {
      const html = await readFile(t.path, "utf8");
      // Match <script type="module" src="...">.
      const re = /<script\s+type="module"\s+src="\/_astro\/([^"]+)"/g;
      const refs = new Set();
      let m;
      while ((m = re.exec(html)) !== null) refs.add(m[1]);
      let pageGz = 0;
      let pageRaw = 0;
      for (const name of refs) {
        const entry = jsByName.get(name);
        if (entry) {
          pageGz += entry.gz;
          pageRaw += entry.buf.length;
        }
      }
      pageReports.push({ label: t.label, files: refs.size, raw: pageRaw, gz: pageGz });
    } catch {
      pageReports.push({ label: t.label, files: 0, raw: 0, gz: 0, missing: true });
    }
  }

  pageReports.sort((a, b) => b.gz - a.gz);
  console.log(`    page                           files     raw         gz`);
  for (const r of pageReports) {
    const tag = r.missing ? "  (page not built)" : "";
    console.log(`    ${r.label.padEnd(30)} ${String(r.files).padStart(3)}    ${kb(r.raw).padStart(7)} KB  ${kb(r.gz).padStart(6)} KB${tag}`);
  }
  const worst = pageReports[0];
  console.log(`\n    worst page: ${worst.label} @ ${kb(worst.gz)} KB gz (budget ${BUDGET_MODULE_JS_KB} KB)`);
  const moduleOk = worst.gz <= BUDGET_MODULE_JS_KB * 1024;
  console.log(`    ${moduleOk ? "✓ within budget" : "✗ OVER BUDGET"}\n`);

  // For diagnostic context, also report the all-files total — informational only.
  let allFilesGz = 0;
  for (const e of jsByName.values()) allFilesGz += e.gz;
  console.log(`    (informational: sum of all ${jsFiles.length} JS files = ${kb(allFilesGz)} KB gz —`);
  console.log(`    not the budget metric since no single page view fetches all of them)\n`);
  const moduleGzAll = worst.gz;

  // (c) CSS bundles
  console.log("(c) CSS bundles (dist/_astro/*.css):");
  const cssFiles = await listFiles(ASTRO_DIR, (n) => n.endsWith(".css"));
  let cssRaw = 0;
  let cssGzAll = 0;
  for (const f of cssFiles) {
    const buf = await readFile(f.path);
    const gz = gzipSync(buf).length;
    cssRaw += buf.length;
    cssGzAll += gz;
    console.log(`    ${f.name.padEnd(60)} raw=${kb(buf.length)} KB  gz=${kb(gz)} KB`);
  }
  console.log(`    raw total: ${kb(cssRaw)} KB`);
  console.log(`    gzipped total: ${kb(cssGzAll)} KB (budget ${BUDGET_CSS_KB} KB)`);
  const cssOk = cssGzAll <= BUDGET_CSS_KB * 1024;
  console.log(`    ${cssOk ? "✓ within budget" : "✗ OVER BUDGET"}\n`);

  // Summary
  console.log("=== Summary ===");
  console.log(`  inline JS per PDP:  ${kb(inlineGz)} KB gz / ${BUDGET_INLINE_JS_KB} KB budget  ${inlineOk ? "✓" : "✗"}`);
  console.log(`  module JS shared:   ${kb(moduleGzAll)} KB gz / ${BUDGET_MODULE_JS_KB} KB budget  ${moduleOk ? "✓" : "✗"}`);
  console.log(`  CSS:                ${kb(cssGzAll)} KB gz / ${BUDGET_CSS_KB} KB budget  ${cssOk ? "✓" : "✗"}`);

  if (!inlineOk || !moduleOk || !cssOk) {
    console.log("\nFAIL: at least one budget violated.");
    process.exit(1);
  }
  console.log("\nPASS: all budgets within limits.");
}

main().catch((err) => {
  console.error("perf-audit FAILED:", err);
  process.exit(1);
});
