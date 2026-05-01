/**
 * Schema acceptance test: feed a production-shape product JSON (matching what
 * fetch.php pushes daily) through productSchema and assert it round-trips.
 *
 * Anchors the schema to the contract documented in fetch.php's catalog dump.
 * If fetch.php's shape ever changes, this fixture stays the canonical record
 * of what the schema must accept; if the schema ever drifts, this test fails.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { productSchema } from "./schema";

const HERE = dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = join(HERE, "products");

const productionFixture = {
  id: "a8-uzaktan-kumandali-teleskopik-seks-makinesi",
  sku: "PT-DVXD338",
  category_id: "dildo",
  subcategory_id: "seks-makinasi",
  sold_out: true,
  name: {
    tr: "A8 Uzaktan Kumandalı Teleskopik Seks Makinesi",
    en: "A8 Telescopic Sex Machine with Remote Control",
    de: "A8 Ferngesteuerte Teleskopsexmaschine",
    ru: "Телескопическая секс-машина A8 с дистанционным управлением",
  },
  overline: { tr: "DİLDO", en: "DILDO", de: "DILDO", ru: "DILDO" },
  description: {
    tr: "Pembe Tilki A8; kompakt gövdesi, güçlü teleskopik hareketi ve sessiz çalışmasıyla evde konforlu kullanım için tasarlanmış gelişmiş bir seks makinesidir.",
    en: "Pink Fox A8 is an advanced sex machine designed for comfortable use at home.",
    de: "Pink Fox A8 ist eine fortschrittliche Sexmaschine.",
    ru: "Pink Fox A8 - это усовершенствованная секс-машина.",
  },
  curator_note: null,
  price: {
    tr: { value: 201.78, currency: "EUR" },
    en: { value: 201.78, currency: "EUR" },
    de: { value: 201.78, currency: "EUR" },
    ru: { value: 201.78, currency: "EUR" },
  },
  images: [
    "https://cdn1.xmlbankasi.com/p1/sxzbwszkqehn/image/data/resimler/-5104.jpg",
  ],
  variants: [],
  specs: [
    {
      label: { tr: "Marka", en: "Brand", de: "Marke", ru: "Бренд" },
      value: { tr: "Pembe Tilki", en: "Pembe Tilki", de: "Pembe Tilki", ru: "Pembe Tilki" },
    },
    {
      label: { tr: "Boyut", en: "Size", de: "Größe", ru: "Размер" },
      value: { tr: "28 × 38 × 21 cm", en: "28 × 38 × 21 cm", de: "28 × 38 × 21 cm", ru: "28 × 38 × 21 см" },
    },
  ],
};

describe("productSchema (production-shape contract)", () => {
  it("accepts the canonical fetch.php fixture without modification", () => {
    const result = productSchema.safeParse(productionFixture);
    if (!result.success) {
      console.error(result.error.issues);
    }
    expect(result.success).toBe(true);
  });

  it("accepts curator_note: null (production never carries notes)", () => {
    const result = productSchema.safeParse({ ...productionFixture, curator_note: null });
    expect(result.success).toBe(true);
  });

  it("does NOT require sort_order (removed)", () => {
    expect(productSchema.safeParse(productionFixture).success).toBe(true);
  });

  it("does NOT require made_in (removed)", () => {
    expect(productSchema.safeParse(productionFixture).success).toBe(true);
    expect("made_in" in productionFixture).toBe(false);
  });

  it("does NOT require price.{locale}.display (computed at render time)", () => {
    const noDisplay = JSON.parse(JSON.stringify(productionFixture));
    for (const loc of ["tr", "en", "de", "ru"] as const) {
      expect("display" in noDisplay.price[loc]).toBe(false);
    }
    expect(productSchema.safeParse(noDisplay).success).toBe(true);
  });

  it("specs are { label, value } both localized — no key field", () => {
    const result = productSchema.safeParse(productionFixture);
    expect(result.success).toBe(true);
    if (result.success) {
      for (const s of result.data.specs) {
        expect(typeof s.label.tr).toBe("string");
        expect(typeof s.value.tr).toBe("string");
        expect("key" in s).toBe(false);
      }
    }
  });

  it("accepts long descriptions (>800 chars) per Entegra long-form HTML", () => {
    const longText = "x".repeat(2500);
    const fixture = {
      ...productionFixture,
      description: { tr: longText, en: longText, de: longText, ru: longText },
    };
    expect(productSchema.safeParse(fixture).success).toBe(true);
  });

  it("rejects legacy v1.0 sample shape (display + key + sort_order + made_in)", () => {
    const legacy = {
      ...productionFixture,
      sort_order: 10,
      made_in: "TR",
      curator_note: { tr: "x", en: "x", de: "x", ru: "x" },
      price: {
        tr: { value: 24, currency: "TRY", display: "₺24,00" },
        en: { value: 1, currency: "USD", display: "$1.00" },
        de: { value: 1, currency: "EUR", display: "€1,00" },
        ru: { value: 1, currency: "RUB", display: "1 ₽" },
      },
      specs: [{ key: "brand", label: { tr: "M", en: "M", de: "M", ru: "M" }, value: { tr: "X", en: "X", de: "X", ru: "X" } }],
    };
    // strict() mode rejects unknown fields like sort_order/made_in/display/key.
    expect(productSchema.safeParse(legacy).success).toBe(false);
  });

  it("every product file in src/content/products/ parses against the schema", () => {
    const files = readdirSync(PRODUCTS_DIR).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThan(0);
    const failures: { file: string; issues: unknown }[] = [];
    for (const f of files) {
      const raw = readFileSync(join(PRODUCTS_DIR, f), "utf8");
      const data = JSON.parse(raw);
      const r = productSchema.safeParse(data);
      if (!r.success) failures.push({ file: f, issues: r.error.issues });
    }
    if (failures.length > 0) {
      console.error("Schema failures:", JSON.stringify(failures.slice(0, 3), null, 2));
    }
    expect(failures).toEqual([]);
  });
});
