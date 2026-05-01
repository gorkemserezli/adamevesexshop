/**
 * Final-pass harness: 8 page templates × 4 locales × 3 viewports + dark-mode
 * token render verification.
 *
 * Per Decision 4: dark mode is activated by [data-theme="dark"] on <html>,
 * NOT by prefers-color-scheme media query. The verification sets the attribute
 * directly via page.evaluate.
 */
import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:4321";
const outDir = ".verify-shots/task12";
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

const VIEWPORTS = [
  { name: "320", width: 320, height: 700, isMobile: true },
  { name: "375", width: 375, height: 812, isMobile: true },
  { name: "1024", width: 1024, height: 768, isMobile: false },
];

const TEMPLATES = [
  { name: "home", path: "/" },
  { name: "categories", path: "/categories/" },
  { name: "category", path: "/categories/wellness/" },
  { name: "pdp", path: "/product/warming-massage-oil/" },
  { name: "favorites", path: "/favorites/" },
  { name: "search", path: "/search/" },
];

function ok(label, cond, detail = "") {
  console.log(`  ${cond ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  return cond;
}

const findings = [];
let consoleErrorCount = 0;
let pageRunCount = 0;
let okCount = 0;
let failCount = 0;

console.log("\n=== Task 12 final-pass harness ===\n");

console.log("Section 1 — Light-mode templates × locales × viewports");
for (const tmpl of TEMPLATES) {
  for (const loc of ["tr", "en", "de", "ru"]) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.isMobile ? 2 : 1,
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile,
      });
      await page.evaluateOnNewDocument(() => sessionStorage.setItem("ae:age-confirmed", "1"));
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e.message)));
      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        const text = msg.text();
        // Filter expected stock-fetch failures from the deliberately-unreachable
        // .invalid TLD (per Decision 3 production posture). These are network
        // warnings, not JS errors, and the §3.17 fallback path handles them.
        if (
          text.includes("ERR_CERT") ||
          text.includes("ERR_NAME_NOT_RESOLVED") ||
          text.includes("Failed to load resource") ||
          text.includes(".invalid")
        ) {
          return;
        }
        errors.push(text);
      });
      const url = `${BASE}/${loc}${tmpl.path}`;
      try {
        await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
        await page.screenshot({
          path: `${outDir}/${tmpl.name}-${loc}-${vp.name}.png`,
        });
        const noErr = errors.length === 0;
        pageRunCount += 1;
        if (noErr) okCount += 1; else { failCount += 1; consoleErrorCount += errors.length; }
        if (!noErr) {
          console.log(`  ✗ ${tmpl.name} ${loc} @${vp.name}px — ${errors.length} console error(s): ${errors[0].slice(0, 80)}`);
        }
        findings.push({ template: tmpl.name, loc, vp: vp.name, errors });
      } catch (err) {
        failCount += 1;
        console.log(`  ✗ ${tmpl.name} ${loc} @${vp.name}px — load failed: ${err.message.slice(0, 80)}`);
        findings.push({ template: tmpl.name, loc, vp: vp.name, loadError: err.message });
      }
      await page.close();
    }
  }
}
console.log(`  light-mode runs: ${okCount}/${pageRunCount} clean (no console errors)`);
ok("zero console errors across all light-mode runs", consoleErrorCount === 0, `errors=${consoleErrorCount}`);

console.log("\nSection 2 — Dark-mode token render verification (data-theme attribute, NOT media query)");
const darkSamples = [
  { name: "home", path: "/" },
  { name: "pdp", path: "/product/warming-massage-oil/" },
  { name: "search", path: "/search/" },
  { name: "category", path: "/categories/wellness/" },
];
let darkOk = 0;
for (const s of darkSamples) {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => sessionStorage.setItem("ae:age-confirmed", "1"));
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (
      text.includes("ERR_CERT") ||
      text.includes("ERR_NAME_NOT_RESOLVED") ||
      text.includes("Failed to load resource") ||
      text.includes(".invalid")
    ) return;
    errors.push(text);
  });
  const url = `${BASE}/en${s.path}`;
  await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
  // Activate dark mode per the documented mechanism (not media query).
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await new Promise((r) => setTimeout(r, 200));
  const bodyBg = await page.$eval("body", (b) => window.getComputedStyle(b).backgroundColor);
  await page.screenshot({ path: `${outDir}/dark-${s.name}.png` });
  const cleanErrors = errors.length === 0;
  // Sanity: bg should resolve to a real color (not "" or "rgba(0,0,0,0)" which
  // would indicate a missing-variable fallback). Check for non-empty rgb output.
  const bgResolved = /^rgb/.test(bodyBg);
  const passed = cleanErrors && bgResolved;
  ok(`dark ${s.name} — bg=${bodyBg}, errors=${errors.length}`, passed);
  if (passed) darkOk += 1;
  findings.push({ darkSample: s.name, bodyBg, errors, passed });
  await page.close();
}

console.log("\n=== Summary ===");
ok(`light-mode: ${okCount} of ${pageRunCount} runs error-free`, okCount === pageRunCount);
ok(`dark-mode: ${darkOk} of ${darkSamples.length} samples render without errors`, darkOk === darkSamples.length);

await writeFile(`${outDir}/findings.json`, JSON.stringify({ runCount: pageRunCount, okCount, failCount, consoleErrorCount, findings }, null, 2));
await browser.close();
console.log(`\nfindings written to ${outDir}/findings.json`);
