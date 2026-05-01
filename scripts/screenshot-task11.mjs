import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:4321";
const outDir = ".verify-shots/task11";
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

async function newPage() {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => sessionStorage.setItem("ae:age-confirmed", "1"));
  return page;
}

function ok(label, cond, detail = "") {
  console.log(`  ${cond ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  return cond;
}

const findings = [];

console.log("\n=== Task 11 verification ===\n");

console.log("1. Categories index — 4 locales");
for (const loc of ["tr", "en", "de", "ru"]) {
  const page = await newPage();
  await page.goto(`${BASE}/${loc}/categories/`, { waitUntil: "networkidle0", timeout: 15000 });
  const rowCount = await page.$$eval(".ae-cat-row", (rows) => rows.length);
  await page.screenshot({ path: `${outDir}/01-${loc}-cat-index.png` });
  ok(`${loc} categories index — 8 rows post-Task-13`, rowCount === 8, `count=${rowCount}`);
  findings.push({ name: `01-${loc}-index`, rowCount });
  await page.close();
}

console.log("\n2. Per-category populated (with description)");
{
  // kadin-cinsel-saglik-urunu has products + description
  const page = await newPage();
  await page.goto(`${BASE}/en/categories/kadin-cinsel-saglik-urunu/`, { waitUntil: "networkidle0", timeout: 15000 });
  const breadcrumbText = await page.$eval(".ae-breadcrumb, nav[aria-label]", (el) => el.textContent?.trim() ?? "").catch(() => "");
  const productCount = await page.$$eval(".ae-cat-product", (lis) => lis.length);
  await page.screenshot({ path: `${outDir}/02-en-kadin-cinsel-saglik-urunu-populated.png`, fullPage: true });
  ok(`breadcrumb shows Categories > Kadın Cinsel Sağlık Ürünü`, breadcrumbText.includes("Categories") && breadcrumbText.includes("Kadın"), breadcrumbText);
  ok(`grid populated with kadin-cinsel-saglik-urunu products (2 post-Task-13)`, productCount === 2, `count=${productCount}`);
  findings.push({ name: "02-kadin-cinsel-saglik-urunu", breadcrumbText, productCount });
  await page.close();
}

console.log("\n3. Per-category without description — spacing assertion");
{
  // Find a category without description in the source data; sample data has none with description set,
  // so any category page exercises the no-description path. Pick fantezi-fetis-urunu.
  const page = await newPage();
  await page.goto(`${BASE}/en/categories/fantezi-fetis-urunu/`, { waitUntil: "networkidle0", timeout: 15000 });
  // The header section should still render with at least 32px padding-top (pt-ae-7 = 32px from spec).
  const headerExists = await page.$("section.pt-ae-7");
  const productCount = await page.$$eval(".ae-cat-product", (lis) => lis.length);
  await page.screenshot({ path: `${outDir}/03-en-fantezi-fetis-urunu-no-description.png`, fullPage: true });
  ok(`header section renders without description`, headerExists !== null);
  ok(`grid populated (3 post-Task-13)`, productCount === 3, `count=${productCount}`);
  findings.push({ name: "03-fantezi-fetis-urunu", productCount });
  await page.close();
}

console.log("\n4. Per-category filter — Type fieldset is hidden");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/categories/kadin-cinsel-saglik-urunu/`, { waitUntil: "networkidle0", timeout: 15000 });
  await page.click("#ae-cat-filter-btn");
  await new Promise((r) => setTimeout(r, 400));
  const sheetState = await page.$eval("#ae-filter-sheet", (el) => el.getAttribute("data-sheet-state"));
  // Type fieldset chip count: should be zero on per-category page.
  // Narrow to FilterSheet's Type chips (data-type-id); SubcategoryChips also
  // uses .ae-filter-chip class but with data-subcat-id, so must disambiguate.
  const typeChips = await page.$$eval("#ae-filter-sheet .ae-filter-chip[data-type-id]", (els) => els.length);
  await page.screenshot({ path: `${outDir}/04-cat-filter-no-type.png` });
  ok(`filter sheet open`, sheetState === "open");
  ok(`Type chips are absent (showTypeFilter=false)`, typeChips === 0, `chips=${typeChips}`);
  findings.push({ name: "04-no-type-chips", sheetState, typeChips });
  await page.close();
}

