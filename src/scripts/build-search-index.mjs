#!/usr/bin/env node
/**
 * Prebuild step: emit one MiniSearch-ready document JSON per locale to
 * public/api/search-index-{tr,en,de,ru}.json.
 *
 * Each document record:
 *   { id, slug, sku, name, category, overline, description, curator_note, specs, image, price }
 *   - name has ­ (soft hyphens) stripped per spec line 1056.
 *   - category resolves category_id to the LOCALIZED category name string for
 *     the active locale (per Task 9 Decision 2 fix).
 *   - specs is the joined values of the specs[] array (whitespace-separated).
 *   - sku is included as a non-indexed identifier; the client wrapper does NOT
 *     register it as a search field per Task 9 Decision 2.
 *
 * FUTURE: emit content-hashed filenames (e.g., search-index-en.{hash}.json)
 * and have search.astro inject the hash so the client fetches the current
 * build. Not needed at 6 SKUs; needed before any production content cadence.
 */
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PRODUCTS_DIR = join(ROOT, "src", "content", "products");
const CATEGORIES_FILE = join(ROOT, "src", "content", "categories", "categories.json");
const OUT_DIR = join(ROOT, "public", "api");
const LOCALES = /** @type {const} */ (["tr", "en", "de", "ru"]);

const stripSoft = (s) => (typeof s === "string" ? s.replaceAll("­", "") : s);

async function loadCategories() {
  const raw = await readFile(CATEGORIES_FILE, "utf8");
  /** @type {Array<{id: string, name: Record<string,string>, subcategories?: Array<{id: string, name: Record<string,string>}>}>} */
  const data = JSON.parse(raw);
  const cats = Array.isArray(data) ? data : (data.categories ?? []);
  /** @type {Record<string, Record<string,string>>} */
  const byId = {};
  /** Subcategory id → localized names. */
  /** @type {Record<string, Record<string,string>>} */
  const subById = {};
  for (const c of cats) {
    byId[c.id] = c.name;
    for (const sc of c.subcategories ?? []) {
      subById[sc.id] = sc.name;
    }
  }
  return { byId, subById };
}

async function loadProducts() {
  const files = (await readdir(PRODUCTS_DIR)).filter((f) => f.endsWith(".json"));
  return Promise.all(
    files.map(async (f) => {
      const raw = await readFile(join(PRODUCTS_DIR, f), "utf8");
      return JSON.parse(raw);
    }),
  );
}

function specsJoined(specs, lang) {
  if (!Array.isArray(specs)) return "";
  return specs
    .map((s) => (s && s.value && typeof s.value[lang] === "string" ? s.value[lang] : ""))
    .filter(Boolean)
    .join(" ");
}

async function main() {
  console.log("build-search-index: building per-locale search indexes…");
  const { byId: categoriesById, subById: subcategoriesById } = await loadCategories();
  const products = await loadProducts();
  await mkdir(OUT_DIR, { recursive: true });

  for (const lang of LOCALES) {
    const records = products.map((p) => {
      const catName = categoriesById[p.category_id]?.[lang] ?? "";
      const subName = p.subcategory_id ? subcategoriesById[p.subcategory_id]?.[lang] ?? "" : "";
      return {
        id: p.id,
        slug: p.id,
        sku: p.sku,
        name: stripSoft(p.name?.[lang] ?? ""),
        category: catName,
        category_id: p.category_id,
        subcategory: subName,
        subcategory_id: p.subcategory_id ?? null,
        overline: p.overline?.[lang] ?? "",
        description: p.description?.[lang] ?? "",
        curator_note: p.curator_note?.[lang] ?? "",
        specs: specsJoined(p.specs, lang),
        image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "",
        price_display: p.price?.[lang]?.display ?? "",
        price_value: typeof p.price?.[lang]?.value === "number" ? p.price[lang].value : 0,
        sold_out: Boolean(p.sold_out),
      };
    });
    const json = JSON.stringify(records);
    const outPath = join(OUT_DIR, `search-index-${lang}.json`);
    await writeFile(outPath, json, "utf8");
    const kb = (json.length / 1024).toFixed(1);
    console.log(`  ${lang}: ${records.length} records, ${kb} KB → public/api/search-index-${lang}.json`);
  }
  console.log("build-search-index: done ✓");
}

main().catch((err) => {
  console.error("build-search-index FAILED:", err);
  process.exit(1);
});
