import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildVariantKey, NO_VARIANT_KEY, fetchStock, clearStockCache } from "./stock";
import type { VariantAxis } from "~/content/config";

const L = { tr: "x", en: "x", de: "x", ru: "x" };

const scentAxis: VariantAxis = {
  id: "scent",
  label: L,
  options: [
    { id: "amber-rose", label: L, available: true },
    { id: "sandalwood", label: L, available: true },
    { id: "vetiver", label: L, available: false },
  ],
};

const sizeAxis: VariantAxis = {
  id: "size",
  label: L,
  options: [
    { id: "100ml", label: L, available: true },
    { id: "50ml", label: L, available: true },
  ],
};

describe("buildVariantKey", () => {
  it("returns the option id for a single-axis product", () => {
    const key = buildVariantKey([scentAxis], { scent: "amber-rose" });
    expect(key).toBe("amber-rose");
  });

  it("joins two axes with a double underscore in axis-array order", () => {
    const key = buildVariantKey([scentAxis, sizeAxis], {
      scent: "amber-rose",
      size: "100ml",
    });
    expect(key).toBe("amber-rose__100ml");
  });

  it("uses axis-array order as canonical, not selection-object order", () => {
    const key = buildVariantKey([scentAxis, sizeAxis], {
      size: "100ml",
      scent: "amber-rose",
    });
    expect(key).toBe("amber-rose__100ml");
  });

  it("regression: swapping axis order in the array changes the key", () => {
    const a = buildVariantKey([scentAxis, sizeAxis], {
      scent: "amber-rose",
      size: "100ml",
    });
    const b = buildVariantKey([sizeAxis, scentAxis], {
      scent: "amber-rose",
      size: "100ml",
    });
    expect(a).not.toBe(b);
    expect(a).toBe("amber-rose__100ml");
    expect(b).toBe("100ml__amber-rose");
  });

  it("returns the sentinel '_' for a no-variant product", () => {
    const key = buildVariantKey([], {});
    expect(key).toBe(NO_VARIANT_KEY);
    expect(key).toBe("_");
  });

  it("throws if a selection is missing for an axis", () => {
    expect(() =>
      buildVariantKey([scentAxis, sizeAxis], { scent: "amber-rose" }),
    ).toThrow(/missing selection for axis "size"/);
  });
});

describe("fetchStock — 60s cache", () => {
  const originalFetch = globalThis.fetch;
  const sampleResponse = {
    sku: "AE-TEST-1",
    variants: { _: { status: "in_stock", in_stock: 5 } },
    fetched_at: "2026-04-29T08:00:00Z",
  };

  beforeEach(() => {
    clearStockCache();
    vi.useFakeTimers();
    Object.defineProperty(globalThis, "window", {
      value: { location: { origin: "http://test.local" } },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = originalFetch;
  });

  it("issues exactly one network call when fetchStock is invoked twice within 60s", async () => {
    const mock = vi.fn(async () =>
      new Response(JSON.stringify(sampleResponse), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    globalThis.fetch = mock as typeof fetch;

    await fetchStock(["AE-TEST-1"]);
    await fetchStock(["AE-TEST-1"]);
    await fetchStock(["AE-TEST-1"]);

    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after the 60s TTL elapses", async () => {
    const mock = vi.fn(async () =>
      new Response(JSON.stringify(sampleResponse), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    globalThis.fetch = mock as typeof fetch;

    await fetchStock(["AE-TEST-1"]);
    expect(mock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_001);
    await fetchStock(["AE-TEST-1"]);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("falls back to available_at_boutique on network rejection", async () => {
    globalThis.fetch = (vi.fn(async () => {
      throw new Error("network down");
    }) as unknown) as typeof fetch;

    const result = await fetchStock(["AE-TEST-1"]);
    expect(result["AE-TEST-1"]?.variants["_"]?.status).toBe("available_at_boutique");
  });
});
