import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = ".verify-shots/task2.5";
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

async function shoot(name, url, captureNetwork = false) {
  const page = await browser.newPage();
  await page.setViewport({
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const requests = [];
  if (captureNetwork) {
    page.on("request", (req) => {
      if (req.url().includes(".woff2")) requests.push(req.url());
    });
  }
  await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
  await page.evaluateHandle("document.fonts.ready");
  const path = `${outDir}/${name}.png`;
  await page.screenshot({ path });
  await page.close();
  console.log(`  ${name} → ${path}`);
  return requests;
}

console.log("=== upright-Cyrillic verification (/ru/) with network capture ===");
const ruFonts = await shoot("ru-upright-cyrillic", "http://localhost:4322/ru/", true);
const fontList = ruFonts.map((u) => u.replace("http://localhost:4322", "")).sort();
await writeFile(`${outDir}/ru-fonts.txt`, fontList.join("\n") + "\n");
console.log("\n  Font requests on /ru/ load:");
for (const f of fontList) console.log(`    ${f}`);

console.log("\n=== four-locale chrome regression check ===");
for (const l of ["en", "tr", "de"]) {
  await shoot(`${l}-home`, `http://localhost:4322/${l}/`);
}

await browser.close();
console.log("\ndone");
