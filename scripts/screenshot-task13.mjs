import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:4321";
const outDir = ".verify-shots/task13";
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

console.log("\n=== Task 13 verification ===\n");

console.log("1. Chip row renders on per-category page (fantezi-fetis-urunu has 4 subcategories)");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/categories/fantezi-fetis-urunu/`, { waitUntil: "networkidle0", timeout: 15000 });
  const chipsExist = await page.$("[data-subcat-chips]").then((h) => h !== null);
  const chipCount = await page.$$eval(".ae-filter-chip", (els) => els.length);
  const allChipPressed = await page.$eval(".ae-subcat-chip-all", (el) => el.getAttribute("aria-pressed"));
  await page.screenshot({ path: `${outDir}/01-chips-row.png` });
  ok("subcategory chip row visible", chipsExist);
  ok(`5 chips total (Tümü + 4 subcategories)`, chipCount === 5, `count=${chipCount}`);
  ok("Tümü chip starts aria-pressed=true", allChipPressed === "true");
  findings.push({ name: "01-chips", chipCount, allChipPressed });
  await page.close();
}

console.log("\n2. Chip click filters grid + URL syncs");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/categories/fantezi-fetis-urunu/`, { waitUntil: "networkidle0", timeout: 15000 });
  const beforeCount = await page.$$eval(".ae-cat-product", (lis) =>
    lis.filter((l) => window.getComputedStyle(l).display !== "none").length,
  );
  await page.click('.ae-subcat-chip[data-subcat-id="giyilebilir-urun"]');
  await new Promise((r) => setTimeout(r, 300));
  const afterCount = await page.$$eval(".ae-cat-product", (lis) =>
    lis.filter((l) => window.getComputedStyle(l).display !== "none").length,
  );
  const url = page.url();
  ok(`fantezi-fetis-urunu has 3 products before filter`, beforeCount === 3, `count=${beforeCount}`);
  ok(`giyilebilir-urun filter shows 2 (silk-tie-set + leather-blindfold)`, afterCount === 2, `count=${afterCount}`);
  ok(`URL has ?sub=giyilebilir-urun`, url.includes("sub=giyilebilir-urun"));
  await page.screenshot({ path: `${outDir}/02-filtered.png`, fullPage: true });
  findings.push({ name: "02-click", beforeCount, afterCount, url });
  await page.close();
}

console.log("\n3. Tümü click restores grid + drops ?sub=");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/categories/fantezi-fetis-urunu/?sub=giyilebilir-urun`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 300));
  await page.click(".ae-subcat-chip-all");
  await new Promise((r) => setTimeout(r, 300));
  const restoredCount = await page.$$eval(".ae-cat-product", (lis) =>
    lis.filter((l) => window.getComputedStyle(l).display !== "none").length,
  );
  const url = page.url();
  ok(`Tümü restores all 3 products`, restoredCount === 3, `count=${restoredCount}`);
  ok(`URL has no ?sub=`, !url.includes("sub="));
  findings.push({ name: "03-tumu", restoredCount, url });
  await page.close();
}

console.log("\n4. Tümü no-op short-circuit when already pressed");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/categories/fantezi-fetis-urunu/`, { waitUntil: "networkidle0", timeout: 15000 });
  // Click Tümü (already pressed) — should not change URL or trigger event.
  let eventCount = 0;
  await page.exposeFunction("__bumpSubcatEvent", () => { eventCount += 1; });
  await page.evaluate(() => {
    window.addEventListener("ae:subcat-change", () => (window).__bumpSubcatEvent());
  });
  const urlBefore = page.url();
  await page.click(".ae-subcat-chip-all");
  await new Promise((r) => setTimeout(r, 200));
  const urlAfter = page.url();
  ok(`URL unchanged on Tümü no-op click`, urlBefore === urlAfter);
  ok(`zero ae:subcat-change events fired`, eventCount === 0, `events=${eventCount}`);
  findings.push({ name: "04-no-op", urlBefore, urlAfter, eventCount });
  await page.close();
}

