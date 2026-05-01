# SPEC-DISAGREEMENTS

Per `_design/design-handoff.md` §i, this file records spec items that are ambiguous, contradictory, or pending external confirmation. Each entry must be resolved or formally accepted before launch.

---

## 4-01 · Stock contract for no-variant products

**Status:** Open · v1.1 follow-up · pending stock API owner confirmation. Implementation proceeded with working assumption (Option 2, sentinel `_` key) per Task 7. v1.0 ships with this assumption encoded; resolves when the real stock API lands and confirms or rejects the shape.
**Raised:** Task 4 (data contracts) · 2026-04-28
**Updated:** Task 7 (stock fetch) · 2026-04-29
**v1.0 ship status:** 2026-05-01 — production `PUBLIC_STOCK_API_URL` set to `https://stock.adamevehotels.invalid/api/stock` (deliberately unreachable). Every PDP resolves to "Available at Boutique" via §5.4 fallback. The no-variant sentinel question is dormant in production until the real endpoint replaces the .invalid host.

**What the spec says.** §5.4 documents the stock response shape with a `variants` map keyed by `<axis-option-id>__<axis-option-id>` joined. It does not specify the response shape for a SKU with **zero** variant axes (e.g., `leather-blindfold` in our sample data).

**Open question.** When the PDP for a no-variant product calls `GET /api/stock?sku=AE-LB-001`, what does the server return?

Options I considered:
1. **Flat top-level state.** `{ "sku": "AE-LB-001", "status": "in_stock", "in_stock": 3, "fetched_at": "..." }` — no `variants` map at all.
2. **Single sentinel key.** `{ "sku": "...", "variants": { "_": { "status": "in_stock", "in_stock": 3 } }, "fetched_at": "..." }`
3. **Single SKU-key.** `{ "sku": "...", "variants": { "AE-LB-001": { ... } }, "fetched_at": "..." }`

In §F-12 of the Task 0 conversation we provisionally chose option 2 (sentinel `_` key). The implementation in `src/content/config.ts` (Task 4) accepts any of the three since it doesn't model the runtime response — that schema lives in `src/lib/stock.ts` (Task 7).

**What's blocking resolution.** The boutique stock API isn't finalized; whoever owns it hasn't been identified. Until they're at the table, picking a shape is guessing.

**Acceptance condition.** Before Task 7 (stock fetch implementation) starts:
- Identify the API owner.
- Lock the no-variant response shape.
- Update spec.md §5.4 with the chosen shape.
- Resolve this entry.

**Risk if launched unresolved.** A no-variant product PDP would silently fall back to "Available at Boutique" because the stock client wouldn't know how to read the response. Per non-negotiable rule #10 ("failure → 'Available at Boutique'") that's a graceful degradation, not a broken page — but it sacrifices the live stock UX for products that should have it.

### Task 7 working assumption (2026-04-29)

The stock API owner remained unidentified at the start of Task 7. To unblock implementation, Option 2 was chosen as the working assumption:

```
{
  "sku": "AE-LB-001",
  "variants": { "_": { "status": "in_stock", "in_stock": 6 } },
  "fetched_at": "..."
}
```

**Encoded in the implementation.**
- `src/lib/stock.ts` — exports `NO_VARIANT_KEY = "_"` and `buildVariantKey([], {})` returns it.
- `src/components/product/StockHydrator.astro` — when `productData.axes.length === 0`, looks up `response.variants["_"]`.
- `public/api/mock-stock.json` — `AE-LB-001` (leather-blindfold) uses the `_` key for its single stock entry. This is the only real-world test of the convention until the API lands.
- `src/lib/stock.test.ts` — `buildVariantKey` regression test asserts the sentinel.

**What changes when the owner confirms.**
- If they confirm Option 2 (sentinel `_`): only this entry needs closing. No code change.
- If they pick Option 1 (flat top-level): rewrite `fetchStockOne` response normalization to lift `{status, in_stock}` from the top level into a synthesized `variants["_"]` so the rest of the pipeline is unchanged. ~10 LOC change in `stock.ts`. The hydrator stays untouched.
- If they pick Option 3 (SKU-keyed): change one line in `StockHydrator.astro` to look up `response.variants[productData.sku]` instead of `response.variants["_"]`, and update the mock fixture's `AE-LB-001` entry. The sentinel constant becomes dead code; remove it.

**Resolution unblocked by:** stock API owner identification. Once they confirm a shape, this entry resolves and `_design/spec.md §5.4` should be amended to spell out the no-variant case explicitly (currently §5.4 only covers variant-keyed responses).

---

## 4-02 · `STOCK_API_URL` → `PUBLIC_STOCK_API_URL`

**Status:** Open · v1.1 follow-up · spec text edit pending; implementation uses the prefixed name. No code change required at acceptance — only `_design/spec.md §5.5` row rename.
**Raised:** Task 7 (stock fetch) · 2026-04-29
**v1.0 ship status:** 2026-05-01 — implementation canonical, spec text out of sync. Lint should not catch this.

