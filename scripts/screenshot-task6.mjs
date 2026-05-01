import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = ".verify-shots/task6";
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

async function shoot(name, url, opts = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const fontReqs = [];
  page.on("request", (r) => {
    if (r.url().includes(".woff2")) fontReqs.push(r.url().replace("http://localhost:4322", ""));
  });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
  await page.evaluateHandle("document.fonts.ready");
  await page.screenshot({ path: `${outDir}/${name}.png` });
  if (opts.fullPage) {
    await page.screenshot({ path: `${outDir}/${name}-full.png`, fullPage: true });
  }
  console.log(`  ${name}  fonts:${fontReqs.length}${opts.logFonts ? ` [${fontReqs.sort().join(", ")}]` : ""}`);
  await page.close();
}

console.log("=== Task 5 Latin-Ext flag check on /tr/ home ===");
await shoot("tr-home-fontcheck", "http://localhost:4322/tr/", { logFonts: true });

console.log("\n=== multi-axis warming-massage-oil (vetiver strike) ===");
for (const loc of ["en", "tr", "de", "ru"]) {
  await shoot(
    `${loc}-pdp-warming-oil`,
    `http://localhost:4322/${loc}/product/warming-massage-oil/`,
    { fullPage: true, logFonts: loc === "tr" || loc === "ru" },
  );
}

console.log("\n=== silk-tie-set (DE/RU soft-hyphens) ===");
await shoot("de-pdp-silk-tie-set", "http://localhost:4322/de/product/silk-tie-set/");
await shoot("ru-pdp-silk-tie-set", "http://localhost:4322/ru/product/silk-tie-set/");

console.log("\n=== leather-blindfold (no variants) ===");
await shoot("en-pdp-leather-blindfold", "http://localhost:4322/en/product/leather-blindfold/", { fullPage: true });

console.log("\n=== ginger-warming-balm (sold-out, all chips struck) ===");
await shoot("en-pdp-ginger-balm", "http://localhost:4322/en/product/ginger-warming-balm/", { fullPage: true });

await browser.close();
console.log("\ndone");
