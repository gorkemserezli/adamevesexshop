import type { Product, VariantAxis } from "~/content/config";

/**
 * Read PUBLIC_STOCK_API_URL directly from import.meta.env rather than via
 * ~/lib/env. Reason: env.ts module-eval reads non-PUBLIC vars (HOTEL_*,
 * SITE_URL) that don't reach the client bundle, causing every PDP to throw
 * "Missing required env var: HOTEL_MARKETING_URL" at first load. Reading the
 * single PUBLIC_ var directly keeps the client bundle self-contained.
 *
 * Build-time safety rail: if PUBLIC_STOCK_API_URL is unset, Vite inlines
 * `undefined` and the fetch URL constructor throws on first call — which is
 * caught by the existing try/catch and degrades to available_at_boutique. Not
 * as loud as the env.ts throw, but acceptable since the fallback is correct.
 */
const STOCK_API_URL = import.meta.env.PUBLIC_STOCK_API_URL as string;

export type StockStatus = "in_stock" | "last_n" | "sold_out" | "available_at_boutique";

export interface VariantStock {
  status: StockStatus;
  in_stock: number | null;
}

export interface StockResponse {
  sku: string;
  variants: Record<string, VariantStock>;
  fetched_at: string;
}

export const NO_VARIANT_KEY = "_" as const;

const CACHE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 3_000;

interface CacheEntry {
  data: StockResponse;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

export function buildVariantKey(
  axes: VariantAxis[],
  selection: Record<string, string>,
): string {
  if (axes.length === 0) return NO_VARIANT_KEY;
  const parts: string[] = [];
  for (const axis of axes) {
    const optionId = selection[axis.id];
    if (!optionId) {
      throw new Error(`buildVariantKey: missing selection for axis "${axis.id}"`);
    }
    parts.push(optionId);
  }
  return parts.join("__");
}

function fallbackResponse(sku: string, product?: Product): StockResponse {
  const variants: Record<string, VariantStock> = {};
  if (!product || product.variants.length === 0) {
    variants[NO_VARIANT_KEY] = { status: "available_at_boutique", in_stock: null };
  } else {
    walkVariantKeys(product.variants, (key) => {
      variants[key] = { status: "available_at_boutique", in_stock: null };
    });
  }
  return { sku, variants, fetched_at: new Date(0).toISOString() };
}

function walkVariantKeys(axes: VariantAxis[], visit: (key: string) => void): void {
  function recurse(idx: number, parts: string[]): void {
    if (idx === axes.length) {
      visit(parts.join("__"));
      return;
    }
    for (const opt of axes[idx]!.options) {
      recurse(idx + 1, [...parts, opt.id]);
    }
  }
  recurse(0, []);
}

async function fetchStockOne(sku: string, product?: Product): Promise<StockResponse> {
  const cached = cache.get(sku);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }
  try {
    const url = new URL(STOCK_API_URL, window.location.origin);
    url.searchParams.set("sku", sku);
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`stock api: ${res.status}`);
    const payload = (await res.json()) as StockResponse | Record<string, StockResponse>;
    const data = isStockResponse(payload) ? payload : payload[sku];
    if (!data) throw new Error("stock api: missing sku in response");
    cache.set(sku, { data, fetchedAt: Date.now() });
    return data;
  } catch {
    return fallbackResponse(sku, product);
  }
}

function isStockResponse(value: unknown): value is StockResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "sku" in value &&
    "variants" in value
  );
}

export async function fetchStock(
  skus: string[],
  productLookup?: Record<string, Product>,
): Promise<Record<string, StockResponse>> {
  const results = await Promise.all(
    skus.map((sku) => fetchStockOne(sku, productLookup?.[sku])),
  );
  const out: Record<string, StockResponse> = {};
  skus.forEach((sku, i) => {
    out[sku] = results[i]!;
  });
  return out;
}

export function clearStockCache(): void {
  cache.clear();
}
