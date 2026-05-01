#!/usr/bin/env node
/**
 * Prebuild check: every image referenced from src/content/products/*.json
 * must exist on disk under public/ AND be exactly 1:1 aspect.
 * Fails the build with a readable error otherwise. Implements rule #6.
 */
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PRODUCTS_DIR = join(ROOT, "src", "content", "products");
const PUBLIC_DIR = join(ROOT, "public");

let errors = 0;
const fail = (msg) => {
  errors += 1;
  console.error(`  ✗ ${msg}`);
};

async function checkImage(productFile, imagePath) {
  if (!imagePath.startsWith("/")) {
    fail(`${productFile}: image path "${imagePath}" must start with "/"`);
    return;
  }
  const onDisk = join(PUBLIC_DIR, imagePath);
  if (!existsSync(onDisk)) {
    fail(`${productFile}: image "${imagePath}" not found at ${onDisk}`);
    return;
  }
  try {
    const meta = await sharp(onDisk).metadata();
    if (!meta.width || !meta.height) {
      fail(`${productFile}: image "${imagePath}" has no readable dimensions`);
      return;
    }
    if (meta.width !== meta.height) {
      fail(
        `${productFile}: image "${imagePath}" is ${meta.width}×${meta.height}, must be 1:1 (rule #6)`,
      );
    }
  } catch (e) {
    fail(`${productFile}: failed to read "${imagePath}" — ${e.message}`);
  }
}

async function main() {
  const entries = await readdir(PRODUCTS_DIR, { withFileTypes: true });
  const productFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json")).map((e) => e.name);

  if (productFiles.length === 0) {
    console.log("validate-product-images: no products found, skipping.");
    return;
  }

  console.log(`validate-product-images: checking ${productFiles.length} products…`);

  for (const f of productFiles) {
    const raw = await readFile(join(PRODUCTS_DIR, f), "utf8");
    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      fail(`${f}: invalid JSON (${e.message})`);
      continue;
    }
    const images = Array.isArray(json.images) ? json.images : [];
    if (images.length === 0) {
      fail(`${f}: no images[] entries`);
      continue;
    }
    for (const img of images) {
      await checkImage(f, img);
    }
  }

  if (errors > 0) {
    console.error(`\nvalidate-product-images: ${errors} error(s). Failing build.`);
    process.exit(1);
  }
  console.log("validate-product-images: all images 1:1 ✓");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
