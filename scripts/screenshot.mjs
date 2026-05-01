import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const targets = [
  { name: "en-home", url: "http://localhost:4322/en/" },
  { name: "tr-home", url: "http://localhost:4322/tr/" },
  { name: "de-home", url: "http://localhost:4322/de/" },
  { name: "ru-home", url: "http://localhost:4322/ru/" },
  { name: "en-scratch", url: "http://localhost:4322/en/scratch" },
  { name: "tr-scratch", url: "http://localhost:4322/tr/scratch" },
  { name: "de-scratch", url: "http://localhost:4322/de/scratch" },
  { name: "ru-scratch", url: "http://localhost:4322/ru/scratch" },
];

const outDir = ".verify-shots/task2";
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

for (const t of targets) {
  const page = await browser.newPage();
  await page.setViewport({
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(t.url, { waitUntil: "networkidle0", timeout: 15000 });
  await page.evaluateHandle("document.fonts.ready");
  const path = `${outDir}/${t.name}.png`;
  await page.screenshot({ path, fullPage: false });
  await page.close();
  const dim = await (async () => {
    const p = await browser.newPage();
    await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 1 });
    await p.goto(t.url, { waitUntil: "domcontentloaded" });
    const d = await p.evaluate(() => ({
      innerWidth: window.innerWidth,
      bodyWidth: document.body.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    await p.close();
    return d;
  })();
  console.log(`  ${t.name} → ${path}  viewport ${dim.innerWidth}, body ${dim.bodyWidth} (scroll ${dim.bodyScrollWidth})`);
}

await browser.close();
console.log("done");