Spec §5.5 names the env var `STOCK_API_URL`. Implementation requires the `PUBLIC_` prefix because Astro 5 only exposes prefixed env vars to client code via `import.meta.env`, and the runtime stock fetch is client-side per §6.4. No behavioral change — same value, same source, same build-time injection. The build-time safety rail (missing env → build fails) is preserved.

Spec §5.5 to be edited in the next maintenance pass; in the meantime treat `PUBLIC_STOCK_API_URL` as canonical.

**Encoded in the implementation.**
- `src/lib/env.ts:18` — `read("PUBLIC_STOCK_API_URL")` (no default).
- `.env`, `.env.example` — both use the prefixed name.
- `vitest.setup.ts` — sets `process.env.PUBLIC_STOCK_API_URL` so unit tests can import the module.
- Vite inlines `PUBLIC_STOCK_API_URL` into `import.meta.env` of the client bundle. Verified by inspecting `dist/_astro/StockHydrator.astro_*.js`: `PUBLIC_STOCK_API_URL:"/api/mock-stock.json"` is present.

**Acceptance condition.** Update `_design/spec.md §5.5` to rename the row and resolve this entry. No code change required.

---

## 4-03 · `loading` as a fifth StockBadge variant

**Status:** Open · v1.1 follow-up · spec text edit pending; implementation ships the variant.
**Raised:** Task 7 (stock fetch) · 2026-04-29
**v1.0 ship status:** 2026-05-01 — at v1.0, with `PUBLIC_STOCK_API_URL` pointed at the .invalid host, every PDP exits the loading state via the fallback path within ~3s of paint. The loading variant is briefly visible to guests during that window. When the real stock API lands, the loading variant becomes part of the standard PDP first-paint experience and the §3.10 variants table needs the row added.

Spec §3.10 enumerates four StockBadge variants: `in_stock` / `last_n` / `sold_out` / `available_at_boutique`. Implementation adds a fifth, `loading`, used between first paint and stock resolution (or fallback). This is observable to guests — they see a transient state §3.10's prose does not name.

**Working assumption (implementation choice iii).** `StockBadge.astro` takes the fifth state directly, not a separate skeleton component swapping in. Rationale: keeps the badge as the single source of truth for stock-state visuals; avoids a parallel component the next contributor would need to discover; the shimmer is purely a presentational variant of the badge primitive.

**Encoded in the implementation.**
- `src/components/product/StockBadge.astro` — `Variant` type union extended with `"loading"`. `variantStyles[loading]` uses `--ae-bg-2` background, `--ae-ink-3` ink. `markStyles[loading]` uses `--ae-ink-3` for the dot. The `ae-stock-skeleton` class adds the shimmer keyframes scoped to the loading variant.
- Skeleton shimmer respects `prefers-reduced-motion: reduce` (animation disabled).
- `src/i18n/ui.ts` — adds `stock.loading` localized string for all four locales (TR "Stok yükleniyor", EN "Loading stock", DE "Bestand lädt", RU "Загрузка наличия").
- `src/components/product/StockHydrator.astro` — first paint sets badge to `loading` via the build-time `<StockBadge variant="loading">`; on resolution, mutates the existing badge DOM in place (sets `data-variant`, removes `ae-stock-skeleton` class, updates label and pill colors per the resolved status).
- `src/pages/[lang]/product/[slug].astro:42` — `const stockVariant = product.sold_out ? "sold_out" : "loading";` (was `"available_at_boutique"` pre-Task-7).

**Acceptance condition.** Update `_design/spec.md §3.10` variants table and state-decision text to include `loading`. Specifically:
1. Add a row to the variants table with the loading-state pill colors (currently bg-2 / ink-3, which already exists in tokens).
2. Note in §3.17 ("Stock-state visual logic") that the decision tree describes the **post-fetch** state. Pre-fetch is always `loading`; post-fetch is one of the four documented states.
3. Reference the shimmer behavior + reduced-motion gate.

No code change required at acceptance time — implementation already ships.

---

## 4-04 · FilterSheet ships search-only in Task 10; category-list integration follows in Task 11

**Status:** Resolved 2026-05-01 · FilterSheet now wired to per-category pages via `showTypeFilter={false}`. Search page still uses the full sheet.
**Raised:** Task 10 (filter sheet) · 2026-04-29
**Resolved:** Task 11 (categories surface) · 2026-05-01

Spec §3.12 states the filter sheet "Opens from category list and search results." Task 10 wires FilterSheet to `src/pages/[lang]/search.astro` only because the categories index page (`/{lang}/categories/`) does not yet exist — it lands in Task 11.

