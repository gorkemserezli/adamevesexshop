import { describe, it, expect, beforeEach } from "vitest";
import {
  searchProducts,
  clearSearchCache,
  normalizeForLocale,
  __installIndexForTest,
  type SearchRecord,
} from "./search";

const enRecords: SearchRecord[] = [
  {
    id: "warming-massage-oil",
    slug: "warming-massage-oil",
    sku: "AE-WMO-100",
    name: "Warming Massage Oil",
    category: "Wellness",
    category_id: "wellness",
    subcategory: "Massage Oils",
    subcategory_id: "massage-oils",
    overline: "Wellness · Oil",
    description: "An oil to slow you down — to map your body and your partner's at a softer tempo.",
    curator_note: "For candlelight.",
    specs: "100 ml France Sweet almond, jojoba",
    image: "/products/placeholder.jpg",
    price_display: "$ 24.00",
    price_value: 24,
    sold_out: false,
  },
  {
    id: "lace-robe",
    slug: "lace-robe",
    sku: "AE-LR-001",
    name: "Lace Robe",
    category: "Lingerie",
    category_id: "lingerie",
    subcategory: "Robes",
    subcategory_id: "robes",
    overline: "Lingerie · Robe",
    description: "Sheer black lace.",
    curator_note: "For morning coffee.",
    specs: "Turkey Hand-wash",
    image: "/products/placeholder.jpg",
    price_display: "$ 38.00",
    price_value: 38,
    sold_out: false,
  },
];

const trRecords: SearchRecord[] = [
  {
    id: "test-istanbul",
    slug: "test-istanbul",
    sku: "AE-TST-1",
    name: "İSTANBUL Edition",
    category: "Aksesuarlar",
    category_id: "accessories",
    subcategory: "",
    subcategory_id: null,
    overline: "Test",
    description: "Test product made in İstanbul.",
    curator_note: "",
    specs: "",
    image: "/products/placeholder.jpg",
    price_display: "0 ₺",
    price_value: 0,
    sold_out: false,
  },
];

const ruRecords: SearchRecord[] = [
  {
    id: "test-yolka",
    slug: "test-yolka",
    sku: "AE-TST-2",
    name: "Ёлка",
    category: "Подарки",
    category_id: "gifts",
    subcategory: "",
    subcategory_id: null,
    overline: "Тест",
    description: "Тестовая ёлка.",
    curator_note: "",
    specs: "",
    image: "/products/placeholder.jpg",
    price_display: "0 ₽",
    price_value: 0,
    sold_out: false,
  },
  {
    id: "test-elka-plain",
    slug: "test-elka-plain",
    sku: "AE-TST-3",
    name: "Елка обычная",
    category: "Подарки",
    category_id: "gifts",
    subcategory: "",
    subcategory_id: null,
    overline: "Тест",
    description: "",
    curator_note: "",
    specs: "",
    image: "/products/placeholder.jpg",
    price_display: "0 ₽",
    price_value: 0,
    sold_out: false,
  },
];

beforeEach(() => {
  clearSearchCache();
});

describe("normalizeForLocale", () => {
  it("TR: İ lowercases to i with tr-TR locale", () => {
    expect(normalizeForLocale("İSTANBUL", "tr")).toBe("istanbul");
  });

  it("TR: turkish accents stripped", () => {
    expect(normalizeForLocale("Türkçe", "tr")).toBe("turkce");
  });

  it("RU: ё normalized to е", () => {
    expect(normalizeForLocale("Ёлка", "ru")).toBe("елка");
    expect(normalizeForLocale("ёлка", "ru")).toBe("елка");
  });

  it("EN: combining accents stripped", () => {
    expect(normalizeForLocale("café", "en")).toBe("cafe");
  });

  it("normalize is stable on already-clean text (soft hyphens stripped at build)", () => {
    // Build emits text without ­ per the build-search-index.mjs strip step.
    // Confirm normalize handles the post-strip form cleanly.
    const out = normalizeForLocale("Wärmendes", "de");
    expect(out).toBe("warmendes");
  });
});

describe("searchProducts", () => {
  it("EN: exact match by name", async () => {
    __installIndexForTest("en", enRecords);
    const results = await searchProducts("massage oil", "en");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.id).toBe("warming-massage-oil");
  });

  it("EN: prefix match", async () => {
    __installIndexForTest("en", enRecords);
    const results = await searchProducts("mass", "en");
    expect(results.some((r) => r.id === "warming-massage-oil")).toBe(true);
  });

  it("EN: fuzzy match (typo)", async () => {
    __installIndexForTest("en", enRecords);
    const results = await searchProducts("masage", "en");
    expect(results.some((r) => r.id === "warming-massage-oil")).toBe(true);
  });

  it("EN: category search hits localized category string", async () => {
    __installIndexForTest("en", enRecords);
    const results = await searchProducts("wellness", "en");
    expect(results.some((r) => r.id === "warming-massage-oil")).toBe(true);
  });

  it("EN: empty query returns []", async () => {
    __installIndexForTest("en", enRecords);
    expect(await searchProducts("", "en")).toEqual([]);
    expect(await searchProducts("   ", "en")).toEqual([]);
  });

  it("EN: no-match returns []", async () => {
    __installIndexForTest("en", enRecords);
    expect(await searchProducts("xyzqq", "en")).toEqual([]);
  });

  it("locale isolation: EN index does not surface RU records", async () => {
    __installIndexForTest("en", enRecords);
    __installIndexForTest("ru", ruRecords);
    const enHits = await searchProducts("ёлка", "en");
    expect(enHits.every((r) => r.id !== "test-yolka")).toBe(true);
  });

  it("TR: İSTANBUL ↔ istanbul round-trip", async () => {
    __installIndexForTest("tr", trRecords);
    const results = await searchProducts("istanbul", "tr");
    expect(results.some((r) => r.id === "test-istanbul")).toBe(true);
  });

  it("RU: query 'елка' matches indexed 'ёлка'", async () => {
    __installIndexForTest("ru", ruRecords);
    const results = await searchProducts("елка", "ru");
    expect(results.some((r) => r.id === "test-yolka")).toBe(true);
  });

  it("RU: query 'ёлка' also matches plain 'Елка обычная' (round-trip)", async () => {
    __installIndexForTest("ru", ruRecords);
    const results = await searchProducts("ёлка", "ru");
    const ids = results.map((r) => r.id);
    expect(ids).toContain("test-yolka");
    expect(ids).toContain("test-elka-plain");
  });

  it("respects limit", async () => {
    __installIndexForTest("en", enRecords);
    const results = await searchProducts("a", "en", 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });
});
