# Adam & Eve Sex Shop — implementation handoff

> Brief for Claude Code (or any implementing agent). Read `spec.md` first — this file is what to do, not what to think.

## a. What you're building

A static, multilingual (TR/EN/DE/RU) catalog site for the adult retail boutique inside Adam & Eve Hotels in Belek. Hotel guests scan QR codes next to products in the boutique and land on a per-language product page that shows imagery, variants, live stock, and a curator note. There is **no cart, no checkout, no account**. The terminal CTA on every product is a build-time-encoded WhatsApp deep-link to the hotel concierge. The site is an in-resort reference, not a storefront.

## b. Stack

- **Astro 5** for SSG and i18n routing. Configure `prefixDefaultLocale: true` so every URL is `/tr/`, `/en/`, `/de/`, `/ru/`.
- **Tailwind 3** via `@astrojs/tailwind`. Theme reads from `tokens.css` (CSS custom properties) — see `tailwind.config.mjs`.
- **Node 20 LTS** (>= 20.11). Astro 5 also supports 22; pick either, document the choice in `.nvmrc`.
- **TypeScript** strict mode, throughout.
- **Content collections** for products and categories (JSON).
- **No client framework**. Astro components only. The handful of interactive bits (age gate, lang switcher, stock fetch, favorites, Gizli Mod) ship as small inline `<script>` modules or Astro client directives — no React/Vue/Svelte.
- **Deployment target.** **Cloudflare Pages** is the recommended host. Vercel and Netlify both have AUP language that can be applied to adult-content sites, and a hotel-boutique catalog with no transactional commerce is on the right side of that line in spirit but in the wrong filing cabinet by category — flagging the risk so the team can choose. Cloudflare Pages, fly.io static, or self-hosted Caddy/Nginx behind the hotel's existing infra are all safer. **If you cannot reach a deployment decision, default to Cloudflare Pages and document the choice in the README.**

## c. File manifest (deliverables in this folder)

| File | Purpose |
|---|---|
| `spec.md` | Authoritative design spec — principles, tokens, components, data, implementation |
| `design-handoff.md` | This file |
| `tokens.css` | CSS custom properties (light + dark via `[data-theme="dark"]`) — drop into `src/styles/` |
| `tailwind.config.mjs` | Tailwind config consuming `tokens.css` variables — drop into project root |
| `tokens.json` | DTCG flat tree export (for Figma sync, design tools, alternate frameworks) |
| `screen-a-product-detail.html` | Reference mock at 375px — Product Detail in EN |
| `screen-b-homepage.html` | Reference mock at 375px — Homepage / Catalog landing in EN |

## d. Top 10 implementation rules

These are non-negotiable, testable, and specific. If you disagree with any of them, see §i.

1. **Prices render in `font-serif` ink (default), tabular-nums, never colored.** Test: every price element has `font-family: var(--ae-font-serif)`, `color: var(--ae-ink)`, and `font-variant-numeric: tabular-nums lining-nums`. Add a unit visual regression to keep this honest.
2. **Bottom-nav label uses `text-nav-label` (11px), not `text-ui-label` (13px).** This is intentional so all four languages fit single-line at 375px. Do not "fix" it. Test: at 375px viewport, every nav cell label fits on one line in TR/EN/DE/RU.
3. **No flag icons anywhere.** Language switcher is `TR / EN / DE / RU` codes only. Test: grep the codebase for emoji flags (`🇹🇷🇬🇧🇩🇪🇷🇺`) — must return zero matches.
4. **No pure white (`#FFFFFF`) or pure black (`#000000`) anywhere.** Test: grep for `#FFF`, `#FFFFFF`, `#000`, `#000000`, `white`, and `black` in CSS — must return zero matches outside of comments. Use `var(--ae-canvas)` and `var(--ae-ink)`.
5. **Curator notes are italic, `bronze-600`, single line on cards, two lines max on PDP.** Class `.curator-note` is the only authorized rendering path; do not duplicate the styling inline.
6. **Product images are 1:1.** All product image source assets must be square; UI never crops or letterboxes. Add a build-time check that fails CI if a non-1:1 image is referenced from a product JSON.
7. **Favorites are device-local.** `localStorage` key `ae:favorites`, array of SKUs. No server roundtrip, no auth, no sync.
8. **WhatsApp deep-link href is built at build time.** Per locale × per product. The runtime never composes the URL. Test: view-source on a PDP and confirm the `href="https://wa.me/..."` is present in the static HTML, not constructed in JS.
9. **Age gate uses sessionStorage, not localStorage.** Key `ae:age-confirmed`. Setting persists for the session but not across browser-tab close. Soft full-viewport overlay; **never** use `<dialog>` or any blocking modal pattern.
10. **Stock fetched on PDP mount, 60s in-memory cache, 3s timeout. Failure → "Available at Boutique".** Never expose error states to the guest. The boutique is downstairs; ambiguity defaults to "go ask."