**Working assumption.** FilterSheet is built as a generic, content-agnostic component that consumes a list of items and a filter state, applies the predicate, and emits the filtered list back. Wiring is per-host-page: the search page wires it now; the categories index page will wire it in Task 11 by importing the same `<FilterSheet>` and `applyFilter()` predicate. No FilterSheet code changes are expected when Task 11 lands.

**Encoded in the implementation.**
- `src/components/search/FilterSheet.astro` — generic sheet primitive consumed by host pages.
- `src/lib/filter.ts` — pure predicate functions, host-agnostic.

**Acceptance condition.** Task 11 (categories index page) wires the existing FilterSheet to the categories surface. At that point this entry resolves with no spec edit required.

---

## 5-01 · Categories source migration: spec sample → production XML

**Status:** Open · clarifying note · v1.1 prep
**Raised:** Task 13 (subcategory taxonomy migration) · 2026-05-01

Spec §3.6 hard-codes 6 sample categories (Wellness, Lingerie, Toys, Accessories, For Couples, Gifts). Implementation now sources from the production fetch pipeline (PHP, daily, reads DİA XML), which currently exposes 8 top-level categories: Anal Ürün, Dildo, Erkek Cinsel Sağlık Ürünü, Fantezi & Fetiş Ürünü, Kadın Cinsel Sağlık Ürünü, Şişme Manken, Vajina & Mastürbatör, Vibratör.

The spec sample remains useful as a pattern reference (anatomy of a category, the build-time count semantics) but is no longer the count contract. The 6 categories are not authoritative.

**Working assumption.** `src/content/categories/categories.json` mirrors the production XML's category set, slugified per XML names verbatim. fetch.php overwrites the file on each run; the repo's checked-in copy is smoke-test data.

**Acceptance condition.** When the catalog stabilizes (post-launch + 30 days of fetch.php runs without category list changes), `_design/spec.md §3.6` should be revised to either (a) drop the specific sample names and frame the section as "category list anatomy, set sourced from XML" or (b) update the sample to the live 8 names. Defer until the data is stable.

---

## 5-02 · Subcategory taxonomy added to schema

**Status:** Open · clarifying note · ships with Task 13
**Raised:** Task 13 (subcategory taxonomy migration) · 2026-05-01

Production XML carries a two-level taxonomy: `malzemekategori1` (top-level, ~8 entries) and `malzemekategori2` (subcategory, ~32 entries distributed across the 8 top-levels). Spec §5.1 product schema does not enumerate a `subcategory_id` field.

**Encoded in implementation.**
- `src/content/config.ts` — product schema gains `subcategory_id: z.string().nullable().default(null)`. Category schema gains `subcategories: z.array({id, name}).default([])`.
- Sample data ships with the new fields populated using real XML subcategory slugs.
- `src/lib/filter.ts` — `FilterState.subcategoryId` extends the predicate.
- Search index emits a `subcategory` field (localized name string) with boost weight 1.5.

**Localization.** Subcategory names follow the same per-locale shape as category names. fetch.php DeepL pipeline produces TR/EN/DE/RU on each run. Until first fetch.php push, sample data ships with TR placeholders for EN/DE/RU; a vitest case warns when `name.{en,de,ru} === name.tr` to catch forgotten translations post-fetch.

**Acceptance condition.** `_design/spec.md §5.1` (product schema) and the implicit category schema docs gain a `subcategory_id` / `subcategories[]` section. Could fold into a new §5.1.1 alt-section.

---

## 5-03 · Per-category page anatomy: subcategory chip row

**Status:** Open · clarifying note · ships with Task 13
**Raised:** Task 13 (subcategory taxonomy migration) · 2026-05-01

Per-category page anatomy (Task 11 §3.6.1) was: Breadcrumb → EditorialHero → product grid (with FilterSheet button at the count line). Task 13 inserts a horizontal-scroll subcategory chip row between EditorialHero and the result-count + grid section.

**Anatomy of the chip row.**
- "Tümü" chip first (always rendered when row renders, marks the unfiltered state).
- N subcategory chips, rendered in `subcategories[]` array order.
- Chip styling reuses `.ae-filter-chip` from FilterSheet's Type group (wine-100/wine-500 selected, hairline default).
- `overflow-x: auto`, `scroll-snap-type: x proximity`, `flex-wrap: nowrap`. ≥44px touch target height.
- Hidden entirely (no DOM presence) when `subcategories.length <= 1` — single chip is no useful affordance.

**State.** URL `?sub={subcategory_id}`. Hydrates on load, syncs on tap via `history.replaceState`. Combines with FilterSheet's `?type=&price=&instock=` predicates as logical AND at the page-level apply step. SubcategoryChips and FilterSheet share state only through URL — no direct component coupling.

**Acceptance condition.** `_design/spec.md §3.6.1` (or a new §3.6.2) gains a "Subcategory chips" sub-section describing the anatomy + URL contract. Defer until the v1.1 spec maintenance pass.
