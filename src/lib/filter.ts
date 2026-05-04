import type { Locale } from "~/i18n/ui";

export type SortKey = "default" | "price-asc" | "price-desc";

export const SORT_KEYS = ["default", "price-asc", "price-desc"] as const;

export function isSortKey(s: unknown): s is SortKey {
  return s === "default" || s === "price-asc" || s === "price-desc";
}

export interface FilterState {
  types: string[]; // category ids selected, OR'd
  subcategoryId: string | null; // single subcategory filter (per-category page)
  priceMin: number | null;
  priceMax: number | null;
  inStockOnly: boolean;
  /**
   * Sort is independent of filter for the v1.2 dropdown — Reset on FilterSheet
   * MUST NOT clear it. URL param `?sort=…` is omitted when "default" so the
   * URL stays clean in the no-op case.
   */
  sort: SortKey;
}

export const EMPTY_FILTER: FilterState = {
  types: [],
  subcategoryId: null,
  priceMin: null,
  priceMax: null,
  inStockOnly: false,
  sort: "default",
};

export function priceStepForLocale(locale: Locale): number {
  return locale === "tr" || locale === "ru" ? 10 : 1;
}

/**
 * Round outward to a "nice" bound at the value's order of magnitude.
 *
 * Algorithm:
 *   - magnitude M = 10^floor(log10(|value|))
 *   - candidates [1*M, 2*M, 5*M, 10*M] — the standard "nice numbers" set
 *   - dir="up": smallest c >= value, then ceil to multiple of step
 *   - dir="down": largest c <= value, then floor to multiple of step
 *
 * For value=0 short-circuit to 0 to avoid log10(0) = -Infinity.
 *
 * Edge case: value < step in min direction returns 0 (e.g., value=1, step=10 → 0).
 * Acceptable for current catalog where min product prices are well above step.
 * If catalog ever ships a sub-step minimum, consider clamping min to max(0, value).
 *
 * FUTURE: if catalog grows and the dead zone right of the actual max becomes prominent
 * (e.g., TR ₺2200 → 5000 leaves ~₺2800 unused space), consider a tighter candidate set
 * like [1, 1.5, 2, 3, 5, 10] at the cost of less-round numbers.
 */
export function niceBounds(value: number, dir: "up" | "down", step: number): number {
  if (value === 0) return 0;
  const abs = Math.abs(value);
  const M = Math.pow(10, Math.floor(Math.log10(abs)));
  const candidates = [1 * M, 2 * M, 5 * M, 10 * M];
  let chosen: number;
  if (dir === "up") {
    chosen = candidates.find((c) => c >= value) ?? candidates[candidates.length - 1]!;
    return Math.ceil(chosen / step) * step;
  } else {
    // dir === "down"
    let pick = candidates[0]!;
    for (const c of candidates) {
      if (c <= value) pick = c;
    }
    return Math.floor(pick / step) * step;
  }
}

export function computePriceBounds(
  values: number[],
  locale: Locale,
): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 0 };
  const step = priceStepForLocale(locale);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  return {
    min: niceBounds(rawMin, "down", step),
    max: niceBounds(rawMax, "up", step),
  };
}

/**
 * Parse a URLSearchParams instance into a FilterState. Tolerant: malformed
 * fields fall back to defaults rather than throw.
 */
export function parseFilterFromQuery(params: URLSearchParams): FilterState {
  const state: FilterState = { ...EMPTY_FILTER, types: [] };

  const typeRaw = params.get("type");
  if (typeRaw) {
    state.types = typeRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^[a-z0-9-]+$/.test(s));
  }

  const priceRaw = params.get("price");
  if (priceRaw) {
    const m = /^(\d+)-(\d+)$/.exec(priceRaw);
    if (m) {
      const lo = Number(m[1]);
      const hi = Number(m[2]);
      if (Number.isFinite(lo) && Number.isFinite(hi) && lo <= hi) {
        state.priceMin = lo;
        state.priceMax = hi;
      }
    }
  }

  if (params.get("instock") === "1") {
    state.inStockOnly = true;
  }

  const subRaw = params.get("sub");
  if (subRaw && /^[a-z0-9-]+$/.test(subRaw)) {
    state.subcategoryId = subRaw;
  }

  const sortRaw = params.get("sort");
  if (sortRaw && isSortKey(sortRaw)) {
    state.sort = sortRaw;
  }

  return state;
}

