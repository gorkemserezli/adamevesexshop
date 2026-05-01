import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:4321";
const outDir = ".verify-shots/task8";
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

console.log("\n=== Task 8 verification ===\n");

console.log("1. Age gate — first paint, all 4 locales");
for (const loc of ["tr", "en", "de", "ru"]) {
  const page = await newPage();
  await page.goto(`${BASE}/${loc}/`, { waitUntil: "networkidle0", timeout: 15000 });
  const overlayVisible = await page.$eval("#ae-age-gate", (el) => {
    const styles = window.getComputedStyle(el);
    return styles.display !== "none";
  }).catch(() => false);
  await page.screenshot({ path: `${outDir}/01-${loc}-agegate-firstpaint.png` });
  ok(`${loc} age gate visible`, overlayVisible);
  findings.push({ name: `01-${loc}-agegate`, overlayVisible });
  await page.close();
}

console.log("\n2. Age gate — confirmed session removes overlay node entirely (no flash, no a11y residue)");
{
  const page = await newPage();
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("ae:age-confirmed", "1");
  });
  await page.goto(`${BASE}/en/`, { waitUntil: "networkidle0", timeout: 15000 });
  const overlayInDom = await page.$("#ae-age-gate").then((h) => h !== null);
  await page.screenshot({ path: `${outDir}/02-confirmed-no-flash.png` });
  ok("overlay removed from DOM (.remove() ran, not just display:none)", !overlayInDom);
  findings.push({ name: "02-confirmed", overlayInDom });
  await page.close();
}

console.log("\n3. Settings sheet — open from header overflow, all 4 locales");
for (const loc of ["tr", "en", "de", "ru"]) {
  const page = await newPage();
  await page.evaluateOnNewDocument(() => sessionStorage.setItem("ae:age-confirmed", "1"));
  await page.goto(`${BASE}/${loc}/`, { waitUntil: "networkidle0", timeout: 15000 });
  await page.click("#ae-header-overflow");
  await new Promise((r) => setTimeout(r, 400));
  const sheetState = await page.$eval("#ae-settings-sheet", (el) => el.getAttribute("data-sheet-state"));
  await page.screenshot({ path: `${outDir}/03-${loc}-settings-open.png` });
  ok(`${loc} settings sheet open`, sheetState === "open");
  findings.push({ name: `03-${loc}-settings`, sheetState });
  await page.close();
}

console.log("\n4. Privacy mode — toggle on, PDP image blurred");
{
  const page = await newPage();
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("ae:age-confirmed", "1");
    localStorage.setItem("ae:gizli-mode", "on");
  });
  await page.goto(`${BASE}/en/product/warming-massage-oil/`, { waitUntil: "networkidle0", timeout: 15000 });
  const blurAttr = await page.$eval("html", (el) => el.getAttribute("data-blur"));
  const filterApplied = await page.$eval("img.ae-product-image", (img) => {
    const f = window.getComputedStyle(img).filter;
    return f && f !== "none" && f.includes("blur");
  }).catch(() => false);
  await page.screenshot({ path: `${outDir}/04-privacy-on-pdp.png` });
  ok("html[data-blur]=on", blurAttr === "on");
  ok("PDP image blurred", filterApplied);
  findings.push({ name: "04-privacy-pdp", blurAttr, filterApplied });
  await page.close();
}

console.log("\n5. Privacy mode — tap-to-reveal frame");
{
  const page = await newPage();
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("ae:age-confirmed", "1");
    localStorage.setItem("ae:gizli-mode", "on");
  });
  await page.goto(`${BASE}/en/product/warming-massage-oil/`, { waitUntil: "networkidle0", timeout: 15000 });
  await page.click("img.ae-product-image");
  // Wait past transition window so getComputedStyle reads the resolved value.
  await new Promise((r) => setTimeout(r, 500));
  const revealed = await page.$eval("img.ae-product-image", (img) => img.classList.contains("revealed"));
  const filterCleared = await page.$eval("img.ae-product-image", (img) => {
    const f = window.getComputedStyle(img).filter;
    return f === "none";
  });
  await page.screenshot({ path: `${outDir}/05-privacy-revealed.png` });
  ok(".revealed class applied", revealed);
  ok("filter cleared during reveal window", filterCleared);
  findings.push({ name: "05-revealed", revealed, filterCleared });
  await page.close();
}

