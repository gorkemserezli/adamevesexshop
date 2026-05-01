# Adam & Eve Katalog

Static multilingual (TR / EN / DE / RU) product catalog for the Adam & Eve
Hotels Belek boutique. Hospitality-oriented: no cart, no checkout, no
accounts. Hotel guests scan QR codes next to products to view details,
variants, and stock; the only CTA is a build-time-encoded WhatsApp deep link
to the concierge.

Built with Astro 5 + Tailwind 3, deployed to Cloudflare Pages.

---

## Setup

```bash
git clone <repo-url>
cd adam-eve-katalog
npm install
cp .env.example .env
# edit .env — see "Environment variables" below
npm run dev
```

Dev server runs at `http://localhost:4321/`. Astro's i18n redirects `/` to
`/en/`; you can navigate to any locale (`/tr/`, `/de/`, `/ru/`) directly.

### Required environment variables

All env vars are read at **build time**. Missing required vars fail the
build with a clear error message rather than producing a silently-broken
deploy.

| Variable | Required | Notes |
|---|---|---|
| `HOTEL_NAME` | Yes | Display name (page titles, About sheet). Has default. |
| `HOTEL_WHATSAPP_NUMBER` | Yes | E.164 format, e.g. `+905321234567`. Used in the build-time `wa.me` href on every PDP. |
| `HOTEL_BOUTIQUE_LOCATION_TR/EN/DE/RU` | Yes | Per-locale location string (homepage footer + Settings About row). |
| `HOTEL_HOURS_OPEN` / `HOTEL_HOURS_CLOSE` | Yes | `HH:MM` 24h. Drives the "Open daily, 09:00 — 23:00" line. |
| `PUBLIC_STOCK_API_URL` | Yes | Client-side stock fetch endpoint. **PUBLIC_** prefix required so Vite inlines it into the client bundle. See "Stock API state" below. |
| `SITE_URL` | Yes | Public origin used for canonical URLs. |
| `HOTEL_MARKETING_URL` | Yes | Age-gate "Leave" link target. **Build rejects `https://example.com/...` placeholders** — set to a real hotel marketing URL before deploy. |

### Stock API state at v1.0

Production `PUBLIC_STOCK_API_URL` is set to
`https://stock.adamevehotels.invalid/api/stock`, which is intentionally
unreachable (the `.invalid` TLD never resolves). This is **by design**.

Per spec §3.17, the boutique counter is the source of truth for stock until
the real stock API is deployed. With the unreachable URL:

- Every PDP fires a fetch on mount.
- The 3-second `AbortSignal.timeout` fires.
- The catch block runs.
- The stock badge resolves to **"Available at Boutique"** for all variants.
- Guests are directed to the boutique downstairs for live availability.

This is the documented §5.4 fallback path. Every line of the production
fallback code path runs on every PDP, every load, in production. No mock
data ever reaches a guest.

**When the real stock API is deployed:**

1. Update `PUBLIC_STOCK_API_URL` in the Cloudflare Pages dashboard env vars
   to the real endpoint URL.
2. Trigger a redeploy (push a commit, or click "Retry deployment" in the
   Cloudflare Pages dashboard).
3. PDPs will start resolving real per-variant stock per the §5.4 contract.

For local development, point at the bundled mock fixture:
`PUBLIC_STOCK_API_URL=/api/mock-stock.json`. The mock has plausible-looking
in-stock / last-N / sold-out states across all 6 sample products.

---

## Build, test, audit

```bash
npm run build      # → dist/ (65 pages, ~1.7s wall-clock warm)
npx astro check    # type-check Astro files (0 errors expected)
npx vitest run     # 84 unit tests across 8 files
node scripts/perf-audit.mjs   # CSS/JS budget check per spec §6.10
```

### Cold-build baseline (recorded 2026-05-01, v1.0 ship)

With `dist/` and `.astro/` removed:

```
total wall-clock:  1.93s   (npm run build, including prebuild)
astro build only:  1.11s
prebuild:          ~0.8s   (validate-images sharp + build-search-index)
```

Cloudflare Pages production builds always run cold. As the catalog scales
(more products, more locales, more image variants), the prebuild step's
sharp invocations dominate cold-build cost. Watch this number;
`V1.1-BACKLOG.md` has the gate conditions for when to act.

