import { describe, it, expect } from "vitest";
import {
  niceBounds,
  computePriceBounds,
  parseFilterFromQuery,
  filterToQuery,
  applyFilter,
  isFilterActive,
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
});

describe("parseFilterFromQuery / filterToQuery", () => {
  it("parses empty query as EMPTY_FILTER", () => {
    expect(parseFilterFromQuery(new URLSearchParams())).toEqual(EMPTY_FILTER);
  });

  it("round-trips type / price / instock through serialization", () => {
    const state: FilterState = {
      types: ["wellness", "lingerie"],
      priceMin: 20,
      priceMax: 100,
      inStockOnly: true,
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
      priceMin: 25,
      priceMax: 100,
      inStockOnly: true,
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
  });
});