console.log("\n5. Per-category in-stock filter applies to grid");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/categories/kadin-cinsel-saglik-urunu/`, { waitUntil: "networkidle0", timeout: 15000 });
  const before = await page.$$eval(".ae-cat-product", (lis) =>
    lis.filter((l) => window.getComputedStyle(l).display !== "none").length,
  );
  await page.click("#ae-cat-filter-btn");
  await new Promise((r) => setTimeout(r, 300));
  await page.click("#ae-filter-instock");
  await new Promise((r) => setTimeout(r, 100));
  await page.click("#ae-filter-apply");
  await new Promise((r) => setTimeout(r, 400));
  const after = await page.$$eval(".ae-cat-product", (lis) =>
    lis.filter((l) => window.getComputedStyle(l).display !== "none").length,
  );
  // Post-Task-13: kadin has 2 products, both in_stock (ginger moved categories).
  ok(`kadin 2 → in-stock-only no-op (no sold_out) → 2`, before === 2 && after === 2, `${before} → ${after}`);
  findings.push({ name: "05-instock", before, after });
  await page.close();
}

console.log("\n6. Routing refactor — bottom-nav, favorites empty CTA, CategoryRow chevron, homepage CTA");
{
  const page = await newPage();
  // (a) Bottom-nav Categories
  await page.goto(`${BASE}/en/`, { waitUntil: "networkidle0", timeout: 15000 });
  const bottomNavCatHref = await page.$$eval(".ae-bottom-nav a", (as) => {
    for (const a of as) {
      if (a.getAttribute("href") === "/en/categories/") return "/en/categories/";
    }
    return "";
  });
  ok(`bottom-nav Categories slot routes to /en/categories/`, bottomNavCatHref === "/en/categories/");

  // (b) Homepage CTA
  const homeCtaHref = await page.$eval(".ae-home-cta", (a) => a.getAttribute("href"));
  ok(`homepage CTA routes to /en/categories/`, homeCtaHref === "/en/categories/");
  await page.screenshot({ path: `${outDir}/06-homepage.png`, fullPage: true });

  // (c) CategoryRow chevron on the index
  await page.goto(`${BASE}/en/categories/`, { waitUntil: "networkidle0", timeout: 15000 });
  const categoryRowHref = await page.$$eval(".ae-cat-row", (rows) => {
    for (const a of rows) {
      const h = a.getAttribute("href") ?? "";
      if (h.endsWith("/kadin-cinsel-saglik-urunu/")) return h;
    }
    return "";
  });
  ok(`CategoryRow chevron routes to /en/categories/kadin-cinsel-saglik-urunu/`, categoryRowHref === "/en/categories/kadin-cinsel-saglik-urunu/");

  // (d) Favorites empty CTA
  await page.goto(`${BASE}/en/favorites/`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 200));
  const favEmptyCtaHref = await page.$eval(".ae-empty-cta", (a) => a.getAttribute("href"));
  ok(`favorites empty CTA routes to /en/categories/`, favEmptyCtaHref === "/en/categories/");

  findings.push({ name: "06-routing", bottomNavCatHref, homeCtaHref, categoryRowHref, favEmptyCtaHref });
  await page.close();
}

console.log("\n7. Locale isolation on per-category page");
{
  const page = await newPage();
  await page.goto(`${BASE}/ru/categories/kadin-cinsel-saglik-urunu/`, { waitUntil: "networkidle0", timeout: 15000 });
  const breadcrumbText = await page.evaluate(() => document.body.textContent ?? "");
  ok(`RU breadcrumb shows Russian "Категории"`, breadcrumbText.includes("Категории"));
  ok(`RU header shows category name (Kadın Cinsel Sağlık Ürünü TR placeholder)`, breadcrumbText.includes("Kadın"));
  await page.screenshot({ path: `${outDir}/07-ru-kadin-cinsel-saglik-urunu.png`, fullPage: true });
  findings.push({ name: "07-locale-ru" });
  await page.close();
}

console.log("\n8. Homepage no longer shows the category list");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/`, { waitUntil: "networkidle0", timeout: 15000 });
  const catRows = await page.$$eval(".ae-cat-row", (rows) => rows.length);
  ok(`homepage has zero CategoryRows`, catRows === 0, `count=${catRows}`);
  findings.push({ name: "08-homepage-no-cats", catRows });
  await page.close();
}

await writeFile(`${outDir}/findings.json`, JSON.stringify(findings, null, 2));
await browser.close();
console.log(`\nfindings written to ${outDir}/findings.json`);
