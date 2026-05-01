import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:4321";
const outDir = ".verify-shots/task9";
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

async function newPage(viewport = { width: 375, height: 812 }) {
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  return page;
}

function ok(label, cond, detail = "") {
  console.log(`  ${cond ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  return cond;
}

const findings = [];

async function seedConfirmedAge(page) {
  await page.evaluateOnNewDocument(() => sessionStorage.setItem("ae:age-confirmed", "1"));
}

async function typeAndWait(page, selector, q, settleMs = 350) {
  await page.click(selector);
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.value = "";
  }, selector);
  await page.type(selector, q);
  await new Promise((r) => setTimeout(r, settleMs));
}

console.log("\n=== Task 9 verification ===\n");

console.log("1. Idle state — first load with no query");
{
  const page = await newPage();
  await seedConfirmedAge(page);
  await page.goto(`${BASE}/en/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  const idleHintVisible = await page.$eval("#ae-search-idle-hint", (el) => window.getComputedStyle(el).display !== "none");
  const resultsCount = await page.$$eval("#ae-search-results > li", (lis) => lis.length);
  await page.screenshot({ path: `${outDir}/01-idle-en.png` });
  ok("idle hint visible on empty load", idleHintVisible);
  ok("zero results rendered", resultsCount === 0);
  findings.push({ name: "01-idle", idleHintVisible, resultsCount });
  await page.close();
}

console.log("\n2. Live results — exact name match (EN)");
{
  const page = await newPage();
  await seedConfirmedAge(page);
  await page.goto(`${BASE}/en/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  await typeAndWait(page, "#ae-search-input", "oil");
  const resultsCount = await page.$$eval("#ae-search-results > li", (lis) => lis.length);
  const firstName = await page.$eval("#ae-search-results > li:first-child .font-serif", (el) => el.textContent?.trim() ?? "").catch(() => "");
  await page.screenshot({ path: `${outDir}/02-results-oil-en.png` });
  ok(`hits for 'oil' (count=${resultsCount})`, resultsCount > 0);
  ok(`top hit name = Warming Massage Oil`, firstName === "Warming Massage Oil", firstName);
  findings.push({ name: "02-oil", resultsCount, firstName });
  await page.close();
}

console.log("\n3. Fuzzy match — typo");
{
  const page = await newPage();
  await seedConfirmedAge(page);
  await page.goto(`${BASE}/en/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  await typeAndWait(page, "#ae-search-input", "masage");
  const names = await page.$$eval("#ae-search-results > li .font-serif", (els) => els.map((e) => e.textContent?.trim() ?? ""));
  await page.screenshot({ path: `${outDir}/03-fuzzy-masage-en.png` });
  ok("fuzzy 'masage' finds massage oil", names.some((n) => n.toLowerCase().includes("massage")));
  findings.push({ name: "03-fuzzy", names });
  await page.close();
}

console.log("\n4. Cyrillic search (RU)");
{
  const page = await newPage();
  await seedConfirmedAge(page);
  await page.goto(`${BASE}/ru/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  await typeAndWait(page, "#ae-search-input", "масло");
  const names = await page.$$eval("#ae-search-results > li .font-serif", (els) => els.map((e) => e.textContent?.trim() ?? ""));
  await page.screenshot({ path: `${outDir}/04-cyrillic-ru.png` });
  ok("RU 'масло' returns at least one result", names.length > 0, `names=${names.join(" | ")}`);
  findings.push({ name: "04-ru", names });
  await page.close();
}

console.log("\n5. No results — random gibberish");
{
  const page = await newPage();
  await seedConfirmedAge(page);
  await page.goto(`${BASE}/en/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  await typeAndWait(page, "#ae-search-input", "xyzqq");
  const noResultsVisible = await page.$eval("#ae-search-no-results", (el) => window.getComputedStyle(el).display !== "none");
  // Post-Task-10: CTA element exists in DOM but is display:none when no
  // filter is active. Check visibility, not presence.
  const ctaPresent = await page.$eval(
    "#ae-search-no-results #ae-search-reset-filters",
    (el) => window.getComputedStyle(el).display !== "none",
  ).catch(() => false);
  await page.screenshot({ path: `${outDir}/05-no-results-en.png` });
  ok("no-results state visible", noResultsVisible);
  ok("no CTA rendered (Decision 5 fix)", !ctaPresent);
  findings.push({ name: "05-no-results", noResultsVisible, ctaPresent });
  await page.close();
}

console.log("\n6. Per-locale fetch isolation (network)");
{
  const page = await newPage();
  await seedConfirmedAge(page);
  const indexHits = { tr: 0, en: 0, de: 0, ru: 0 };
  page.on("request", (r) => {
    const url = r.url();
    for (const loc of ["tr", "en", "de", "ru"]) {
      if (url.includes(`/api/search-index-${loc}.json`)) indexHits[loc] += 1;
    }
  });
  await page.goto(`${BASE}/ru/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  await typeAndWait(page, "#ae-search-input", "масло");
  await page.close();
  ok(`only ru index fetched — ru=${indexHits.ru}, others=${indexHits.tr}+${indexHits.en}+${indexHits.de}`,
    indexHits.ru === 1 && indexHits.tr === 0 && indexHits.en === 0 && indexHits.de === 0);
  findings.push({ name: "06-locale-isolation", indexHits });
}

console.log("\n7. ?q= deep-link prefill");
{
  const page = await newPage();
  await seedConfirmedAge(page);
  await page.goto(`${BASE}/en/search/?q=robe`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 350));
  const inputValue = await page.$eval("#ae-search-input", (el) => el.value);
  const resultsCount = await page.$$eval("#ae-search-results > li", (lis) => lis.length);
  await page.screenshot({ path: `${outDir}/07-deeplink-q-robe.png` });
  ok("input prefilled from ?q=", inputValue === "robe");
  ok("results rendered from prefilled query", resultsCount > 0, `count=${resultsCount}`);
  findings.push({ name: "07-deeplink", inputValue, resultsCount });
  await page.close();
}

console.log("\n8. URL syncs as user types (history.replaceState)");
{
  const page = await newPage();
  await seedConfirmedAge(page);
  await page.goto(`${BASE}/en/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  await typeAndWait(page, "#ae-search-input", "lace");
  const url = page.url();
  ok("URL contains ?q=lace after typing", url.includes("q=lace"), url);
  findings.push({ name: "08-url-sync", url });
  await page.close();
}

console.log("\n9. Header magnifier routes to /lang/search/");
{
  const page = await newPage();
  await seedConfirmedAge(page);
  await page.goto(`${BASE}/en/`, { waitUntil: "networkidle0", timeout: 15000 });
  const magHref = await page.$eval(".ae-header a[aria-label='Search']", (a) => a.getAttribute("href"));
  ok("header magnifier href = /en/search/", magHref === "/en/search/");
  findings.push({ name: "09-header-route", magHref });
  await page.close();
}

console.log("\n10. Bottom-nav search routes to /lang/search/ + active rule on page");
{
  const page = await newPage();
  await seedConfirmedAge(page);
  await page.goto(`${BASE}/en/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  const navHrefs = await page.$$eval(".ae-bottom-nav a", (anchors) => anchors.map((a) => a.getAttribute("href")));
  const activeKey = await page.$eval(".ae-bottom-nav a[aria-current='page']", (a) => a.getAttribute("href"));
  ok("bottom-nav search slot links to /en/search/", navHrefs.includes("/en/search/"));
  ok("active rule on /en/search/ matches search slot", activeKey === "/en/search/");
  findings.push({ name: "10-bottomnav", navHrefs, activeKey });
  await page.close();
}

console.log("\n11b. Search index-fetch skeleton mid-fetch");
{
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => sessionStorage.setItem("ae:age-confirmed", "1"));
  await page.setRequestInterception(true);
  let releasedAt = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/search-index-")) {
      // Hold the request for ~700ms so we can snapshot the skeleton frame.
      setTimeout(() => {
        releasedAt = Date.now();
        r.continue();
      }, 700);
      return;
    }
    r.continue();
  });
  await page.goto(`${BASE}/en/search/`, { waitUntil: "networkidle0", timeout: 15000 });
  // Type a query — search runs, skeleton renders immediately, fetch held.
  await page.click("#ae-search-input");
  await page.type("#ae-search-input", "oil");
  // Wait the debounce + a bit to let skeleton paint, but well before fetch releases.
  await new Promise((r) => setTimeout(r, 400));
  const skeletonCount = await page.$$eval("#ae-search-results > li.ae-card-skeleton", (lis) => lis.length);
  await page.screenshot({ path: `${outDir}/11b-skeleton-mid-fetch.png` });
  ok(`skeleton cards visible mid-fetch (count=${skeletonCount})`, skeletonCount === 4);
  findings.push({ name: "11b-skeleton", skeletonCount, releasedAt });
  await page.close();
}

console.log("\n11. Privacy mode applies to result thumbnails");
{
  const page = await newPage();
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("ae:age-confirmed", "1");
    localStorage.setItem("ae:gizli-mode", "on");
  });
  await page.goto(`${BASE}/en/search/?q=oil`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 350));
  const blurredCount = await page.$$eval("#ae-search-results img.ae-product-image", (imgs) =>
    imgs.filter((img) => {
      const f = window.getComputedStyle(img).filter;
      return f && f !== "none" && f.includes("blur");
    }).length,
  );
  await page.screenshot({ path: `${outDir}/11-privacy-on-results.png`, fullPage: true });
  ok("result thumbnails blurred under privacy mode", blurredCount > 0, `blurredCount=${blurredCount}`);
  findings.push({ name: "11-privacy", blurredCount });
  await page.close();
}

await writeFile(`${outDir}/findings.json`, JSON.stringify(findings, null, 2));
await browser.close();
console.log(`\nfindings written to ${outDir}/findings.json`);
