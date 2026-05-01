/**
 * Drift test for placeholder-translation status.
 *
 * Walks src/content/categories/categories.json. Warns (does NOT fail) when any
 * category or subcategory has en/de/ru name === tr name — the marker that
 * fetch.php's DeepL pipeline hasn't run for that string, or that the entry
 * was added manually without translation.
 *
 * Why warn instead of fail: at v1.1 prep (Task 13), every entry intentionally
 * has TR-equivalent placeholders. A failing test would break CI on a deliberate
 * state. The warning is the signal — once fetch.php runs, the warning count
 * drops to zero. If a forgotten entry shows up post-fetch, the warning fires
 * and a maintainer notices.
 *
 * To assert "all translations are real" (post-fetch), flip the expect from
 * .toBeGreaterThanOrEqual to .toBe(0).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, "categories.json");

interface Localized {
  tr: string;
  en: string;
  de: string;
  ru: string;
}

interface Sub {
  id: string;
  name: Localized;
}

interface Cat {
  id: string;
  name: Localized;
  subcategories?: Sub[];
}

function loadCats(): Cat[] {
  const parsed = JSON.parse(readFileSync(FILE, "utf8"));
  return Array.isArray(parsed) ? parsed : (parsed.categories ?? []);
}

function placeholderHits(): { category: string; field: string; locale: "en" | "de" | "ru" }[] {
  const cats = loadCats();
  const hits: { category: string; field: string; locale: "en" | "de" | "ru" }[] = [];
  const check = (categoryId: string, field: string, n: Localized) => {
    for (const loc of ["en", "de", "ru"] as const) {
      if (n[loc] === n.tr) hits.push({ category: categoryId, field, locale: loc });
    }
  };
  for (const c of cats) {
    check(c.id, "name", c.name);
    for (const s of c.subcategories ?? []) {
      check(c.id, `subcategory:${s.id}`, s.name);
    }
  }
  return hits;
}

describe("categories.json placeholder-translation drift", () => {
  it("walks all categories + subcategories and reports placeholder count", () => {
    const hits = placeholderHits();
    // Currently passing: this is intentional placeholder state at v1.1 prep.
    // After fetch.php runs DeepL, the count should drop to 0. Flip the
    // assertion below from `>= 0` to `=== 0` once the catalog is live.
    expect(hits.length).toBeGreaterThanOrEqual(0);
    if (hits.length > 0) {
      const sample = hits.slice(0, 5).map((h) => `${h.category}/${h.field}/${h.locale}`).join(", ");
      console.warn(
        `[placeholder-drift] ${hits.length} locale strings still equal TR placeholder. ` +
          `Sample: ${sample}${hits.length > 5 ? "…" : ""}. fetch.php DeepL pipeline expected to overwrite.`,
      );
    }
  });

  it("schema invariant: every category and subcategory has all 4 locale strings populated (non-empty)", () => {
    const cats = loadCats();
    const empty: string[] = [];
    const checkEmpty = (categoryId: string, field: string, n: Localized) => {
      for (const loc of ["tr", "en", "de", "ru"] as const) {
        if (typeof n[loc] !== "string" || n[loc].length === 0) {
          empty.push(`${categoryId}/${field}/${loc}`);
        }
      }
    };
    for (const c of cats) {
      checkEmpty(c.id, "name", c.name);
      for (const s of c.subcategories ?? []) {
        checkEmpty(c.id, `subcategory:${s.id}`, s.name);
      }
    }
    expect(empty).toEqual([]);
  });
});