## e. Build-time vs runtime data split

| Data | Source | Phase | Storage |
|---|---|---|---|
| Product names, descriptions, prices, curator notes | `src/content/products/*.json` | Build | Static HTML |
| Category list, sort order | `src/content/categories/categories.json` | Build | Static HTML |
| Product images | `/public/products/*.{jpg,webp}` | Build | Static asset |
| WhatsApp deep-link href | Per locale × product, computed in build | Build | Static HTML attribute |
| Hotel hours, address, phone | Env vars (read in `astro.config` or build constants) | Build | Static HTML |
| Stock counts | `STOCK_API_URL` | Runtime | 60s in-memory `Map<sku, …>` |
| Favorites | Device | Runtime | `localStorage` `ae:favorites` |
| Age-gate confirmation | Device | Runtime | `sessionStorage` `ae:age-confirmed` |
| Gizli Mod state | Device | Runtime | `localStorage` `ae:gizli-mode` |
| Selected language | URL path | Build / runtime | URL is authoritative |

## f. Suggested project structure

```
adam-and-eve-shop/
├── astro.config.mjs
├── tailwind.config.mjs            ← from this folder
├── tsconfig.json
├── package.json
├── .nvmrc                         ← "20"
├── .env.example                   ← document HOTEL_WHATSAPP_NUMBER, etc.
├── public/
│   ├── fonts/
│   │   ├── cormorant-garamond-italic.woff2
│   │   └── lora-italic.woff2
│   └── products/
│       └── *.{jpg,webp}           ← 1:1 source images
├── src/
│   ├── styles/
│   │   └── tokens.css             ← from this folder
│   ├── content/
│   │   ├── config.ts              ← collection schemas (Zod)
│   │   ├── products/
│   │   │   └── *.json
│   │   └── categories/
│   │       └── categories.json
│   ├── i18n/
│   │   ├── ui.ts                  ← UI strings keyed by locale
│   │   ├── format.ts              ← price/number formatters (ICU-aware)
│   │   └── whatsapp.ts            ← build-time href composer
│   ├── lib/
│   │   ├── stock.ts               ← runtime fetch + 60s cache
│   │   ├── favorites.ts           ← localStorage wrapper
│   │   ├── age-gate.ts            ← sessionStorage wrapper
│   │   └── gizli-mode.ts          ← localStorage wrapper
│   ├── components/
│   │   ├── chrome/
│   │   │   ├── Header.astro
│   │   │   ├── BottomNav.astro
│   │   │   ├── LanguageSwitcher.astro
│   │   │   ├── AgeGate.astro
│   │   │   └── SettingsSheet.astro
│   │   ├── product/
│   │   │   ├── ProductCard.astro
│   │   │   ├── ProductHero.astro
│   │   │   ├── VariantSelector.astro
│   │   │   ├── StockBadge.astro
│   │   │   ├── CuratorNote.astro
│   │   │   └── ActionBar.astro
│   │   └── ui/
│   │       ├── Breadcrumb.astro
│   │       ├── BottomSheet.astro
│   │       ├── Toast.astro
│   │       ├── Skeleton.astro
│   │       └── EmptyState.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   └── pages/
│       ├── index.astro                           ← redirect to /en/
│       └── [lang]/
│           ├── index.astro                       ← homepage / category list
│           ├── categories/
│           │   └── [category]/index.astro        ← category landing
│           ├── product/
│           │   └── [slug].astro                  ← PDP
│           ├── search.astro
│           └── favorites.astro
├── tokens.json                    ← from this folder (root, for design-tool sync)
└── README.md
```

## g. What NOT to do — explicit list

These are e-commerce reflexes the design rejects. They will look wrong if added.

