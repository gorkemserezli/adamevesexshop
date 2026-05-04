import { describe, it, expect } from "vitest";
import {
  niceBounds,
  computePriceBounds,
  parseFilterFromQuery,
  filterToQuery,
  applyFilter,
  applySort,
  isFilterActive,
  isSortKey,
  EMPTY_FILTER,
  type FilterState,
  type FilterableRecord,
} from "./filter";

describe("niceBounds — locked table", () => {
  it("0 → 0 in both directions for both step sizes", () => {
    expect(niceBounds(0, "up", 1)).toBe(0);
    expect(niceBounds(0, "down", 1)).toBe(0);
    expect(niceBounds(0, "up", 10)).toBe(0);
    expect(niceBounds(0, "down", 10)).toBe(0);
  });

  it("EN/DE step 1 — max direction (round up)", () => {
    expect(niceBounds(1, "up", 1)).toBe(1);
    expect(niceBounds(24, "up", 1)).toBe(50);
    expect(niceBounds(89, "up", 1)).toBe(100);
    expect(niceBounds(100, "up", 1)).toBe(100);
    expect(niceBounds(4750, "up", 1)).toBe(5000);
    expect(niceBounds(100000, "up", 1)).toBe(100000);
  });

  it("EN/DE step 1 — min direction (round down)", () => {
    expect(niceBounds(1, "down", 1)).toBe(1);
    expect(niceBounds(24, "down", 1)).toBe(20);
    expect(niceBounds(89, "down", 1)).toBe(50);
    expect(niceBounds(100, "down", 1)).toBe(100);
    expect(niceBounds(4750, "down", 1)).toBe(2000);
    expect(niceBounds(100000, "down", 1)).toBe(100000);
  });

  it("TR/RU step 10 — max direction", () => {
    expect(niceBounds(1, "up", 10)).toBe(10);
    expect(niceBounds(24, "up", 10)).toBe(50);
    expect(niceBounds(89, "up", 10)).toBe(100);
    expect(niceBounds(100, "up", 10)).toBe(100);
    expect(niceBounds(4750, "up", 10)).toBe(5000);
    expect(niceBounds(100000, "up", 10)).toBe(100000);
  });

  it("TR/RU step 10 — min direction (documented edge case for value < step)", () => {
    expect(niceBounds(1, "down", 10)).toBe(0); // documented: <step → 0
    expect(niceBounds(24, "down", 10)).toBe(20);
    expect(niceBounds(89, "down", 10)).toBe(50);
    expect(niceBounds(100, "down", 10)).toBe(100);
    expect(niceBounds(4750, "down", 10)).toBe(2000);
    expect(niceBounds(100000, "down", 10)).toBe(100000);
  });

  it("computePriceBounds with empty input returns 0/0", () => {
    expect(computePriceBounds([], "en")).toEqual({ min: 0, max: 0 });
  });

  it("computePriceBounds matches per-locale step", () => {
    expect(computePriceBounds([24, 95], "en")).toEqual({ min: 20, max: 100 });
    expect(computePriceBounds([24, 95], "tr")).toEqual({ min: 20, max: 100 });
    expect(computePriceBounds([2200], "tr")).toEqual({ min: 2000, max: 5000 });
  });

  it("computePriceBounds — production catalog (10–300 EUR spread)", () => {
    // Sampled real prices from src/content/products/*.json (EUR locale 'en'/'de').
    // Slider has to span 10 → 287 → bounds round to 10/500.
    const real = [13.13, 7.8, 24, 95.5, 201.78, 287.1, 12.5];
    expect(computePriceBounds(real, "en")).toEqual({ min: 5, max: 500 });
    expect(computePriceBounds(real, "de")).toEqual({ min: 5, max: 500 });
  });

  it("computePriceBounds — per-category subset is tighter than full catalog", () => {
    const fullCatalog = [7, 13, 50, 95, 201, 287];
    const oneCategory = [13, 50, 95];
    const full = computePriceBounds(fullCatalog, "en");
    const cat = computePriceBounds(oneCategory, "en");
    // Subset's max bound must not exceed the full catalog's max bound, and
    // typically lands tighter — that's the user-visible behaviour fix for Bug 1.
    expect(cat.max).toBeLessThanOrEqual(full.max);
    expect(cat).toEqual({ min: 10, max: 100 });
    expect(full).toEqual({ min: 5, max: 500 });
  });

  it("computePriceBounds — single-product category collapses to a tight band", () => {
    expect(computePriceBounds([42], "en")).toEqual({ min: 20, max: 50 });
  });
});

