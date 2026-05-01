import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = ".verify-shots/task5";
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

async function shoot(loc) {
  const page = await browser.newPage();
  await page.setViewport({
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const fontRequests = [];
  page.on("request", (r) => {
    if (r.url().includes(".woff2")) fontRequests.push(r.url().replace("http://localhost:4322", ""));
  });
  await page.goto(`http://localhost:4322/${loc}/`, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");
  // Top-of-fold shot at viewport size
  await page.screenshot({ path: `${outDir}/${loc}-home.png` });
  // Full-page shot to capture footer
  await page.screenshot({ path: `${outDir}/${loc}-home-full.png`, fullPage: true });
  console.log(`  ${loc}-home → ${fontRequests.length} font reqs`);
  if (loc === "ru") {
    console.log(`    fonts on /ru/: ${fontRequests.sort().join(", ")}`);
  }
  await page.close();
}

console.log("=== homepage shots ===");
for (const loc of ["en", "tr", "de", "ru"]) await shoot(loc);
await browser.close();
console.log("done");
