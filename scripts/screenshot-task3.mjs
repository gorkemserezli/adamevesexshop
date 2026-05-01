import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = ".verify-shots/task3";
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

async function newMobilePage() {
  const page = await browser.newPage();
  await page.setViewport({
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  return page;
}

async function shootClosed(loc) {
  const page = await newMobilePage();
  await page.goto(`http://localhost:4322/${loc}/`, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");
  await page.screenshot({ path: `${outDir}/${loc}-closed.png` });
  await page.close();
  console.log(`  ${loc}-closed`);
}

async function shootOpen(loc) {
  const page = await newMobilePage();
  await page.goto(`http://localhost:4322/${loc}/`, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");
  await page.click(".ae-lang-trigger");
  await new Promise((r) => setTimeout(r, 100));
  const aria = await page.$eval(".ae-lang-trigger", (el) => el.getAttribute("aria-expanded"));
  await page.screenshot({ path: `${outDir}/${loc}-open.png` });
  await page.close();
  console.log(`  ${loc}-open  (aria-expanded=${aria})`);
}

console.log("=== closed-state shots ===");
for (const loc of ["en", "tr", "de", "ru"]) await shootClosed(loc);

console.log("\n=== open-state shots ===");
for (const loc of ["en", "tr", "de", "ru"]) await shootOpen(loc);

console.log("\n=== route preservation ===");
{
  const page = await newMobilePage();
  await page.goto("http://localhost:4322/en/", { waitUntil: "networkidle0" });
  await page.click(".ae-lang-trigger");
  await new Promise((r) => setTimeout(r, 80));
  await page.click('[data-locale="ru"]');
  await new Promise((r) => setTimeout(r, 200));
  console.log(`  /en/ → click RU → ${new URL(page.url()).pathname}`);
  await page.close();
}

{
  const page = await newMobilePage();
  await page.evaluateOnNewDocument(() => {
    history.pushState({}, "", "/ru/categories/wellness");
  });
  // Direct navigation to a non-existent deep route just to test the helper —
  // we'll use JS to invoke getLocalizedPath logic since the route doesn't exist yet.
  await page.goto("http://localhost:4322/ru/", { waitUntil: "networkidle0" });
  const result = await page.evaluate(async () => {
    const m = await import("/src/i18n/route.ts").catch(() => null);
    // can't import TS directly in production page; reproduce inline:
    const LOCALES = ["tr", "en", "de", "ru"];
    const re = new RegExp(`^/(${LOCALES.join("|")})(/|$)`);
    const path = "/ru/product/warming-massage-oil";
    return path.replace(re, "/de$2");
  });
  console.log(`  /ru/product/warming-massage-oil → DE: ${result}`);
  await page.close();
}

console.log("\n=== focus return on Escape ===");
{
  const page = await newMobilePage();
  await page.goto("http://localhost:4322/en/", { waitUntil: "networkidle0" });
  await page.click(".ae-lang-trigger");
  await new Promise((r) => setTimeout(r, 80));
  const focusedBefore = await page.evaluate(() => document.activeElement?.getAttribute("data-locale") ?? null);
  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 80));
  const focusedAfter = await page.evaluate(() => document.activeElement?.classList?.contains("ae-lang-trigger") ?? false);
  const aria = await page.$eval(".ae-lang-trigger", (el) => el.getAttribute("aria-expanded"));
  console.log(`  open → focus on option=${focusedBefore} → Escape → focus back to trigger=${focusedAfter}, aria-expanded=${aria}`);
  await page.close();
}

console.log("\n=== chrome no-shift on open ===");
{
  const page = await newMobilePage();
  await page.goto("http://localhost:4322/en/", { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");
  const closed = await page.evaluate(() => {
    const wm = document.querySelector("a[aria-label='Adam & Eve']");
    const nav = document.querySelector(".ae-bottom-nav");
    return { wm: wm?.getBoundingClientRect().toJSON(), nav: nav?.getBoundingClientRect().toJSON() };
  });
  await page.click(".ae-lang-trigger");
  await new Promise((r) => setTimeout(r, 100));
  const open = await page.evaluate(() => {
    const wm = document.querySelector("a[aria-label='Adam & Eve']");
    const nav = document.querySelector(".ae-bottom-nav");
    return { wm: wm?.getBoundingClientRect().toJSON(), nav: nav?.getBoundingClientRect().toJSON() };
  });
  const wmShifted = JSON.stringify(closed.wm) !== JSON.stringify(open.wm);
  const navShifted = JSON.stringify(closed.nav) !== JSON.stringify(open.nav);
  console.log(`  wordmark shift: ${wmShifted}, bottom-nav shift: ${navShifted}`);
  await page.close();
}

await browser.close();
console.log("\ndone");
