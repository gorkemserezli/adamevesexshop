/**
 * Standalone a11y harness for the Slider primitive. Run BEFORE FilterSheet
 * wiring so we know the centerpiece is solid in isolation.
 *
 * Checks:
 *   1. Initial state — visual thumbs at correct positions, aria-valuetext set,
 *      dynamic group aria-label includes both values.
 *   2. Keyboard: ArrowRight increments by step, ArrowLeft decrements.
 *   3. Keyboard: Home snaps to track min, End snaps to track max.
 *   4. Keyboard: PageUp/PageDown move by 10× step.
 *   5. Programmatic SR simulation: set .value on a native input + dispatch
 *      'input' event, assert visual thumb position updates (bidirectional sync).
 *   6. Collision: setting min above max pushes max along (and vice versa).
 *   7. Touch target: each native input's bounding rect is >= 44×44.
 *   8. Dynamic aria-label: refreshes after a value change.
 */
import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:4321";
const URL = `${BASE}/test-slider-fixture/`;
const outDir = ".verify-shots/task10-slider";
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

function ok(label, cond, detail = "") {
  const sym = cond ? "✓" : "✗";
  console.log(`  ${sym} ${label}${detail ? ` — ${detail}` : ""}`);
  return cond;
}

const findings = [];

await page.goto(URL, { waitUntil: "networkidle0", timeout: 15000 });

console.log("\n=== Slider a11y harness ===\n");

console.log("1. Initial state");
{
  const minV = await page.$eval(".ae-slider-input-min", (el) => el.value);
  const maxV = await page.$eval(".ae-slider-input-max", (el) => el.value);
  const minVT = await page.$eval(".ae-slider-input-min", (el) => el.getAttribute("aria-valuetext"));
  const maxVT = await page.$eval(".ae-slider-input-max", (el) => el.getAttribute("aria-valuetext"));
  const groupLabel = await page.$eval(".ae-slider", (el) => el.getAttribute("aria-label"));
  await page.screenshot({ path: `${outDir}/01-initial.png` });
  ok(`min input value = 20`, minV === "20");
  ok(`max input value = 80`, maxV === "80");
  ok(`min aria-valuetext = "20 dollars"`, minVT === "20 dollars");
  ok(`max aria-valuetext = "80 dollars"`, maxVT === "80 dollars");
  ok(`dynamic group label includes both values`, groupLabel === "Price range, 20 dollars to 80 dollars", groupLabel ?? "");
  findings.push({ name: "01-initial", minV, maxV, minVT, maxVT, groupLabel });
}

console.log("\n2. Keyboard: ArrowRight on min thumb");
{
  await page.focus(".ae-slider-input-min");
  await page.keyboard.press("ArrowRight");
  await new Promise((r) => setTimeout(r, 50));
  const minV = await page.$eval(".ae-slider-input-min", (el) => el.value);
  ok(`min increments by step (1) → 21`, minV === "21");
  await page.keyboard.press("ArrowLeft");
  await new Promise((r) => setTimeout(r, 50));
  const minV2 = await page.$eval(".ae-slider-input-min", (el) => el.value);
  ok(`min decrements back → 20`, minV2 === "20");
  findings.push({ name: "02-arrow", minV, minV2 });
}

