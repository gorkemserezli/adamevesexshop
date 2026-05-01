#!/usr/bin/env node
/**
 * Prebuild check: every image referenced from src/content/products/*.json
 * must be either:
 *   - a local path starting with "/" (e.g. "/products/x.jpg") — must exist
 *     on disk under public/ AND be exactly 1:1 aspect (rule #6).
 *   - an absolute HTTPS URL (e.g. "https://cdn.example.com/x.jpg") — trusted
 *     to be 1:1; aspect check skipped. Rationale: production fetch.php emits
 *     CDN URLs (xmlbankasi.com), already verified 1:1 upstream by the fetcher.
 *     Inspecting 800+ remote images per build would slow Cloudflare builds and
 *     risk rate-limiting the CDN.
 *
 * Rejects: http://, relative paths, file://, anything that's neither shape.
 *
 * Fails the build with a readable error on any reject. Implements rule #6.
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

/**
 * Classify an image path. Returns:
 *   "local"  — starts with "/" (validate on-disk + aspect)
 *   "https"  — absolute https:// URL (trust CDN, skip aspect)
 *   "reject" — anything else
 */
export function classifyImagePath(p) {
  if (typeof p !== "string" || p.length === 0) return "reject";
  if (p.startsWith("/")) return "local";
  if (p.startsWith("https://")) return "https";
  return "reject";
}

async function checkImage(productFile, imagePath) {
  const kind = classifyImagePath(imagePath);
  if (kind === "reject") {
    fail(
      `${productFile}: image path "${imagePath}" must start with "/" (local) or "https://" (CDN)`,
    );
    return;
  }
  if (kind === "https") {
    // Trust the CDN; fetch.php verifies aspect upstream.
    return;
  }
  // kind === "local"
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

  let localCount = 0;
  let httpsCount = 0;

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
      // Production catalogue occasionally lacks images for a SKU; the page
      // renders with a placeholder. Don't fail the build for this.
      console.warn(`  ⚠ ${f}: no images[] entries (rendering will fall back to placeholder)`);
      continue;
    }
    for (const img of images) {
      const kind = classifyImagePath(img);
      if (kind === "local") localCount += 1;
      else if (kind === "https") httpsCount += 1;
      await checkImage(f, img);
    }
  }

  if (errors > 0) {
    console.error(`\nvalidate-product-images: ${errors} error(s). Failing build.`);
    process.exit(1);
  }
  console.log(
    `validate-product-images: ${localCount} local (1:1 verified), ${httpsCount} https (CDN-trusted, aspect skipped) ✓`,
  );
}

// Only run main() when invoked as a script, not when imported by tests.
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