console.log("\n6. Favorites — populated state");
{
  const page = await newPage();
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("ae:age-confirmed", "1");
    localStorage.removeItem("ae:gizli-mode");
    localStorage.setItem("ae:favorites", JSON.stringify(["AE-WMO-100", "AE-LB-001", "AE-STS-PR"]));
  });
  await page.goto(`${BASE}/en/favorites/`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 300));
  const visibleCount = await page.$$eval(".ae-fav-card", (cards) =>
    cards.filter((c) => window.getComputedStyle(c).display !== "none").length,
  );
  await page.screenshot({ path: `${outDir}/06-favorites-populated.png`, fullPage: true });
  ok("3 favorite cards visible", visibleCount === 3);
  findings.push({ name: "06-fav-populated", visibleCount });
  await page.close();
}

console.log("\n7. Favorites — empty state");
{
  const page = await newPage();
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("ae:age-confirmed", "1");
    localStorage.removeItem("ae:favorites");
    localStorage.removeItem("ae:gizli-mode");
  });
  await page.goto(`${BASE}/en/favorites/`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 300));
  const emptyVisible = await page.$eval("#ae-fav-empty", (el) => window.getComputedStyle(el).display !== "none");
  const ctaHref = await page.$eval(".ae-empty-cta", (el) => el.getAttribute("href"));
  await page.screenshot({ path: `${outDir}/07-favorites-empty.png` });
  ok("empty state visible", emptyVisible);
  // Updated post-Task-11: favoritesEmptyCtaHref now points at categories index
  // (closes Task 8 Decision 3 promise). Was /en/ before Task 11.
  ok("empty CTA href = /en/categories/", ctaHref === "/en/categories/");
  findings.push({ name: "07-fav-empty", emptyVisible, ctaHref });
  await page.close();
}

console.log("\n8. Favorites + privacy mode (Decision 4 expansion)");
{
  const page = await newPage();
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("ae:age-confirmed", "1");
    localStorage.setItem("ae:gizli-mode", "on");
    localStorage.setItem("ae:favorites", JSON.stringify(["AE-WMO-100", "AE-LB-001"]));
  });
  await page.goto(`${BASE}/en/favorites/`, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 300));
  const blurredCount = await page.$$eval(".ae-fav-card img.ae-product-image", (imgs) =>
    imgs
      .filter((img) => window.getComputedStyle(img.parentElement?.parentElement?.parentElement ?? img).display !== "none")
      .filter((img) => {
        const f = window.getComputedStyle(img).filter;
        return f && f !== "none" && f.includes("blur");
      }).length,
  );
  await page.screenshot({ path: `${outDir}/08-favorites-privacy-on.png`, fullPage: true });
  ok("favorites thumbnails blurred (privacy scope expansion)", blurredCount >= 1);
  findings.push({ name: "08-fav-privacy", blurredCount });
  await page.close();
}

console.log("\n9. Toast — fired by favorites tap on PDP");
{
  const page = await newPage();
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("ae:age-confirmed", "1");
    localStorage.removeItem("ae:favorites");
    localStorage.removeItem("ae:gizli-mode");
  });
  await page.goto(`${BASE}/en/product/warming-massage-oil/`, { waitUntil: "networkidle0", timeout: 15000 });
  await page.click(".ae-fav-btn");
  await new Promise((r) => setTimeout(r, 200));
  const toastState = await page.$eval("#ae-toast", (el) => el.getAttribute("data-toast-state"));
  const toastText = await page.$eval(".ae-toast-label", (el) => el.textContent?.trim() ?? "");
  await page.screenshot({ path: `${outDir}/09-toast-added.png` });
  ok("toast visible", toastState === "visible");
  ok(`toast label = "Added to favorites"`, toastText === "Added to favorites");
  findings.push({ name: "09-toast", toastState, toastText });
  await page.close();
}

console.log("\n10. Build identifier meta tag");
{
  const page = await newPage();
  await page.evaluateOnNewDocument(() => sessionStorage.setItem("ae:age-confirmed", "1"));
  await page.goto(`${BASE}/en/`, { waitUntil: "networkidle0", timeout: 15000 });
  const version = await page.$eval('meta[name="ae:version"]', (el) => el.getAttribute("content"));
  ok("ae:version meta tag in head", typeof version === "string" && version.length > 0, `version=${version}`);
  findings.push({ name: "10-version", version });
  await page.close();
}

await writeFile(`${outDir}/findings.json`, JSON.stringify(findings, null, 2));

await browser.close();
console.log(`\nfindings written to ${outDir}/findings.json`);