describe("parseFilterFromQuery / filterToQuery", () => {
  it("parses empty query as EMPTY_FILTER", () => {
    expect(parseFilterFromQuery(new URLSearchParams())).toEqual(EMPTY_FILTER);
  });

  it("round-trips type / price / instock through serialization", () => {
    const state: FilterState = {
      types: ["wellness", "lingerie"],
      subcategoryId: null,
      priceMin: 20,
      priceMax: 100,
      inStockOnly: true,
      sort: "default",
    };
    const base = new URLSearchParams("q=oil");
    const q = filterToQuery(state, base);
    expect(q.get("q")).toBe("oil");
    expect(q.get("type")).toBe("wellness,lingerie");
    expect(q.get("price")).toBe("20-100");
    expect(q.get("instock")).toBe("1");
    const round = parseFilterFromQuery(q);
    expect(round).toEqual(state);
  });

  it("EMPTY_FILTER round-trip produces a clean URL — no empty params", () => {
    const base = new URLSearchParams("q=oil");
    const q = filterToQuery(EMPTY_FILTER, base);
    expect(q.toString()).toBe("q=oil");
    expect(q.get("type")).toBeNull();
    expect(q.get("price")).toBeNull();
    expect(q.get("instock")).toBeNull();
  });

  it("rejects malformed type entries", () => {
    const q = new URLSearchParams("type=Wellness,bad value,LiNGERIE,lingerie");
    expect(parseFilterFromQuery(q).types).toEqual(["lingerie"]);
  });

  it("rejects malformed price ranges", () => {
    expect(parseFilterFromQuery(new URLSearchParams("price=foo")).priceMin).toBeNull();
    expect(parseFilterFromQuery(new URLSearchParams("price=100-50")).priceMin).toBeNull(); // lo > hi
    expect(parseFilterFromQuery(new URLSearchParams("price=20-100")).priceMin).toBe(20);
  });

  it("only treats instock=1 as truthy", () => {
    expect(parseFilterFromQuery(new URLSearchParams("instock=1")).inStockOnly).toBe(true);
    expect(parseFilterFromQuery(new URLSearchParams("instock=0")).inStockOnly).toBe(false);
    expect(parseFilterFromQuery(new URLSearchParams("instock=true")).inStockOnly).toBe(false);
  });
});

describe("applyFilter", () => {
  const records: FilterableRecord[] = [
    { category_id: "wellness", price_value: 24, sold_out: false },
    { category_id: "wellness", price_value: 95, sold_out: false },
    { category_id: "lingerie", price_value: 38, sold_out: false },
    { category_id: "wellness", price_value: 27, sold_out: true },
  ];

  it("empty filter passes all records", () => {
    expect(applyFilter(records, EMPTY_FILTER)).toEqual(records);
  });

  it("type filter is OR across selected categories", () => {
    const out = applyFilter(records, { ...EMPTY_FILTER, types: ["wellness"] });
    expect(out.length).toBe(3);
  });

  it("multi-type filter combines as OR", () => {
    const out = applyFilter(records, { ...EMPTY_FILTER, types: ["wellness", "lingerie"] });
    expect(out.length).toBe(4);
  });

  it("price range is inclusive on both ends", () => {
    const out = applyFilter(records, { ...EMPTY_FILTER, priceMin: 24, priceMax: 38 });
    expect(out.map((r) => r.price_value).sort()).toEqual([24, 27, 38]);
  });

  it("inStockOnly drops sold_out=true", () => {
    const out = applyFilter(records, { ...EMPTY_FILTER, inStockOnly: true });
    expect(out.length).toBe(3);
    expect(out.every((r) => r.sold_out !== true)).toBe(true);
  });

  it("filters compose as AND", () => {
    const out = applyFilter(records, {
      types: ["wellness"],
      subcategoryId: null,
      priceMin: 25,
      priceMax: 100,
      inStockOnly: true,
      sort: "default",
    });
    expect(out.length).toBe(1);
    expect(out[0]?.price_value).toBe(95);
  });
});

