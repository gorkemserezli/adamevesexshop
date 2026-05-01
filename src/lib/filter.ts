import type { Locale } from "~/i18n/ui";

export interface FilterState {
  types: string[]; // category ids selected, OR'd
  priceMin: number | null;
  priceMax: number | null;
  inStockOnly: boolean;
}

export const EMPTY_FILTER: FilterState = {
  types: [],
  priceMin: null,
  priceMax: null,
  inStockOnly: false,
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

  if (state.types.length > 0) {
    out.set("type", state.types.join(","));
  }
  if (state.priceMin !== null && state.priceMax !== null) {
    out.set("price", `${state.priceMin}-${state.priceMax}`);
  }
  if (state.inStockOnly) {
    out.set("instock", "1");
  }
  return out;
}

export interface FilterableRecord {
  category_id: string;
  price_value: number;
  sold_out?: boolean;
}

/**
 * Pure predicate. Empty filter state passes everything through.
 */
export function applyFilter<T extends FilterableRecord>(records: T[], state: FilterState): T[] {
  return records.filter((r) => {
    if (state.types.length > 0 && !state.types.includes(r.category_id)) return false;
    if (state.priceMin !== null && r.price_value < state.priceMin) return false;
    if (state.priceMax !== null && r.price_value > state.priceMax) return false;
    if (state.inStockOnly && r.sold_out === true) return false;
    return true;
  });
}

export function isFilterActive(state: FilterState): boolean {
  return (
    state.types.length > 0 ||
    state.priceMin !== null ||
    state.priceMax !== null ||
    state.inStockOnly
  );
}
