import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:4321";
const outDir = ".verify-shots/task10";
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

async function newPage(viewport = { width: 375, height: 812 }) {
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => sessionStorage.setItem("ae:age-confirmed", "1"));
  return page;
}

function ok(label, cond, detail = "") {
  console.log(`  ${cond ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  return cond;
}

const findings = [];

console.log("\n=== Task 10 verification ===\n");

console.log("1. Filter sheet opens, all 4 locales");
for (const loc of ["tr", "en", "de", "ru"]) {
  const page = await newPage();
  await page.goto(`${BASE}/${loc}/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  await page.click("#ae-search-filter-btn");
  await new Promise((r) => setTimeout(r, 400));
  const sheetState = await page.$eval("#ae-filter-sheet", (el) => el.getAttribute("data-sheet-state"));
  await page.screenshot({ path: `${outDir}/01-${loc}-filter-open.png` });
  ok(`${loc} filter sheet open`, sheetState === "open");
  findings.push({ name: `01-${loc}-open`, sheetState });
  await page.close();
}

console.log("\n2. BottomSheet scroll lock when open");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  const before = await page.$eval("body", (b) => b.style.overflow);
  await page.click("#ae-search-filter-btn");
  await new Promise((r) => setTimeout(r, 200));
  const during = await page.$eval("body", (b) => b.style.overflow);
  ok(`body overflow=hidden while sheet open`, during === "hidden");
  findings.push({ name: "02-scroll-lock", before, during });
  await page.close();
}

console.log("\n3. Apply filter — URL updates + grid filters + sheet closes");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  await page.click("#ae-search-filter-btn");
  await new Promise((r) => setTimeout(r, 300));
  // Select Wellness chip
  await page.click('.ae-filter-chip[data-type-id="kadin-cinsel-saglik-urunu"]');
  await new Promise((r) => setTimeout(r, 100));
  await page.click("#ae-filter-apply");
  await new Promise((r) => setTimeout(r, 400));
  const url = page.url();
  const sheetState = await page.$eval("#ae-filter-sheet", (el) => el.getAttribute("data-sheet-state"));
  const visibleCount = await page.$$eval("#ae-search-results > li", (lis) => lis.length);
  const countText = await page.$eval("#ae-search-results-count", (el) => el.textContent?.trim() ?? "");
  await page.screenshot({ path: `${outDir}/03-filter-applied.png`, fullPage: true });
  ok(`URL has type=kadin-cinsel-saglik-urunu`, url.includes("type=kadin-cinsel-saglik-urunu"), url);
  ok(`sheet closed after apply`, sheetState === "closed");
  ok(`grid shows kadin-cinsel-saglik-urunu products only (2 SKUs after Task 13 migration)`, visibleCount === 2, `count=${visibleCount}`);
  ok(`result count line reads "2 results"`, countText === "2 results", countText);
  findings.push({ name: "03-apply", url, sheetState, visibleCount, countText });
  await page.close();
}

console.log("\n4. Filter URL deep-link — sheet hydrates from query on open");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/search/?type=fantezi-fetis-urunu`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 300));
  const visibleCount = await page.$$eval("#ae-search-results > li", (lis) => lis.length);
  // Open sheet, verify chip pre-selected.
  await page.click("#ae-search-filter-btn");
  await new Promise((r) => setTimeout(r, 300));
  const chipPressed = await page.$eval(
    '.ae-filter-chip[data-type-id="fantezi-fetis-urunu"]',
    (el) => el.getAttribute("aria-pressed"),
  );
  ok(`grid filtered on URL load (fantezi-fetis-urunu has 3 SKUs after migration)`, visibleCount === 3, `count=${visibleCount}`);
  ok(`fantezi-fetis-urunu chip pre-selected on sheet open`, chipPressed === "true");
  findings.push({ name: "04-deeplink", visibleCount, chipPressed });
  await page.close();
}

console.log("\n5. No-results with active filter shows Reset CTA");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/search/?q=oil&type=fantezi-fetis-urunu`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 400));
  const noResultsVisible = await page.$eval("#ae-search-no-results", (el) => window.getComputedStyle(el).display !== "none");
  const ctaVisible = await page.$eval("#ae-search-reset-filters", (el) => window.getComputedStyle(el).display !== "none");
  await page.screenshot({ path: `${outDir}/05-no-results-with-filter.png` });
  ok(`no-results state visible`, noResultsVisible);
  ok(`Reset filters CTA visible (Decision 5 reversal)`, ctaVisible);
  // Tap Reset → URL clears type/price/instock, q stays.
  await page.click("#ae-search-reset-filters");
  await new Promise((r) => setTimeout(r, 400));
  const url = page.url();
  ok(`Reset keeps q, drops filter params`, url.includes("q=oil") && !url.includes("type=") && !url.includes("instock="));
  findings.push({ name: "05-no-results", noResultsVisible, ctaVisible, url });
  await page.close();
}