describe("isFilterActive", () => {
  it("EMPTY_FILTER is inactive", () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
  });

  it("any filled field flips it active", () => {
    expect(isFilterActive({ ...EMPTY_FILTER, types: ["wellness"] })).toBe(true);
    expect(isFilterActive({ ...EMPTY_FILTER, priceMin: 0, priceMax: 100 })).toBe(true);
    expect(isFilterActive({ ...EMPTY_FILTER, inStockOnly: true })).toBe(true);
    expect(isFilterActive({ ...EMPTY_FILTER, subcategoryId: "masaj-yaglari" })).toBe(true);
  });
});

describe("subcategoryId — Task 13", () => {
  it("?sub= round-trips through serialize+parse", () => {
    const state: FilterState = { ...EMPTY_FILTER, subcategoryId: "masaj-yaglari" };
    const q = filterToQuery(state, new URLSearchParams("q=oil"));
    expect(q.get("sub")).toBe("masaj-yaglari");
    expect(q.get("q")).toBe("oil");
    expect(parseFilterFromQuery(q).subcategoryId).toBe("masaj-yaglari");
  });

  it("null subcategoryId produces no &sub= param (clean URL)", () => {
    const q = filterToQuery(EMPTY_FILTER, new URLSearchParams("q=oil"));
    expect(q.get("sub")).toBeNull();
    expect(q.toString()).toBe("q=oil");
  });

  it("applyFilter — subcategory predicate filters correctly", () => {
    const records: FilterableRecord[] = [
      { category_id: "kadin-cinsel-saglik-urunu", subcategory_id: "masaj-yaglari", price_value: 24 },
      { category_id: "kadin-cinsel-saglik-urunu", subcategory_id: "vajina-bakim-urunleri", price_value: 18 },
      { category_id: "fantezi-fetis-urunu", subcategory_id: "giyilebilir-urun", price_value: 49 },
    ];
    const out = applyFilter(records, { ...EMPTY_FILTER, subcategoryId: "masaj-yaglari" });
    expect(out.length).toBe(1);
    expect(out[0]?.subcategory_id).toBe("masaj-yaglari");
  });

  it("applyFilter — subcategory + price intersect (AND)", () => {
    const records: FilterableRecord[] = [
      { category_id: "fantezi-fetis-urunu", subcategory_id: "giyilebilir-urun", price_value: 49 },
      { category_id: "fantezi-fetis-urunu", subcategory_id: "giyilebilir-urun", price_value: 200 },
      { category_id: "fantezi-fetis-urunu", subcategory_id: "fantezi-giyim", price_value: 49 },
    ];
    const out = applyFilter(records, {
      ...EMPTY_FILTER,
      subcategoryId: "giyilebilir-urun",
      priceMin: 0,
      priceMax: 100,
    });
    expect(out.length).toBe(1);
    expect(out[0]?.price_value).toBe(49);
  });

  it("malformed ?sub= rejected by parse", () => {
    expect(parseFilterFromQuery(new URLSearchParams("sub=Bad Value")).subcategoryId).toBeNull();
    expect(parseFilterFromQuery(new URLSearchParams("sub=ALLCAPS")).subcategoryId).toBeNull();
    expect(parseFilterFromQuery(new URLSearchParams("sub=valid-slug")).subcategoryId).toBe("valid-slug");
  });
});