### Performance budget (per spec §6.10)

```
inline JS per PDP:   3.36 KB gz / 15 KB budget   ✓
module JS worst:    11.31 KB gz / 15 KB budget   ✓  (search page)
CSS:                 6.16 KB gz / 30 KB budget   ✓
```

The "module JS worst" is the highest single-page JS load. No single guest
ever fetches more than this — the search page bundles MiniSearch and
filter logic, which the rest of the site doesn't pay for.

Run `node scripts/perf-audit.mjs` after any non-trivial change to
client-side code; the audit exits non-zero if any budget breaks.

---

## Content authoring

### Adding a product

1. Create `src/content/products/{slug}.json`. Slug is kebab-case ASCII;
   becomes the URL path component.
2. Required fields: `id`, `sku`, `category_id`, `sort_order`, `images`,
   `overline`, `name`, `description`, `curator_note`, `price`, `made_in`.
3. Optional fields: `variants[]` (zero or more axes), `specs[]` (any number
   of label/value pairs), `sold_out` (defaults to false).
4. Place product image(s) under `public/products/`. Build fails if any
   image isn't 1:1 aspect ratio (per `src/scripts/validate-product-images.mjs`).
5. Localized fields take a 4-locale object: `{ tr: "...", en: "...",
   de: "...", ru: "..." }`. Strict mode rejects unknown keys.
6. Currency is locale-derived: TR→TRY, EN→USD, DE→EUR, RU→RUB. Schema
   enforces this via `.refine()`.
7. Run `npm run build` — any schema violation surfaces with line context.

See `src/content/products/warming-massage-oil.json` for a multi-axis
example, `src/content/products/leather-blindfold.json` for the no-variant
case, `src/content/products/silk-tie-set.json` for soft-hyphen usage in
DE/RU names.

### Adding a category

Edit `src/content/categories/categories.json`. Six categories ship today;
adding a new one creates new `/{lang}/categories/{id}/` pages
automatically. Categories with `description.{lang}` populated render an
editorial moment at the top of their per-category page (per Task 11
acceptance §3.6.1); without a description, the page opens directly to the
product grid.

### Soft-hyphen convention (display-only typography)

Long DE/RU product names can embed `­` (soft hyphen, U+00AD) at safe break
points so the browser can wrap gracefully on narrow viewports without
ever showing a visible hyphen at wider widths. Example:
`"Wär­mendes Massa­geöl"`. Stored verbatim in JSON; the build
strips them before encoding for the WhatsApp deep link (per §3.20). Do
not strip from `name[lang]` — the browser needs them.

### Adding/updating UI strings

`src/i18n/ui.ts` is the single source of truth for all chrome strings.
Each locale gets a fully-typed `UIStrings` object; missing keys fail
type-check.

---

## Deploy to Cloudflare Pages

Cloudflare Pages free tier, dashboard-only env var configuration.

### One-time setup

1. **Create the Cloudflare Pages project** in the dashboard:
   - Pages → Create a project → Connect to Git → pick the repo.
   - Project name: `adam-eve-katalog`
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: leave default

2. **Set environment variables** in the dashboard
   (Settings → Environment variables → Production):

   ```
   HOTEL_WHATSAPP_NUMBER=+90...   (real number)
   HOTEL_NAME=Adam & Eve Hotels Belek
   HOTEL_BOUTIQUE_LOCATION_TR=...
   HOTEL_BOUTIQUE_LOCATION_EN=...
   HOTEL_BOUTIQUE_LOCATION_DE=...
   HOTEL_BOUTIQUE_LOCATION_RU=...
   HOTEL_HOURS_OPEN=09:00
   HOTEL_HOURS_CLOSE=23:00
   PUBLIC_STOCK_API_URL=https://stock.adamevehotels.invalid/api/stock
   SITE_URL=https://adam-eve-katalog.pages.dev
   HOTEL_MARKETING_URL=https://...   (real hotel marketing URL — NOT example.com)
   ```

   The build will fail loudly if any required var is missing, or if
   `HOTEL_MARKETING_URL` matches the `^https://example.com` rejection regex.