console.log("\n5. ?sub= deep-link prefills chip selection on load");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/categories/fantezi-fetis-urunu/?sub=giyilebilir-urun`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 300));
  const targetPressed = await page.$eval(
    '.ae-subcat-chip[data-subcat-id="giyilebilir-urun"]',
    (el) => el.getAttribute("aria-pressed"),
  );
  const allPressed = await page.$eval(".ae-subcat-chip-all", (el) => el.getAttribute("aria-pressed"));
  const visibleCount = await page.$$eval(".ae-cat-product", (lis) =>
    lis.filter((l) => window.getComputedStyle(l).display !== "none").length,
  );
  ok(`giyilebilir-urun chip pre-pressed`, targetPressed === "true");
  ok(`Tümü chip not pressed`, allPressed === "false");
  ok(`grid pre-filtered to 2`, visibleCount === 2, `count=${visibleCount}`);
  findings.push({ name: "05-deeplink", targetPressed, allPressed, visibleCount });
  await page.close();
}

console.log("\n6. Combined ?sub= + ?instock= filters apply (AND)");
{
  const page = await newPage();
  // sold_out=true on ginger-warming-balm; that's in erkek-cinsel-saglik-urunu.
  // For fantezi-fetis-urunu: all 3 products are in_stock per current data.
  // Use erkek-cinsel-saglik-urunu instead for this test.
  await page.goto(`${BASE}/en/categories/erkek-cinsel-saglik-urunu/?sub=krem-ve-takviye-edici-gida&instock=1`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 400));
  const visibleCount = await page.$$eval(".ae-cat-product", (lis) =>
    lis.filter((l) => window.getComputedStyle(l).display !== "none").length,
  );
  // ginger-warming-balm is in this subcategory AND sold_out=true. With instock=1, expect 0.
  ok(`subcategory + instock both apply (ginger excluded by sold_out)`, visibleCount === 0, `count=${visibleCount}`);
  findings.push({ name: "06-combined", visibleCount });
  await page.close();
}

console.log("\n7. Empty subcategories — chip row hidden entirely (sisme-manken-urunu has [])");
{
  const page = await newPage();
  await page.goto(`${BASE}/en/categories/sisme-manken-urunu/`, { waitUntil: "networkidle0", timeout: 15000 });
  const chipsExist = await page.$("[data-subcat-chips]").then((h) => h !== null);
  ok(`chip row absent from DOM (subcategories.length === 0)`, !chipsExist);
  await page.screenshot({ path: `${outDir}/07-empty-subcategories.png` });
  findings.push({ name: "07-empty", chipsExist });
  await page.close();
}

console.log("\n8. Horizontal scroll at 320px (fantezi-fetis-urunu has 4, fits but scrolls)");
{
  const page = await newPage({ width: 320, height: 700 });
  await page.goto(`${BASE}/en/categories/fantezi-fetis-urunu/`, { waitUntil: "networkidle0", timeout: 15000 });
  const scrollerWidth = await page.$eval(".ae-subcat-scroller", (el) => el.scrollWidth);
  const containerWidth = await page.$eval(".ae-subcat-scroller", (el) => el.clientWidth);
  const overflows = scrollerWidth > containerWidth;
  await page.screenshot({ path: `${outDir}/08-scroll-320.png` });
  ok(`scroller content width > container width (overflows, scroll engaged)`, overflows, `${scrollerWidth} > ${containerWidth}`);
  findings.push({ name: "08-scroll", scrollerWidth, containerWidth });
  await page.close();
}

console.log("\n9. Search index includes subcategory field");
{
  const page = await newPage();
  await page.goto(`${BASE}/api/search-index-en.json`, { waitUntil: "networkidle0" });
  const text = await page.evaluate(() => document.body.textContent ?? "");
  const data = JSON.parse(text);
  const hasSubcategory = data.every((r) => "subcategory" in r && "subcategory_id" in r);
  ok(`every record has subcategory + subcategory_id fields`, hasSubcategory);
  const massageOilSub = data.find((r) => r.id === "warming-massage-oil")?.subcategory;
  ok(`warming-massage-oil subcategory resolved`, massageOilSub === "Masaj Yağları", `got="${massageOilSub}"`);
  findings.push({ name: "09-index", hasSubcategory, massageOilSub });
  await page.close();
}

await writeFile(`${outDir}/findings.json`, JSON.stringify(findings, null, 2));
await browser.close();
console.log(`\nfindings written to ${outDir}/findings.json`);