describe("sort — v1.2 dropdown", () => {
  it("isSortKey accepts the three keys, rejects everything else", () => {
    expect(isSortKey("default")).toBe(true);
    expect(isSortKey("price-asc")).toBe(true);
    expect(isSortKey("price-desc")).toBe(true);
    expect(isSortKey("name-asc")).toBe(false);
    expect(isSortKey(undefined)).toBe(false);
    expect(isSortKey(123)).toBe(false);
  });

  it("EMPTY_FILTER carries sort: 'default' and serialises to a clean URL", () => {
    expect(EMPTY_FILTER.sort).toBe("default");
    const q = filterToQuery(EMPTY_FILTER, new URLSearchParams());
    expect(q.get("sort")).toBeNull();
    expect(q.toString()).toBe("");
  });

  it("?sort=price-asc round-trips through parse + serialize", () => {
    const parsed = parseFilterFromQuery(new URLSearchParams("sort=price-asc"));
    expect(parsed.sort).toBe("price-asc");
    const q = filterToQuery(parsed, new URLSearchParams());
    expect(q.get("sort")).toBe("price-asc");
  });

  it("?sort=price-desc round-trips and survives locale-style query base", () => {
    const parsed = parseFilterFromQuery(new URLSearchParams("q=oil&sort=price-desc"));
    expect(parsed.sort).toBe("price-desc");
    const q = filterToQuery(parsed, new URLSearchParams("q=oil"));
    expect(q.get("q")).toBe("oil");
    expect(q.get("sort")).toBe("price-desc");
  });

  it("malformed ?sort= falls back to default", () => {
    expect(parseFilterFromQuery(new URLSearchParams("sort=garbage")).sort).toBe("default");
    expect(parseFilterFromQuery(new URLSearchParams("sort=")).sort).toBe("default");
  });

  it("isFilterActive ignores sort — Reset on FilterSheet must not clear it", () => {
    expect(isFilterActive({ ...EMPTY_FILTER, sort: "price-asc" })).toBe(false);
    expect(isFilterActive({ ...EMPTY_FILTER, sort: "price-desc" })).toBe(false);
  });

  it("applySort price-asc orders ascending; price-desc descending; default no-op", () => {
    const records: FilterableRecord[] = [
      { category_id: "x", price_value: 100 },
      { category_id: "x", price_value: 25 },
      { category_id: "x", price_value: 60 },
    ];
    expect(applySort(records, "price-asc").map((r) => r.price_value)).toEqual([25, 60, 100]);
    expect(applySort(records, "price-desc").map((r) => r.price_value)).toEqual([100, 60, 25]);
    expect(applySort(records, "default").map((r) => r.price_value)).toEqual([100, 25, 60]);
  });

  it("applySort is stable — equal price_value preserves input order", () => {
    const records: FilterableRecord[] = [
      { category_id: "a", price_value: 50 },
      { category_id: "b", price_value: 50 },
      { category_id: "c", price_value: 50 },
    ];
    expect(applySort(records, "price-asc").map((r) => r.category_id)).toEqual(["a", "b", "c"]);
    expect(applySort(records, "price-desc").map((r) => r.category_id)).toEqual(["a", "b", "c"]);
  });

  it("filter + sort compose: filtered records are then sorted by price", () => {
    const records: FilterableRecord[] = [
      { category_id: "x", price_value: 100, sold_out: false },
      { category_id: "y", price_value: 30, sold_out: false },
      { category_id: "x", price_value: 70, sold_out: true },
      { category_id: "x", price_value: 25, sold_out: false },
    ];
    const filtered = applyFilter(records, { ...EMPTY_FILTER, types: ["x"], inStockOnly: true });
    const sorted = applySort(filtered, "price-asc");
    expect(sorted.map((r) => r.price_value)).toEqual([25, 100]);
  });
});