3. **Trigger a deploy** by pushing to `main`. Cloudflare runs `npm run build`
   in a fresh container; expect ~5–10 seconds cold build. The first deploy
   serves at `https://adam-eve-katalog.pages.dev`.

### Custom domain (post-launch)

`*.pages.dev` is fine for v1.0 ship. Hotel team owns the domain decision
and the registrar.

To swap to a custom domain (e.g., `catalog.adam-eve-hotels.com`):

1. Cloudflare Pages → project → Custom domains → Set up a custom domain.
2. Add the domain; Cloudflare provides DNS records.
3. Configure DNS at the registrar (CNAME to `adam-eve-katalog.pages.dev`).
4. Update `SITE_URL` env var to the new domain; redeploy.
5. QR codes (printed at boutique) need regeneration with the new URL
   pattern.

### Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Build fails: `Missing required env var: ...` | Env var not set | Add it in Cloudflare Pages dashboard |
| Build fails: `HOTEL_MARKETING_URL must point to a real hotel marketing URL` | Set to `example.com` placeholder | Use the actual hotel marketing URL |
| Build fails: image not 1:1 | Product image isn't square | Crop to 1:1 before uploading; sharp validates this |
| Build fails: Zod validation | Content JSON schema violation | Error message names the file + field |
| Pages deploy succeeds, PDP shows "Available at Boutique" forever | `.invalid` stock URL is intentional (see Stock API state) | Replace `PUBLIC_STOCK_API_URL` when real API ships |
| Local dev: `npm install` errors with sharp | Sharp's prebuilt binaries missing for your platform | `npm install --include=optional sharp` |

---

## Real-device QR verification (post-deploy hotel-team task)

Once the production deploy is live and (optionally) on a custom domain,
the hotel team should physically test the printed QR sticker workflow:

1. Pick a product (e.g., `warming-massage-oil`).
2. Generate a QR code for `https://{prod-domain}/en/product/warming-massage-oil/`.
   Repeat for `/tr/`, `/de/`, `/ru/` URL variants — each becomes a printed
   sticker variant.
3. Print at the boutique's actual sticker production size.
4. From a guest-facing iPhone (Safari) and Android (Chrome):
   - Scan the QR.
   - Confirm age gate first paint, confirmable.
   - Confirm PDP loads with correct stock badge ("Available at Boutique" until
     real stock API ships).
   - Confirm "Ask at Boutique" CTA opens the WhatsApp app with the
     pre-composed message.
   - Confirm the language switcher in the header changes between locales.

Any failures get filed as v1.0 hotfix tickets; document findings in
`V1.1-BACKLOG.md` if non-blocking.

---

## Project structure

```
src/
  content/         # JSON product + category content (Astro Content Collections)
  components/      # Astro components — UI primitives + product/category surfaces
  layouts/         # BaseLayout (chrome, age gate, settings sheet, toast)
  lib/             # Pure TS modules — env, favorites, gizli, search, filter, stock, etc.
  pages/[lang]/    # Localized route templates
  scripts/         # Build-time scripts (validate-product-images, build-search-index)
  styles/          # globals.css, tokens.css (design-system source of truth)
  i18n/            # ui.ts (localized strings), format.ts (locale-aware helpers)
public/
  fonts/           # Self-hosted Cormorant Garamond + Inter + Lora subsets (woff2)
  products/        # Product images (1:1 enforced)
  api/             # Static mock-stock.json fixture for local dev
_design/           # Design source of truth — read-only authoritative spec
scripts/           # Verification harnesses (puppeteer-core, screenshot per task)
SPEC-DISAGREEMENTS.md   # Every contract-vs-implementation gap, status-tracked
V1.1-BACKLOG.md         # Deferred features, gated on real-usage signal
```

---

## Live deploy URL

(Recorded post-deploy by the user.)

```
URL:           <pending — populate after first successful Cloudflare Pages deploy>
Deployed at:   <date>
Build minutes used: <out of 500/month free tier>
```

---

## License

The content (product copy, images, category names) belongs to Adam & Eve
Hotels Belek. The application code is private; no public license granted.
Self-hosted fonts (Cormorant Garamond, Inter, Lora) are SIL OFL 1.1, see
`public/fonts/LICENSE.txt`.