console.log("\n3. Keyboard: Home / End");
{
  await page.focus(".ae-slider-input-min");
  await page.keyboard.press("Home");
  await new Promise((r) => setTimeout(r, 50));
  const minV = await page.$eval(".ae-slider-input-min", (el) => el.value);
  ok(`Home snaps min to track min (0)`, minV === "0");
  await page.focus(".ae-slider-input-max");
  await page.keyboard.press("End");
  await new Promise((r) => setTimeout(r, 50));
  const maxV = await page.$eval(".ae-slider-input-max", (el) => el.value);
  ok(`End snaps max to track max (100)`, maxV === "100");
  findings.push({ name: "03-home-end", minV, maxV });
  // Reset for subsequent tests.
  await page.evaluate(() => {
    const inMin = document.querySelector(".ae-slider-input-min");
    const inMax = document.querySelector(".ae-slider-input-max");
    inMin.value = "20";
    inMax.value = "80";
    inMin.dispatchEvent(new Event("input", { bubbles: true }));
    inMax.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

console.log("\n4. Keyboard: PageUp / PageDown");
{
  await page.focus(".ae-slider-input-min");
  await page.keyboard.press("PageUp");
  await new Promise((r) => setTimeout(r, 50));
  const minV = await page.$eval(".ae-slider-input-min", (el) => el.value);
  // Native input PageUp default is 10× step, so 20 → 30.
  ok(`PageUp moves min by 10× step (20 → 30)`, minV === "30");
  await page.keyboard.press("PageDown");
  await new Promise((r) => setTimeout(r, 50));
  const minV2 = await page.$eval(".ae-slider-input-min", (el) => el.value);
  ok(`PageDown returns min to 20`, minV2 === "20");
  findings.push({ name: "04-page", minV, minV2 });
}

console.log("\n5. Programmatic SR simulation: set .value + dispatch input → visual updates");
{
  await page.evaluate(() => {
    const inMin = document.querySelector(".ae-slider-input-min");
    inMin.value = "40"; // Simulating VoiceOver swipe
    inMin.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 50));
  const inputV = await page.$eval(".ae-slider-input-min", (el) => el.value);
  const thumbLeft = await page.$eval(".ae-slider-thumb-min", (el) => el.style.left);
  // 40 on [0,100] is 40%
  ok(`visual thumb left = 40%`, thumbLeft === "40%", `actual=${thumbLeft}`);
  ok(`input value still 40 after sync`, inputV === "40");
  findings.push({ name: "05-sr-sim", inputV, thumbLeft });
}

console.log("\n6. Collision: pushing min above max pulls max along");
{
  await page.evaluate(() => {
    const inMin = document.querySelector(".ae-slider-input-min");
    inMin.value = "85"; // > current max (80)
    inMin.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 50));
  const minV = await page.$eval(".ae-slider-input-min", (el) => el.value);
  const maxV = await page.$eval(".ae-slider-input-max", (el) => el.value);
  ok(`min pushed to 85`, minV === "85");
  ok(`max pulled along to 86 (min + step)`, maxV === "86");
  findings.push({ name: "06-collision", minV, maxV });
}

console.log("\n7. Touch target ≥ 44×44 on each native input");
{
  const minRect = await page.$eval(".ae-slider-input-min", (el) => {
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height };
  });
  const maxRect = await page.$eval(".ae-slider-input-max", (el) => {
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height };
  });
  ok(`min input ≥ 44×44`, minRect.w >= 44 && minRect.h >= 44, `${minRect.w}×${minRect.h}`);
  ok(`max input ≥ 44×44`, maxRect.w >= 44 && maxRect.h >= 44, `${maxRect.w}×${maxRect.h}`);
  findings.push({ name: "07-touch-target", minRect, maxRect });
}

console.log("\n8. Dynamic aria-label refreshes after value change");
{
  // Reset to known state
  await page.evaluate(() => {
    const inMin = document.querySelector(".ae-slider-input-min");
    const inMax = document.querySelector(".ae-slider-input-max");
    inMin.value = "30";
    inMax.value = "70";
    inMin.dispatchEvent(new Event("input", { bubbles: true }));
    inMax.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 50));
  const groupLabel = await page.$eval(".ae-slider", (el) => el.getAttribute("aria-label"));
  ok(
    `dynamic label updated to "Price range, 30 dollars to 70 dollars"`,
    groupLabel === "Price range, 30 dollars to 70 dollars",
    groupLabel ?? "",
  );
  findings.push({ name: "08-dynamic-label", groupLabel });
  await page.screenshot({ path: `${outDir}/08-dynamic-label.png` });
}

await writeFile(`${outDir}/findings.json`, JSON.stringify(findings, null, 2));
await browser.close();
console.log(`\nfindings written to ${outDir}/findings.json`);