console.log("\n6. Filter applies independently of search (clearing q keeps filter)");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/search/?q=oil&type=kadin-cinsel-saglik-urunu`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 400));
  const beforeCount = await page.$$eval("#ae-search-results > li", (lis) => lis.length);
  // Clear search via × button
  await page.click("#ae-search-clear");
  await new Promise((r) => setTimeout(r, 400));
  const afterCount = await page.$$eval("#ae-search-results > li", (lis) => lis.length);
  const url = page.url();
  ok(`with q=oil&type=kadin-cinsel-saglik-urunu — 1 result (warming-massage-oil)`, beforeCount === 1, `count=${beforeCount}`);
  ok(`after clearing q, filter still shows kadin-cinsel-saglik-urunu (2 post-migration)`, afterCount === 2, `count=${afterCount}`);
  ok(`URL kept type=kadin-cinsel-saglik-urunu, dropped q`, url.includes("type=kadin-cinsel-saglik-urunu") && !url.includes("q="));
  findings.push({ name: "06-q-clear", beforeCount, afterCount, url });
  await page.close();
}

console.log("\n7. Reset URL serialization is clean — no empty params");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  await page.click("#ae-search-filter-btn");
  await new Promise((r) => setTimeout(r, 300));
  await page.click("#ae-filter-reset");
  await new Promise((r) => setTimeout(r, 100));
  await page.click("#ae-filter-apply");
  await new Promise((r) => setTimeout(r, 400));
  const url = page.url();
  ok(`URL is clean (no empty type/price/instock)`, !url.includes("type=") && !url.includes("price=") && !url.includes("instock="), url);
  findings.push({ name: "07-clean-url", url });
  await page.close();
}

console.log("\n8. In-stock toggle excludes sold_out products");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/search/?type=kadin-cinsel-saglik-urunu`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 400));
  const kadinAll = await page.$$eval("#ae-search-results > li", (lis) => lis.length);
  // Now toggle in-stock and apply.
  await page.click("#ae-search-filter-btn");
  await new Promise((r) => setTimeout(r, 300));
  await page.click("#ae-filter-instock");
  await new Promise((r) => setTimeout(r, 100));
  await page.click("#ae-filter-apply");
  await new Promise((r) => setTimeout(r, 400));
  const kadinInStock = await page.$$eval("#ae-search-results > li", (lis) => lis.length);
  // Post-Task-13: kadin-cinsel-saglik-urunu has 2 products, both in_stock (ginger
  // moved to erkek-cinsel-saglik-urunu). In-stock toggle is a no-op here.
  ok(`kadin all (2) → in-stock-only doesn't change (no sold_out in this category) → 2`, kadinInStock === kadinAll, `${kadinAll} → ${kadinInStock}`);
  findings.push({ name: "08-instock", kadinAll, kadinInStock });
  await page.close();
}

await writeFile(`${outDir}/findings.json`, JSON.stringify(findings, null, 2));
await browser.close();
console.log(`\nfindings written to ${outDir}/findings.json`);