- **No cart.** No "Add to Cart" button anywhere. The CTA is "Add to Favorites" + "Ask at Boutique."
- **No checkout, no payment iconography.** Don't render Visa/Mastercard/Apple Pay logos. Don't render a "Secure Checkout" badge. Don't render shipping language.
- **No multi-currency toggle.** Currency is locale-derived, not user-toggleable. RU sees ₽, DE sees €, EN sees $, TR sees ₺.
- **No reviews, no ratings, no stars.** Not a single star icon. Not even an "average rating" placeholder.
- **No urgency banners.** No "Only 2 left!", no countdowns, no "Sale ends in", no "Limited Time", no "X people viewing", no recently-viewed carousels, no "Trending now."
- **No newsletter signup, no loyalty program, no social-media feed.** This site does not have a footer subscribe field. It does not link to Instagram. It does not.
- **No flag icons for languages.** Not in the switcher trigger, not in the open panel, not in the URL pattern. Codes only: `TR EN DE RU`.
- **No thumbnails on the category list.** It is typography + bronze hairlines + chevron. That is the design.
- **No mood-based "Collections" or "Rituals" navigation.** Categories are functional: Wellness, Lingerie, Toys, Accessories, For Couples, Gifts.
- **No pure white or pure black** — see rule #4. This is a re-emphasis because designers and engineers default to it from muscle memory.
- **No hero carousel, no banner photography, no promo strip.** The homepage editorial moment is a 2-sentence "Hotel Boutique" curator note in serif. Nothing else above the category list.
- **No `<dialog>` for the age gate.** It is a soft full-viewport overlay; soft = single confirm dismisses, never returns in-session.
- **No auto-advancing carousels.** PDP image carousel is swipe-only; do not auto-paginate. Pagination dots are bronze, bottom-right.
- **No JS framework.** No React, no Vue, no Svelte. Astro components + small inline scripts.
- **No `prefers-color-scheme` auto-switch in v1.** Light only at launch; dark mode toggle ships in v1.1 inside Settings sheet.

## h. Specific gotchas

These are the things easy to miss; budget extra attention:

1. **Cyrillic italic fallback.** Cormorant Garamond's italic Cyrillic is incomplete. The `tokens.css` includes a `unicode-range`-scoped `@font-face` aliased as `AE Serif Italic` that loads Lora Italic for Cyrillic codepoints. **Do not** load only Cormorant; Russian curator notes will look broken. Verify by rendering the Russian curator note "Для свечей" in italic — letters `д ч е й` should look like proper italic forms, not slanted upright.
2. **Soft hyphens in product names.** Names may include `\u00AD` at compound-word boundaries (especially DE/RU). Don't strip them at any layer. For search indexing only, use a separate `name_search` field that is `name.replaceAll('\u00AD', '')` computed at build.
3. **Bottom nav label is 11px on purpose.** The size is set as a token (`--ae-fs-nav-label`). If a code reviewer asks why it's not `--ae-fs-ui-label`, point them at §3.11 of `spec.md` — all four languages fit single-line at 375px because of this size, and only because of this size.
4. **Scrim is wine-with-alpha, not black.** `rgba(42, 30, 22, 0.50)` for the bottom-sheet backdrop. Pure black scrims read clinical against the warm palette.
5. **Header has overflow `⋯`, Gizli Mod is in Settings.** The brief originally had Gizli Mod in the header; the resolved design moves it to the Settings sheet behind `⋯`. If you find spec text that contradicts, trust `spec.md` v1.0.
6. **Variant chips with diagonal strike stay in the DOM.** Do not conditionally render unavailable variants. The strike-through is the affordance — the guest can still ask the boutique.
7. **WhatsApp message templates have curly placeholders, not template literals.** The strings ship with `{product.name}` and `{sku}` literally; the build-time composer interpolates these and then `encodeURIComponent`s the whole message. Do this once, statically, per locale × product. Do not pass the unencoded template through to the client.
8. **`prefixDefaultLocale: true` in Astro i18n.** Without this, English would live at `/` and the other locales at `/tr/`, `/de/`, `/ru/` — that's a hierarchy. The brief and design treat all four as equals; the URL must reflect that.
9. **Settings sheet "Language" row mirrors the header switcher.** It opens the same component (with the same anatomy). It is not a separate language UI.
10. **Stock variant key format.** Join axis option IDs with double underscore: `<scent-id>__<volume-id>`, in the order axes appear in `variants[]`. Keep this consistent or the stock map lookup will fail silently.
11. **Sample mocks use Tailwind CDN** — your production build must use `@astrojs/tailwind` with PostCSS, JIT-purged, not the CDN. The mocks are wireframes, not production code.
12. **CSS custom properties are the source of truth.** `tailwind.config.mjs` references `var(--ae-…)`; `tokens.json` is for design tool sync. If a value needs to change, change it in `tokens.css` first.
13. **Reduced motion collapses durations to 1ms but keeps opacity transitions.** The pattern is in `tokens.css`. Do not remove all transitions — that creates jarring snaps. Opacity stays; transforms go.
14. **Dark mode is `[data-theme="dark"]` on `<html>` only.** Not `prefers-color-scheme`. Not a Tailwind `dark:` class derived from media query — that prefix is bound to the explicit attribute via `darkMode: ["selector", '[data-theme="dark"]']` in the config.