/**
 * Serialize a FilterState onto a base URLSearchParams (which preserves ?q=).
 * Empty/default fields are stripped — no &type=&price=&instock= artifacts.
 */
export function filterToQuery(state: FilterState, base: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams(base);
  out.delete("type");
  out.delete("price");
  out.delete("instock");
  out.delete("sub");
  out.delete("sort");

  if (state.types.length > 0) {
    out.set("type", state.types.join(","));
  }
  if (state.priceMin !== null && state.priceMax !== null) {
    out.set("price", `${state.priceMin}-${state.priceMax}`);
  }
  if (state.inStockOnly) {
    out.set("instock", "1");
  }
  if (state.subcategoryId !== null) {
    out.set("sub", state.subcategoryId);
  }
  if (state.sort !== "default") {
    out.set("sort", state.sort);
  }
  return out;
}

export interface FilterableRecord {
  category_id: string;
  subcategory_id?: string | null;
  price_value: number;
  sold_out?: boolean;
}

/**
 * Pure predicate. Empty filter state passes everything through.
 */
export function applyFilter<T extends FilterableRecord>(records: T[], state: FilterState): T[] {
  return records.filter((r) => {
    if (state.types.length > 0 && !state.types.includes(r.category_id)) return false;
    if (state.subcategoryId !== null && r.subcategory_id !== state.subcategoryId) return false;
    if (state.priceMin !== null && r.price_value < state.priceMin) return false;
    if (state.priceMax !== null && r.price_value > state.priceMax) return false;
    if (state.inStockOnly && r.sold_out === true) return false;
    return true;
  });
}

export function isFilterActive(state: FilterState): boolean {
  return (
    state.types.length > 0 ||
    state.subcategoryId !== null ||
    state.priceMin !== null ||
    state.priceMax !== null ||
    state.inStockOnly
  );
}

/**
 * Stable sort by key with sold-out partitioning. Returns a new array.
 *
 * Partition rule (v1.2 follow-up): sold-out products always sit AFTER
 * in-stock products regardless of `sort`. The user-selected sort orders
 * within each partition. "default" preserves input order within each
 * partition (callers typically pre-sort alphabetically via name.localeCompare).
 *
 *   sort=default      → [in-stock in input order]  + [sold-out in input order]
 *   sort=price-asc    → [in-stock cheapest→priciest] + [sold-out cheapest→priciest]
 *   sort=price-desc   → [in-stock priciest→cheapest] + [sold-out priciest→cheapest]
 *
 * Records with `sold_out` undefined are treated as in-stock (back-compat
 * with test fixtures that don't carry the field).
 */
export function applySort<T extends FilterableRecord>(records: T[], sort: SortKey): T[] {
  const indexed = records.map((r, idx) => ({ r, idx }));
  const inStock = indexed.filter(({ r }) => r.sold_out !== true);
  const soldOut = indexed.filter(({ r }) => r.sold_out === true);

  const sortPartition = (group: typeof indexed): typeof indexed => {
    if (sort === "default") return group;
    const dir = sort === "price-asc" ? 1 : -1;
    return group.slice().sort((a, b) => {
      const diff = (a.r.price_value - b.r.price_value) * dir;
      return diff !== 0 ? diff : a.idx - b.idx; // stable tiebreak
    });
  };

  return [...sortPartition(inStock), ...sortPartition(soldOut)].map(({ r }) => r);
}