describe("applySort — sold-out partition (v1.2 follow-up)", () => {
  /**
   * Sold-out products always sit AFTER in-stock products regardless of the
   * user-selected sort. Within each partition, the user sort applies; "default"
   * preserves input order within each partition.
   */
  it("default: in-stock keeps input order, sold-out appended in input order", () => {
    const records: FilterableRecord[] = [
      { category_id: "x", price_value: 100, sold_out: true },
      { category_id: "x", price_value: 50, sold_out: false },
      { category_id: "x", price_value: 200, sold_out: true },
      { category_id: "x", price_value: 30, sold_out: false },
    ];
    const out = applySort(records, "default");
    expect(out.map((r) => r.price_value)).toEqual([50, 30, 100, 200]);
    expect(out.map((r) => Boolean(r.sold_out))).toEqual([false, false, true, true]);
  });

  it("price-asc: each partition sorted ascending; sold-out band sits after in-stock band", () => {
    const records: FilterableRecord[] = [
      { category_id: "x", price_value: 100, sold_out: false },
      { category_id: "x", price_value: 50, sold_out: true },
      { category_id: "x", price_value: 30, sold_out: false },
      { category_id: "x", price_value: 200, sold_out: true },
    ];
    expect(applySort(records, "price-asc").map((r) => r.price_value)).toEqual([30, 100, 50, 200]);
  });

  it("price-desc: each partition sorted descending; sold-out band still trails", () => {
    const records: FilterableRecord[] = [
      { category_id: "x", price_value: 100, sold_out: false },
      { category_id: "x", price_value: 50, sold_out: true },
      { category_id: "x", price_value: 30, sold_out: false },
      { category_id: "x", price_value: 200, sold_out: true },
    ];
    expect(applySort(records, "price-desc").map((r) => r.price_value)).toEqual([100, 30, 200, 50]);
  });

  it("REGRESSION: a cheap sold-out product never beats an expensive in-stock product on price-asc", () => {
    // The motivating scenario: the cheapest item in the catalog might be
    // sold out. Without partition, price-asc puts it first — guests tap a
    // €10 listing only to find it unavailable. With partition, even the
    // €10 sold-out sits AFTER every in-stock listing.
    const records: FilterableRecord[] = [
      { category_id: "x", price_value: 10, sold_out: true },
      { category_id: "x", price_value: 999, sold_out: false },
    ];
    const out = applySort(records, "price-asc");
    expect(out[0]?.sold_out).toBe(false);
    expect(out[0]?.price_value).toBe(999);
  });

  it("partition is stable: ties within a partition preserve input order", () => {
    const records: FilterableRecord[] = [
      { category_id: "a", price_value: 50, sold_out: false },
      { category_id: "b", price_value: 50, sold_out: false },
      { category_id: "c", price_value: 50, sold_out: true },
      { category_id: "d", price_value: 50, sold_out: true },
    ];
    expect(applySort(records, "price-asc").map((r) => r.category_id)).toEqual(["a", "b", "c", "d"]);
    expect(applySort(records, "price-desc").map((r) => r.category_id)).toEqual(["a", "b", "c", "d"]);
  });

  it("treats undefined sold_out as in-stock (back-compat with older fixtures)", () => {
    const records: FilterableRecord[] = [
      { category_id: "x", price_value: 100 },
      { category_id: "x", price_value: 50, sold_out: true },
      { category_id: "x", price_value: 30 },
    ];
    const out = applySort(records, "price-asc");
    expect(out.map((r) => r.price_value)).toEqual([30, 100, 50]);
  });

  it("inStockOnly + sort still works as expected (sold-out filtered out before partition)", () => {
    const records: FilterableRecord[] = [
      { category_id: "x", price_value: 100, sold_out: false },
      { category_id: "x", price_value: 25, sold_out: false },
      { category_id: "x", price_value: 5, sold_out: true },
    ];
    const filtered = applyFilter(records, { ...EMPTY_FILTER, inStockOnly: true });
    const sorted = applySort(filtered, "price-asc");
    expect(sorted.map((r) => r.price_value)).toEqual([25, 100]);
  });
});