## i. How to handle disagreement

The design has been considered; pieces that look odd are usually intentional (see gotchas). If, while implementing, you find a spec decision you genuinely think is wrong:

1. **Implement as-specified.** Do not "fix" it.
2. **Leave a `// SPEC-DISAGREEMENT: <one-line summary>` comment** in source at the relevant line.
3. **Add a one-paragraph note** to a top-level `SPEC-DISAGREEMENTS.md` file: what the spec says, what you'd change, why, what risk you see in the current spec.
4. **Do not block the PR on it.** Surface to the human reviewer in the next round and continue.

Two cases override this protocol — escalate immediately, do not implement:

- **Anything affecting a security boundary** (e.g., the spec asks for something that would log PII, expose hotel concierge phone number client-side without scoping, or allow XSS via unescaped user content). Pause and message.
- **Anything affecting WCAG contrast**. If a token combination you're asked to use doesn't meet the contrast ratio claimed in `spec.md` §2.1 (verify with a tool like axe), the spec is wrong — surface and pause.

## j. Order of work suggestion

Roughly twelve days for a careful build. Expect drift; this is a sequence, not a Gantt.

1. **Day 1 — Setup.** `npm create astro@latest`. Add `@astrojs/tailwind`. Drop `tokens.css` into `src/styles/`, `tailwind.config.mjs` into root. Add `.nvmrc`, `.env.example`. Configure `astro.config.mjs` for i18n (`["tr", "en", "de", "ru"]`, `prefixDefaultLocale: true`). Verify `npm run dev` boots and `/en/` renders a placeholder page in `var(--ae-canvas)`.
2. **Day 2 — Layout shell + chrome.** `BaseLayout.astro`. `Header.astro` with wordmark + 3-icon utility cluster. `BottomNav.astro` at 11px label. Stub `LanguageSwitcher.astro` (trigger only). Verify both screen mocks render correctly when copy-pasted into a route — that's your "design parity" smoke test.
3. **Day 3 — Language switcher + i18n plumbing.** Open-panel anatomy. `src/i18n/ui.ts` with all chrome strings for all four locales. `Astro.currentLocale` plumbing through layout.
4. **Day 4 — Content collections.** `src/content/config.ts` Zod schemas for products and categories. Author 4–6 sample product JSONs covering variants, multiple images, RU and DE names with soft hyphens. Categories file.
5. **Day 5 — Homepage.** `[lang]/index.astro` rendering the Hotel Boutique editorial moment + category list (typography-only, bronze hairlines, chevron). Match `screen-b-homepage.html`.
6. **Day 6 — PDP (static).** `[lang]/product/[slug].astro` with hero image, product header, variant selector, description, specs, action bar. WhatsApp href composed at build time via `src/i18n/whatsapp.ts`. Match `screen-a-product-detail.html`.
7. **Day 7 — Variant interaction + stock fetch.** Client-side variant selection (no page reload — local state via inline script). `src/lib/stock.ts` runtime fetch with 60s cache + 3s timeout + boutique-fallback. StockBadge component swaps variants based on selected variant key.
8. **Day 8 — Age gate, favorites, Gizli Mod.** `src/lib/age-gate.ts`, `src/lib/favorites.ts`, `src/lib/gizli-mode.ts`. Settings sheet wiring `⋯`. Toast component on favorite-add.
9. **Day 9 — Search.** `[lang]/search.astro`. Build-time index of product `name_search` (soft-hyphens stripped) + curator note + category. Client-side fuzzy match on input. No analytics, no autocomplete, no recent searches.
10. **Day 10 — Polish + accessibility.** Focus rings. `aria-*` on interactive components. `prefers-reduced-motion`. axe scan. Verify all four locales at 375px and 1024px without overflow.
11. **Day 11 — Performance + deploy.** Tailwind JIT purge. Image optimization (Astro built-in). Cloudflare Pages deploy. Real-device QR test (TR/EN/DE/RU URL patterns from a printed sticker). Stock API timeout test.
12. **Day 12 — Buffer.** Bug fixes from real-device test. Documentation in `README.md`. Hand back.

---

End handoff.
