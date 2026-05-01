import MiniSearch from "minisearch";
import type { Locale } from "~/i18n/ui";

export interface SearchRecord {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: string;
  category_id: string;
  overline: string;
  description: string;
  curator_note: string;
  specs: string;
  image: string;
  price_display: string;
  price_value: number;
  sold_out: boolean;
}

export interface SearchResult extends SearchRecord {
  score: number;
}

const INDEX_TTL_MS = 60_000;

interface IndexCacheEntry {
  data: SearchRecord[];
  ms: MiniSearch<SearchRecord>;
  fetchedAt: number;
}

const cache = new Map<Locale, IndexCacheEntry>();

/**
 * Locale-aware text normalization for indexing and querying. Same function
 * used at both ends so the round-trip lines up.
 *
 * - NFC normalize.
 * - Strip combining marks (\p{Mn}) for accent-insensitive matching.
 * - Lowercase via String.prototype.toLocaleLowerCase(localeBCP).
 *   - TR: 'tr-TR' so İ → i (locale-correct dotless/dotted casing).
 * - RU: ё → е before lowercasing so users typing "елка" match "ёлка".
 *
 * MiniSearch passes a string per term; we apply the same normalization both
 * at index time (indexed text gets tokenized then run through this) and at
 * query time (query string runs through this before MiniSearch tokenizes).
 */
export function normalizeForLocale(text: string, locale: Locale): string {
  if (typeof text !== "string" || text.length === 0) return "";
  const bcp = locale === "tr" ? "tr-TR" : locale === "ru" ? "ru-RU" : locale === "de" ? "de-DE" : "en-US";
  let s = text.normalize("NFC");
  if (locale === "ru") {
    s = s.replaceAll("ё", "е").replaceAll("Ё", "Е");
  }
  s = s.toLocaleLowerCase(bcp);
  // Strip combining marks for accent-insensitivity.
  s = s.normalize("NFD").replace(/\p{Mn}+/gu, "").normalize("NFC");
  return s;
}

function buildMiniSearch(records: SearchRecord[], locale: Locale): MiniSearch<SearchRecord> {
  const ms = new MiniSearch<SearchRecord>({
    idField: "id",
    fields: ["name", "category", "overline", "description", "specs", "curator_note"],
    storeFields: [
      "id",
      "slug",
      "sku",
      "name",
      "category",
      "category_id",
      "overline",
      "description",
      "curator_note",
      "specs",
      "image",
      "price_display",
      "price_value",
      "sold_out",
    ],
    tokenize: (text) => text.split(/[\s,;.·—–-]+/u).filter(Boolean),
    processTerm: (term) => normalizeForLocale(term, locale),
    searchOptions: {
      boost: {
        name: 4,
        category: 2,
        overline: 2,
        description: 1,
        specs: 1,
        curator_note: 0.5,
      },
      prefix: true,
      fuzzy: 0.2,
      processTerm: (term) => normalizeForLocale(term, locale),
    },
  });
  ms.addAll(records);
  return ms;
}

async function loadIndex(locale: Locale): Promise<IndexCacheEntry> {
  const cached = cache.get(locale);
  if (cached && Date.now() - cached.fetchedAt < INDEX_TTL_MS) return cached;
  const url = `/api/search-index-${locale}.json`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`search index fetch failed: ${res.status}`);
  const data = (await res.json()) as SearchRecord[];
  const ms = buildMiniSearch(data, locale);
  const entry: IndexCacheEntry = { data, ms, fetchedAt: Date.now() };
  cache.set(locale, entry);
  return entry;
}

export async function searchProducts(
  query: string,
  locale: Locale,
  limit = 20,
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];
  const { ms, data } = await loadIndex(locale);
  const hits = ms.search(trimmed);
  const byId = new Map<string, SearchRecord>();
  for (const r of data) byId.set(r.id, r);
  const results: SearchResult[] = [];
  for (const h of hits) {
    const r = byId.get(String(h.id));
    if (!r) continue;
    results.push({ ...r, score: h.score });
    if (results.length >= limit) break;
  }
  return results;
}

export function clearSearchCache(): void {
  cache.clear();
}

/**
 * Test-only: synchronously install a pre-built index entry so unit tests can
 * exercise searchProducts without running fetch. Not exported via the public
 * surface in production; kept here so tests don't need to mock fetch for
 * straightforward query cases.
 */
export function __installIndexForTest(locale: Locale, records: SearchRecord[]): void {
  const ms = buildMiniSearch(records, locale);
  cache.set(locale, { data: records, ms, fetchedAt: Date.now() });
}
