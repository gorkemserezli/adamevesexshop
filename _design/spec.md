# Adam & Eve Sex Shop — design specification

**Version 1.0 · April 2026**

A static multilingual catalog for an adult retail boutique inside Adam & Eve Hotels in Belek, Antalya. The site references — it does not sell. Hotel guests scan in-boutique QR codes to view product details, variants, and stock; purchase happens at the counter. This document is the single source of truth for design tokens, components, data shape, and implementation rules.

## Contents

1. Design principles
2. Token specification
3. Component inventory
4. Sample screens
5. Data contracts
6. Implementation notes

---

## 1. Design principles

**1.1 Hospitality, not retail.** The site is an extension of the hotel suite, not a storefront. No urgency, no scarcity, no sale chrome. Behavior defaults to *less* — fewer photos, fewer modules, fewer words. Every page should feel like in-room collateral the hotel left for the guest.

**1.2 Equal-weight multilingualism.** Turkish, English, German, and Russian are four equal first-languages. Every component is sized for the longest plausible Russian or German string. Layout never reflows when language changes; only line counts grow within reserved space. URLs follow `/tr/`, `/en/`, `/de/`, `/ru/`. No language detection prompts — the QR code carries the language.

**1.3 Type-led, chrome-quiet.** Cormorant Garamond serif, Inter sans, warm cream layering, and bronze hairlines carry the entire hierarchy. Cards have edges where ivory meets cream, not borders. Shadows appear once (sheets/modals) and otherwise never. Hierarchy comes from scale, weight, and rule, not from boxes.

**1.4 Poured, not printed.** Color is warm and saturated — wine, bronze, cream — like a hotel suite at golden hour. No stark white, no pure black, no flat grayscale neutrals. Every neutral has warmth; every accent has earth.

**1.5 Whitespace is content.** Mobile gutters start at 24px and breathe to 32px on hero pages. Imagery is large and used sparingly — one hero photo, not a grid of six thumbnails. The grid feels closer to editorial print than retail mobile.

**1.6 Privacy as comfort, not paranoia.** The guest is in a private hotel room. Image-blur (Gizli Mod) exists for those who want it, but it is **off by default** and lives in the settings sheet behind the header overflow icon — never in the header chrome itself. The brand assumes adulthood and dignity.

**1.7 The boutique is the destination.** The site informs; the boutique serves. Every product page resolves to *Ask at Boutique* — a build-time-encoded WhatsApp deep-link to the hotel concierge — not a transaction. Stock badges and variant chips exist to prepare the guest's question, not to close a sale.

---

## 2. Token specification

All tokens ship as CSS custom properties in `tokens.css`, consumed by `tailwind.config.mjs`, and exported as DTCG flat tree in `tokens.json`. Hex values appear once at the source of truth (CSS); everything downstream references the variable.

### 2.1 Color — light mode

**Wine ramp (primary).** Deep brown undertones, low-saturation — aged leather wine binding, not Cabernet.

| Token | Hex | Use |
|---|---|---|
| `wine-50`  | `#FBF3F2` | Subtle wash, hover-rest |
| `wine-100` | `#F2E0DC` | Selected chip background |
| `wine-200` | `#E2BBB2` | Decorative tint |
| `wine-300` | `#C58A7E` | — |
| `wine-400` | `#A05B4E` | — |
| `wine-500` | `#6B2E26` | **Primary brand wine.** CTAs, wordmark, emphasis |
| `wine-600` | `#5A2620` | Pressed CTA |
| `wine-700` | `#4A1E1A` | — |
| `wine-900` | `#2A100E` | — |

**Bronze ramp (secondary).** Warm metallic-feeling without being literal — between gold and copper.

| Token | Hex | Use |
|---|---|---|
| `bronze-50`  | `#F8F1E5` | — |
| `bronze-100` | `#ECDCBA` | Info-badge bg, settings tile bg |
| `bronze-200` | `#DCC18B` | Decorative tint |
| `bronze-300` | `#C4A165` | — |
| `bronze-400` | `#A88546` | Hairline (at 30% α), bullets, indicator dots |
| `bronze-500` | `#8C6D40` | **Decorative ink only — fails AA for body text** |
| `bronze-600` | `#71562F` | Curator-note italic; passes AA on cream |
| `bronze-700` | `#564220` | Filled bronze surfaces with cream text |
| `bronze-800` | `#3C2E15` | — |

**Neutrals.** No pure white, no pure black.

| Token | Hex | Use |
|---|---|---|
| `canvas`           | `#F9F4EC` | Page background — warm cream |
| `surface`          | `#F2EBDD` | Raised cards, modals, sheets |
| `surface-sunken`   | `#EFE4D0` | Sunken sections |
| `hairline`         | `rgba(168,133,70,0.30)` | Bronze hairline, primary section divider |
| `hairline-soft`    | `rgba(168,133,70,0.15)` | Within-card separators |
| `ink` (DEFAULT)    | `#2A1E16` | Primary text — warm brown-black |
| `ink-2`            | `#4A3829` | Secondary text |
| `ink-3`            | `#6B5642` | Tertiary, meta, captions |

**Semantic — light.** Calibrated to coexist with the wine and bronze foundation, not stand out.

| Variant | bg | ink | mark |
|---|---|---|---|
| success (in stock)         | `#E5E8D9` | `#3F4933` | `#5C6B4A` |
| warning (low stock)        | `#F2E2BD` | `#6B4A1E` | `#A87830` |
| danger (sold out)          | `#ECCFC4` | `#7A3525` | `#B4533A` |
| info (available at boutique) | `#ECDCBA` | `#564220` | `#71562F` |

**Fixed pairings — light, AA verified.**

| Surface | Foreground | Contrast |
|---|---|---|
| `wine-500` `#6B2E26`  | `canvas` `#F9F4EC` | 9.63 — AAA |
| `canvas`              | `ink` `#2A1E16`    | 14.8 — AAA |
| `canvas`              | `ink-2`            | 9.1  — AAA |
| `canvas`              | `ink-3`            | 5.5  — AA  |
| `canvas`              | `bronze-600`       | 6.34 — AA  |
| `surface`             | `ink`              | 13.4 — AAA |
| `bronze-700` `#564220`| `canvas`           | 8.75 — AAA |
| `success.bg`          | `success.ink`      | 7.8  — AAA |
| `warning.bg`          | `warning.ink`      | 6.9  — AA  |
| `danger.bg`           | `danger.ink`       | 6.5  — AA  |

**Non-pairings.** `bronze-500` as a text background fails both directions (3.4 / 4.36) — never use it as a text-bearing surface. For filled bronze blocks with cream text, use `bronze-700`. For italic ink on cream, use `bronze-600`. For decorative use (hairlines, dividers), `bronze-400` at 30% opacity.

### 2.2 Color — dark mode

Activated by `[data-theme="dark"]` on `<html>`. Cocoa surfaces (not black). Wine lifted; bronze becomes the warm carrier of identity.

| Token | Hex | Use |
|---|---|---|
| `canvas`         | `#1A140F` | Deep cocoa background |
| `surface`        | `#261D14` | Raised cards |
| `surface-sunken` | `#120D09` | Behind elevated content |
| `hairline`       | `rgba(216,184,134,0.20)` | Bronze hairline, lifted |
| `hairline-soft`  | `rgba(216,184,134,0.10)` | — |
| `ink`            | `#F0E6D5` | Primary text |
| `ink-2`          | `#C9B89F` | Secondary |
| `ink-3`          | `#8F7E66` | Tertiary |
| `wine-500`       | `#BC685A` | Wine lifted — primary at low light |
| `wine-600`       | `#C77264` | Wine emphasis |
| `wine-100`       | `#3A1814` | Wine wash bg (selected chips) |
| `bronze-400`     | `#B59A6E` | Hairline-strength bronze |
| `bronze-600`     | `#D8B886` | Bronze accent — carries identity |
| `bronze-700`     | `#E8CBA0` | Bronze emphasis |

**Semantic — dark.**

| Variant | bg | ink | mark |
|---|---|---|---|
| success | `#2A3320` | `#B7C29C` | `#8FA070` |
| warning | `#3D2D14` | `#E5C589` | `#D9A656` |
| danger  | `#3D1F16` | `#E8AE9B` | `#D67560` |
| info    | `#2C2316` | `#D8B886` | `#D8B886` |

**Fixed pairings — dark, AA verified.**

| Surface | Foreground | Contrast |
|---|---|---|
| `canvas`          | `ink`        | 14.7 — AAA |
| `canvas`          | `ink-2`      | 9.4  — AAA |
| `canvas`          | `ink-3`      | 4.57 — AA  |
| `canvas`          | `wine-500`   | 4.53 — AA  |
| `canvas`          | `bronze-600` | 9.67 — AAA |
| `surface`         | `ink`        | 12.5 — AAA |
| `wine-600`        | `canvas`     | 5.22 — AA  |

### 2.3 Typography

**Families.**

- `font-serif`: `"Cormorant Garamond", "AE Serif", "AE Serif Italic", Georgia, serif`. Two `unicode-range`-scoped aliases declared in `tokens.css` / `fonts.css` plug the Cyrillic gaps that Cormorant Garamond doesn't cover — `AE Serif` loads Lora Regular for upright Cyrillic, `AE Serif Italic` loads Lora Italic for italic Cyrillic. Latin codepoints stay on Cormorant. The browser routes by codepoint automatically — no JS, no locale check, no manual `lang=` font swap. See §2.3.1 for the why.
- `font-sans`: `"Inter", system-ui, "Segoe UI", sans-serif`. Variable, full Latin Extended + Cyrillic.
- Monospace not used.

#### 2.3.1 Why the serif stack has two Lora aliases

Cormorant Garamond ships Latin and Latin-Extended only — no Cyrillic glyphs at any weight or style. Without intervention, a Cyrillic character on a serif page fails through to the next family in the stack:

| Stack as defined | Cyrillic upright requested | Cyrillic italic requested |
|---|---|---|
| `"Cormorant Garamond", Georgia, serif` (naive) | Georgia (typewriter feel, doesn't match the warm-print aesthetic) | Georgia Italic |
| `"Cormorant Garamond", "AE Serif Italic", Georgia, serif` (Task 1.5 — Cyrillic italic only) | **Lora Italic** (italic-leaning glyphs on upright requests — wrong weight intent) | Lora Italic ✓ |
| `"Cormorant Garamond", "AE Serif", "AE Serif Italic", Georgia, serif` (current, v1) | **Lora Regular** ✓ | **Lora Italic** ✓ |

Lora is chosen because its proportions, contrast, and x-height read as a sibling to Cormorant Garamond rather than a contrast — Russian and Latin paragraphs sit together without visible family-shift. Both fonts are SIL OFL licensed and bundled in `public/fonts/`.

**v1.1 revisit conditions.** Drop one or both Lora aliases and simplify the stack if any of:

1. Cormorant Garamond ships a stable Cyrillic supplement (the project has discussed it; not committed).
2. Astro 5's Fonts API (currently experimental) lands subset-aware optimization that reduces the cost of declaring per-codepoint family aliases — at that point the speculative-load behavior we're accepting in v1 (see Task 1.5 acceptance note) becomes free to fix.
3. We pick up more Cyrillic-heavy editorial copy and the regular-weight font budget grows enough to justify a different Cyrillic serif (Tinos, EB Garamond Cyrillic, etc.) for tone reasons rather than fallback reasons.

Until then: do not strip `"AE Serif"` or `"AE Serif Italic"` from `--ae-font-serif`. Do not localize the serif stack via `:lang(ru)` — the unicode-range routing is already locale-agnostic and per-codepoint, which is what the spec wants.

**Scale.** Mobile-first. Desktop scales noted where they grow.

| Token | Size | LH | Weight | Family | Tracking | Notes |
|---|---|---|---|---|---|---|
| `display-lg`  | 40 → 56 | 1.08 | 400 | serif | -0.01em  | Wordmark, hero one-time |
| `display`     | 32 → 40 | 1.15 | 400 | serif | -0.005em | Page hero |
| `h1`          | 28 → 36 | 1.20 | 400 | serif | -0.005em | Product name |
| `h2`          | 22 → 26 | 1.25 | 500 | serif | 0        | Section heading |
| `h3`          | 18 → 20 | 1.30 | 500 | serif | 0        | Sub-heading |
| `h4`          | 16      | 1.40 | 500 | serif | 0        | Minor heading |
| `body-lg`     | 17      | 1.55 | 400 | sans  | 0        | Lede |
| `body`        | 15      | 1.55 | 400 | sans  | 0        | Default |
| `body-sm`     | 13      | 1.50 | 400 | sans  | 0        | Helper, meta |
| `caption`     | 12      | 1.40 | 400 | sans  | 0.01em   | Captions |
| `overline`    | 11      | 1.30 | 500 | sans  | 0.20em   | All caps |
| `ui-label`    | 13      | 1.20 | 500 | sans  | 0.02em   | Buttons, nav |
| `nav-label`   | 11      | 1.20 | 500 | sans  | 0.01em   | Bottom nav — intentional drop |
| `price`       | 22      | 1.20 | 400 | serif | 0        | Tabular-nums |
| `curator`     | 14      | 1.50 | 400 italic | serif | 0   | Bronze italic curator note |

**Tabular numerics.** Every price node carries `font-feature-settings: "tnum", "lnum"` (utility class `.tnum`). Prices are distinguished by serif and tabular alignment, never by color.

**Sentence case throughout.** No ALL CAPS except `overline`. Russian and German never go ALL CAPS — readability collapses.

### 2.4 Spacing

Base 4px:

| Token | Px | Common use |
|---|---|---|
| `s-1`  | 4   | Inline icon-to-text |
| `s-2`  | 8   | Tight grouping |
| `s-3`  | 12  | Chip padding |
| `s-4`  | 16  | Default stack within cards |
| `s-5`  | 20  | — |
| `s-6`  | 24  | **Default mobile side gutter** |
| `s-7`  | 32  | Generous mobile gutter / hero |
| `s-8`  | 40  | Section padding mobile |
| `s-10` | 48  | Section padding (large) |
| `s-12` | 64  | Section break |
| `s-16` | 80  | Section break (desktop) |
| `s-20` | 96  | Hero pad (desktop) |
| `s-24` | 128 | Page top/bottom (desktop) |

Gutters: `gutter-mobile` 24, `gutter-mobile-hero` 32, `gutter-tablet` 32, `gutter-desktop` 64.

### 2.5 Radius

`r-sm` 6 (chips inline), `r-md` 10 (buttons), `r-lg` 14 (cards, sheets), `r-xl` 20 (modals), `r-pill` 999.

No sharp corners on primary surfaces. No rounded corners on single-sided borders — `border-left` accents stay at radius 0.

### 2.6 Shadow

Hierarchy is layered cream-on-ivory + bronze hairlines first. Shadow is reserved.

| Token | Light | Dark |
|---|---|---|
| `shadow-none`  | `none` | `none` |
| `shadow-sheet` | `0 12px 40px rgba(42, 30, 22, 0.12)` | `0 12px 40px rgba(0, 0, 0, 0.50)` |

Used on bottom sheet, modal, and toast only. Cards, headers, nav, and product images are flat.

### 2.7 Motion

Slow, deliberate.

| Token | Value |
|---|---|
| `dur-fast` | 180ms — toggle, chip press |
| `dur-base` | 280ms — sheet enter/exit, page transitions |
| `dur-slow` | 400ms — image cross-fade, hero mount |
| `ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `ease-emphasis` | `cubic-bezier(0.16, 1, 0.30, 1)` — sheets, hero |

`prefers-reduced-motion: reduce` collapses all durations to 1ms; transforms are removed; opacity transitions persist.

### 2.8 Layout

Viewport breakpoints: `vp-min` 320, `vp-mobile-max` 430, `vp-tablet` 768, `vp-desktop` 1024, `vp-wide` 1280.

Content max widths: text `720`, catalog `960`, PDP `1120`.

### 2.9 Iconography

Stroke-based, 1.5px weight, 20px nominal, `currentColor` only. No filled icons in primary nav. Set: search, language (chevron), favorite (line / fill toggle for active), filter, close, chevron, whatsapp, share, info, check, low-stock-dot, sold-out-strike. **No emoji anywhere.**

### 2.10 Z-index

`z-sticky` 30 (header/nav), `z-dropdown` 40 (lang switcher panel), `z-sheet` 50 (bottom sheet), `z-toast` 60, `z-modal` 70.

---

## 3. Component inventory

### 3.0 Cross-cutting language overflow rules

**Length budget.** Reserve 1.5× the English character count for text-bearing surfaces — practical headroom for Russian (+30–45%), German compounds (+25–40%), and Turkish agglutination (+15–30%).

| Component class | EN baseline | Reserved | Strategy |
|---|---|---|---|
| Inline label (chip, badge, button) | 4–14 | 1.5× | Single line, do not truncate |
| Display heading (product name) | 14–28 | 1.4× | Wrap to 2 lines max, then ellipsis |
| Body paragraph | open | open | Wrap freely |
| Bottom-nav label | 4–10 | exact fit | 11px size, never wrap |
| Curator note | 40–60 | 1.4× | 1 line on cards, 2 lines max on PDP |
| Category-row label | 6–14 | 1.5× | Single line; type-step down if exceeds |

**Cyrillic italic fallback.** Cormorant Garamond's italic Cyrillic is incomplete (`т д п г к` render as slanted upright glyphs). Fix: a `unicode-range`-scoped `@font-face` aliased as `AE Serif Italic` that loads Lora Italic for Cyrillic codepoints and falls through to Cormorant for Latin. `font-size-adjust: 0.48` normalizes x-heights.

```css
@font-face {
  font-family: "AE Serif Italic";
  src: local("Cormorant Garamond Italic"),
       url("/fonts/cormorant-garamond-italic.woff2") format("woff2");
  font-style: italic; font-weight: 400; font-display: swap;
  unicode-range: U+0000-024F, U+1E00-1EFF;
}
@font-face {
  font-family: "AE Serif Italic";
  src: url("/fonts/lora-italic.woff2") format("woff2");
  font-style: italic; font-weight: 400; font-display: swap;
  unicode-range: U+0400-04FF, U+0500-052F;
}
```

### 3.1 Age gate

Soft splash, not blocking dialog. Single confirm dismisses for the device session.

**Anatomy.** Full-viewport overlay on `canvas`. Centered stack max-width 320, margin auto. Wordmark `display-lg` serif `ink`. "SEX SHOP" `overline` `ink-3`. Bronze hairline 1×48. One-sentence body `body` `ink-2`. Single primary button (`wine-500` fill, `canvas` text). "Leave" link below in `body-sm` `ink-3`.

**States.** Default → Confirmed (set sessionStorage `ae:age-confirmed`, fade out 280ms). Reduced motion skips fade.

**Strings.**

| Field | TR | EN | DE | RU |
|---|---|---|---|---|
| Body | Bu sayfa yetişkinler içindir. Devam etmek için 18 yaşından büyük olmanız gerekir. | This page is for adults. You must be 18 or older to continue. | Diese Seite ist für Erwachsene. Sie müssen 18 oder älter sein, um fortzufahren. | Эта страница для взрослых. Чтобы продолжить, вам должно быть 18 лет или больше. |
| CTA | 18 yaşından büyüğüm | I am 18 or older | Ich bin 18 oder älter | Мне 18 лет или больше |
| Leave | Çık | Leave | Verlassen | Покинуть |

**Overflow.** Body wraps to 4 lines max at `body` size. RU runs longest (~95 chars vs EN ~62). Reserve 4 × `body` line-height. CTA wraps to 2 lines if needed; never truncates.

### 3.2 Language switcher

Header dropdown. Codes only on the trigger; native names appear in the open panel.

**Trigger (rest).** Pill button, height 36, padding-x 12, radius `r-pill`. Inner row: 2-letter code (`ui-label`, `ink`) · 8px gap · chevron-down 14px. Border `hairline`, transparent bg. Min-width 56.

**Open panel.** Anchored to trigger right edge, 8px below. Width 200, padding 8, radius `r-lg`, bg `surface`, shadow `shadow-sheet`. Stack of 4 rows, 44 height each. Each row: code (`ui-label` `ink`) · 12px · native name (`body-sm` `ink-2`). **Active row:** `wine-100` fill, 2px `bronze-400` left rule, code in `wine-500`.

**States.**

| State | Trigger | Panel row |
|---|---|---|
| Rest    | Border `hairline`           | — |
| Hover   | Border `bronze-400`          | `bronze-50` bg |
| Focus   | 2px `wine-500` outline 2px offset | same |
| Open    | Border `bronze-400`, chevron rotate 180° | — |
| Active  | Trigger shows current code  | `wine-100` fill, bronze rule, wine-500 code |

**Native names.** TR Türkçe · EN English · DE Deutsch · RU Русский.

**Overflow.** Codes are fixed 2-letter ISO. Native names ≤8 chars — fit 200px panel at body-sm. Trigger never shows native name; code-only keeps width constant across languages.

### 3.3 QR landing hero

Above-the-fold of a product page reached via QR scan.

**Anatomy.** Full-bleed 1:1 product image. No overlay, no badge on image. Below: 24px top padding, 24 side gutters. Block: `overline` (category), 8px gap, `h1` serif (product name), 12px gap, `price` serif tabular, 16px gap, stock badge, 20px gap, curator note italic bronze.

**States.** Default static; loading shows skeleton (§3.14); image-failed shows bronze hairline rectangle 1:1 with serif `—` glyph in `ink-3`.

**Overflow.** `h1` wraps to 2 lines max, then `…`. At 375 viewport: ~28 EN chars / ~22 DE / ~24 RU. Reserve `h1 LH × 2 = 67px`.

### 3.4 Sticky header

Persistent across all pages except age gate. Wordmark left; utility cluster right.

**Anatomy.** Height 56 mobile / 72 desktop. Bg `canvas`/90% with `backdrop-filter: blur(12px)` past 8px scroll. Border-bottom `hairline-soft` (visible only when scrolled). Left: wordmark cluster — `Adam & Eve` `font-serif` 18 `ink` line-height 1, `SEX SHOP` `overline` 9 tracking 0.20em `ink-3` margin-top 2px. Right: row gap 8 — language switcher trigger (§3.2), search icon button (36×36), overflow `⋯` icon button (36×36).

**The `⋯` button opens the Settings sheet** (§3.18) which contains Gizli Mod, currency display preference (informational), and About. Gizli Mod is **not** in the header itself.

**States.**

| Element | Rest | Hover | Active | Focus |
|---|---|---|---|---|
| Wordmark | `ink` | n/a | n/a | n/a — not interactive |
| Search / overflow | `ink` icon | `bronze-400` | `wine-500` | 2px wine outline |

**Overflow.** Right-side buttons are icon-only — zero language risk. Wordmark width is fixed.

### 3.5 Breadcrumb

Single line above the hero on PDP. Bronze separators; no backgrounds.

**Anatomy.** `body-sm` `ink-3`. Padding 16/24/8/24. Separator `›` (U+203A) or chevron-right SVG, 8px h-margin, `bronze-400`. Last crumb (current page) `ink-2`, no link.

**Strings (sample path).**

| TR | Kategoriler › Wellness › Masaj Yağı |
| EN | Categories › Wellness › Massage Oil |
| DE | Kategorien › Wellness › Massageöl |
| RU | Категории › Велнес › Массажное масло |

**Overflow.** Collapse middle crumbs to ellipsis when total width > viewport - 48px gutters. Reserve ≥48px first crumb, ≥96px last; `…` between.

### 3.6 Category list (homepage primary nav)

Typography-led list; no thumbnails, no card chrome. Bronze hairlines between rows.

**Anatomy.** Full-width vertical stack, 24px side gutters. Each row 72 tall, padding-y 20. Row content: `h2` serif label `ink` left, chevron-right 18 `bronze-400` right. Optional `body-sm` `ink-3` count below label. Hairline (§hairline) between rows, full-width 1px.

**States.**

| State | Label | Chevron | Bg |
|---|---|---|---|
| Default | `ink` | `bronze-400` | transparent |
| Hover | `wine-500` | `wine-500` | transparent |
| Pressed | `wine-600` | `wine-600` | `bronze-50` (50ms tint) |

**Strings.**

| Slug | TR | EN | DE | RU |
|---|---|---|---|---|
| wellness | Wellness | Wellness | Wellness | Велнес |
| lingerie | İç Giyim | Lingerie | Dessous | Бельё |
| toys | Oyuncaklar | Toys | Spielzeug | Игрушки |
| accessories | Aksesuarlar | Accessories | Zubehör | Аксессуары |
| couples | Çiftler İçin | For Couples | Für Paare | Для пар |
| gifts | Hediyeler | Gifts | Geschenke | Подарки |

Count line: `12 ürün · 8 stokta` / `12 products · 8 in stock` / `12 Produkte · 8 verfügbar` / `12 товаров · 8 в наличии`.

**Count semantics.** The two numbers are **build-time content counts**, not runtime stock state — the homepage is fully prerendered and does not call the stock API.
- `total` = number of products in `src/content/products/*.json` whose `category_id` matches the row, regardless of `sold_out`.
- `inStock` = of those, the count where `sold_out !== true`. This is the count of products **available for inquiry at the boutique**, not a sum of in-stock variants. A product with one out-of-stock variant and three in-stock variants still counts as one in-stock product here.

The runtime per-variant stock is shown only on the PDP (§3.10). The homepage intentionally lags behind — daily inventory reality is a boutique-counter conversation, not a homepage banner. If a category has `total === 0` (no products yet authored), the row still renders with `0 products · 0 in stock` rather than being hidden — this keeps the six-row category architecture stable while the catalog fills in.

The `productCount` template in `ui.ts` is intentionally non-pluralizing ("1 products · 1 in stock") to keep the function pure and locale-stable. ICU plural rules are out of scope for v1; real catalog data will rarely have single-product categories.

**Overflow.** Single-line `h2`. If a future category exceeds budget, drop one type-step (`h3`) for the whole list rather than wrapping. Count line wraps to 2 lines max.

#### 3.6.1 Categories surface — homepage / index split (Task 11 acceptance)

§3.6 frames the category list as "the homepage primary nav." This was true through Task 10, when no separate categories surface existed. With Task 11 the catalog gains `/{lang}/categories/` as a dedicated index, and the homepage shifts to an editorial-only role. Recorded here so the next pass doesn't read §3.6 as contradicted.

**Where the category list now lives.**

- `/{lang}/categories/` — dedicated index. Hosts all six CategoryRows, the same build-time product/in-stock counts described in §3.6, and is the destination for the bottom-nav "Categories" slot.
- `/{lang}/categories/[slug]/` — per-category listing pages with editorial intro + product grid + filter sheet (Type chips suppressed via `showTypeFilter={false}` since the category is URL-pinned).

**What the homepage now hosts.**

- Editorial hero (overline + serif intro + scan hint), unchanged from §3.6.
- A single wine-fill primary CTA "View all categories" that navigates to `/{lang}/categories/`. Same visual treatment as PDP's "Add to Favorites" for consistency across wine-primary affordances.
- Boutique footer (location + hours).

**Why this is a clarifying note, not a contract change.** §3.6 prose describes the category-list anatomy and its build-time count semantics — both unchanged. What's new is *where the anatomy is rendered*, which §3.6 left implicit because no other surface existed at the time. The CategoryRow component, the build-time count compute, the typography-led treatment, and the chevron-bronze affordance are all preserved verbatim.

**Bottom-nav slot semantics resolved.** Per §3.11, the four bottom-nav slots are Home / Categories / Search / Favorites. Pre-Task-11, "Home" and "Categories" were redundant (both led to the same surface). Post-Task-11, they're distinct: Home is editorial, Categories is the directory. Resolves an ambiguity §3.11's anatomy table couldn't speak to.

### 3.7 Product card

Used in catalog grid contexts. Image-dominant.

**Anatomy.** Card width: 50% viewport minus gutters. 1:1 image at top. 12px gap. `overline` (category) `ink-3`, single line. 4px gap. `h3` serif product name `wine-500` (the only place name renders in wine — emphasis in catalog browse). 4px gap. `price` serif `ink` tabular. 6px gap. Curator note (`curator` token, `bronze-600`, italic, single line, truncate).

**States.**

| State | Image | Name | Card |
|---|---|---|---|
| Default | full opacity | `wine-500` | — |
| Hover | scale 1.02 / 280ms | `wine-600` | — |
| Pressed | scale 0.99 | `wine-700` | — |
| Out of stock | opacity 0.6 | unchanged | `caption` "Sold Out" between name and price in `danger.ink` |

**Overflow.** Name wraps to 2 lines max + ellipsis. Curator note single line + ellipsis. Reserve `h3 LH × 2 = 47px`.

### 3.8 Product detail page (PDP)

Hero workflow. Reached via QR scan or category navigation.

**Anatomy (top to bottom).**

1. Sticky header (§3.4)
2. Breadcrumb (§3.5)
3. Hero image carousel — 1:1, swipe paging, bronze pagination dots bottom-right at 24px
4. Category overline + h1 + price (§3.3 hero block)
5. Stock badge (§3.10)
6. Curator note italic bronze-600 single line, 16px gap below stock
7. Bronze hairline
8. Variant selector (§3.9), one per axis
9. Bronze hairline
10. Description body `body` `ink-2`, 1–3 paragraphs, no headings
11. Spec list `body-sm` two-column, hairline-soft between rows
12. Bronze hairline
13. Sticky bottom action bar — primary CTA (wine fill cream text) full-width minus gutters; ghost CTA "Ask at Boutique" with WhatsApp icon
14. Bottom nav (§3.11)

**Strings — sample.**

| Field | TR | EN | DE | RU |
|---|---|---|---|---|
| Description | Bedeninizi ve partnerinizin bedenini yumuşak, yavaş bir ritimle deneyimlemek için yağ. Yatak takımlarında leke bırakmaz. | An oil to slow you down — to map your body and your partner's at a softer tempo. Will not stain bedding. | Ein Öl, das Sie entschleunigt — um Ihren Körper und den Ihres Partners in ruhigerem Tempo zu erkunden. Hinterlässt keine Flecken. | Масло, которое замедляет — чтобы исследовать своё тело и тело партнёра в более мягком ритме. Не оставляет пятен. |
| Spec — Volume | Hacim | Volume | Volumen | Объём |
| Spec — Made in | Üretim | Made in | Hergestellt in | Произведено в |
| Primary CTA | Favorilere Ekle | Add to Favorites | Zu Favoriten hinzufügen | Добавить в избранное |
| Ghost CTA | Butikte Sor | Ask at Boutique | Im Shop fragen | Спросить в бутике |

**Overflow.** Primary CTA — DE "Zu Favoriten hinzufügen" 23 chars; reserve full-width minus 48px gutters. Button height grows from 56 to 76 if 2-line. RU 20 chars fits single-line. Ghost CTA always single line.

#### 3.8.1 PDP behavior refinements (Task 6 acceptance)

The implementation in `src/pages/[lang]/product/[slug].astro` and the components under `src/components/product/` resolved a few questions the prose left open. Recorded here so the next pass doesn't relitigate them.

**1. Variant selection state — component-local, not URL.** Selected variant ID is held in the chip's `aria-checked` attribute and a per-axis summary span; nothing is mirrored into the URL hash, query string, or `history.replaceState`. Rationale: variant choice is ephemeral guest input, never linked-to or shared (the QR resolves to the canonical PDP URL, not a pre-selected variant), and the boutique-handoff CTA is build-time-encoded with the product (not the variant) — so URL state would buy nothing and cost a navigation round-trip on every chip tap. Revisit only if a "share this variant" feature is requested.

**2. No-variant short-circuit — confirmed at the page level.** `[slug].astro` wraps `<VariantSelector>` and its preceding hairline in a `product.variants.length > 0 &&` guard. When the array is empty, neither the divider nor the section renders, and the description block butts directly against the curator note's hairline. Verified visually on `leather-blindfold` (4 locales).

**3. Sold-out product CTAs — kept visible.** §3.8 anatomy item 13 says the action bar holds primary + ghost CTAs. For a product-level `sold_out: true` (e.g., `ginger-warming-balm`), both CTAs remain rendered: "Add to Favorites" still works (favoriting a sold-out item is meaningful), and "Ask at Boutique" still composes a wa.me link (the concierge can confirm restock timing). Only the variant chips visually strike through. The earlier prose draft of §5.2.1 #4 implied "sold_out hides CTAs" — that was overscoped; we hide nothing, we just communicate the state via badge + chip strike.

**4. Soft-hyphen runtime behavior — observed, not always engaged.** Soft hyphens (`­`) in `name[lang]` are display-only typography hints; the browser breaks at one only when the line would otherwise overflow. Observed on the implemented PDPs at 375px width:
   - DE `silk-tie-set` ("Seidenschleifen-Set"): name fits the column, browser does not engage any soft hyphen — correct, no visible hyphen.
   - RU `silk-tie-set` ("Набор шёлковых лент"): wraps cleanly at the existing space, soft hyphens encoded but unused — correct, no visible hyphen.
   - DE `warming-massage-oil` ("Wärmendes Massageöl"): fits column at this width — correct.

   This is the intended behavior: soft hyphens are a safety net for narrower columns or longer runtime translations, not a forced break. The WhatsApp href strip (§3.20) ensures they never reach the encoded message text regardless. No fix needed.

**5. Favorites button paint — toggle is content-only, not color.** Active state swaps the heart `fill="currentColor"` and the label to `t.pdp.favorited`; the wine-500 background and cream label color are unchanged. Rationale: the button is the primary affordance and should remain visually dominant whether the item is favorited or not — a state-color flip would make a favorited PDP look subordinate, which inverts the hierarchy. The aria-pressed attribute carries the semantic state for assistive tech.

### 3.9 Variant selector — chip/swatch hybrid

Per variant axis (size, scent, color). Unavailable variants stay visible with diagonal strike — the guest can still ask at the boutique.

**Anatomy.** Section label `ui-label` `ink-2` left, current selection summary `body-sm` `ink-3` right. 12px gap. Horizontal flex-wrap chip row, 8px gap. Chip: height 40, padding-x 16, radius `r-pill`, border 1px, `ui-label` text. Color/material variants prepend an 18px circular swatch inside the chip.

**States.**

| State | Border | Bg | Label |
|---|---|---|---|
| Default | `hairline` | transparent | `ink` |
| Hover | `bronze-400` | `bronze-50` | `ink` |
| Selected | `wine-500` | `wine-100` | `wine-500` 500-weight |
| Pressed | `wine-600` | `wine-100` | `wine-600` |
| Unavailable | `hairline-soft` | transparent | `ink-3` 400, diagonal strike via `linear-gradient(135deg, transparent 47%, ink-3 47%, ink-3 53%, transparent 53%)` |
| Focus | 2px `wine-500` outline 2px offset | unchanged | unchanged |

**Axis labels.** Size/Beden/Größe/Размер. Scent/Koku/Duft/Аромат. Color/Renk/Farbe/Цвет. Volume/Hacim/Volumen/Объём. Material/Malzeme/Material/Материал.

**Overflow.** Flex-wrap absorbs growth. Section labels are short across all four languages. Strike pattern is CSS, language-independent.

### 3.10 Stock badge

Inline indicator beneath product name on PDP and inside product card on out-of-stock state.

**Anatomy.** Inline pill, height 24, padding-x 10, radius `r-pill`. Optional 6px circular marker at left, 8px gap to label. `caption` 500-weight.

**Variants.**

| Variant | Bg | Ink | Marker |
|---|---|---|---|
| In Stock              | `success.bg` | `success.ink` | `success.mark` |
| Last N                | `warning.bg` | `warning.ink` | `warning.mark` |
| Sold Out              | `danger.bg`  | `danger.ink`  | (no dot) |
| Available at Boutique | `info.bg` (`bronze-100`) | `info.ink` (`bronze-700`) | `info.mark` (`bronze-500`) |

**Strings.**

| Variant | TR | EN | DE | RU |
|---|---|---|---|---|
| In Stock     | Stokta              | In Stock              | Verfügbar          | В наличии     |
| Last N       | Son 2 adet          | Last 2 left           | Nur noch 2         | Осталось 2   |
| Sold Out     | Tükendi             | Sold Out              | Ausverkauft        | Распродано   |
| At Boutique  | Butikte mevcut      | Available at boutique | Im Shop verfügbar  | Есть в бутике |

**Overflow.** Single line, no wrap. Pill grows with content.

#### 3.10.1 PDP stock hydration (Task 7 acceptance)

The stock-fetch wiring shipped in `src/lib/stock.ts` and `src/components/product/StockHydrator.astro` resolved a few questions §3.10 and §5.4 left open. Recorded here so the next pass doesn't relitigate.

**1. Hydrator is a separate sibling component, not embedded in StockBadge.** `StockBadge.astro` stays purely presentational; the orchestration script lives in `StockHydrator.astro`, mounted only when `product.sold_out !== true`. Sold-out products skip the hydrator entirely — build-time render is final, no fetch needed. Per §3.8.1 #3, CTAs remain visible — only the runtime fetch is skipped.

**2. Variant chips signal availability via `data-available`, not class swap.** Per gotcha #6, chips never leave the DOM. The strike CSS keys off `[data-available="false"]`. A custom `ae:availability-change` event lets the selector re-pick a default if the previously-selected chip becomes unavailable. `aria-disabled` tracks the same state.

**3. 320px soft-hyphen behavior — observed.** `silk-tie-set` DE/RU at 320px:

- DE "Seidenband-Set" wraps at the literal hyphen (the soft hyphen in the JSON is encoded but not the active break; `productNameContainsSoftHyphen: true` in the verification log confirms the markup carries `­`, but the visible break is at the hard hyphen).
- RU "Шёлко­вые ленты — набор" wraps at the natural space adjacent to the em-dash; soft hyphens encoded but not engaged.

In both cases the WhatsApp `href` was confirmed clean of `­` per §3.20 strip rule. Tested in Chromium (puppeteer-core via headless Chrome). Firefox and Safari Cyrillic hyphenation are not regression-tested; if production telemetry reveals divergence, the fallback is a build-time strip of `­` from RU `name[lang]` with reliance on natural breaks only.

**4. Cache scope — module-scoped Map, 60s TTL, per JS context.** Hard navigations between PDPs reset the cache (intentional — each PDP visit gets fresh stock). Within a single page load the cache holds for 60s; unit-tested in `stock.test.ts` with fake timers. The verification harness confirms exactly one network request per page load.

**5. Fallback path — single try/catch + `AbortSignal.timeout(3000)`.** No client-side fail/delay simulation lives in `fetchStock`. Verified end-to-end against real network failures injected via puppeteer's `page.setRequestInterception`: network abort, HTTP 500, and delay > 3s all resolve to `available_at_boutique`. The production code path is the test path.

### 3.11 Bottom nav

The hardest overflow case. Persistent across all pages except age gate.

**Anatomy.** Height 64 + safe-area-inset-bottom. Bg `canvas`/95% with `backdrop-filter: blur(16px)`, border-top `hairline-soft`. Four equal columns. Each cell: stack center-aligned, 4px gap. Active indicator: 24×2 bronze rule above icon. Icon 22×22 line stroke. Label `nav-label` (11px tracking 0.01em), max-width 80.

**States.**

| State | Indicator | Icon | Label |
|---|---|---|---|
| Inactive | hidden | `ink-3` | `ink-3` |
| Active | `bronze-400` rule visible | `wine-500` | `wine-500` 500-weight |
| Pressed | rule darkens to `wine-500` | `wine-600` | `wine-600` |

**Strings.**

| Item | TR | EN | DE | RU |
|---|---|---|---|---|
| Home       | Ana Sayfa   | Home       | Startseite | Главная   |
| Categories | Kategoriler | Categories | Kategorien | Категории |
| Search     | Ara         | Search     | Suche      | Поиск     |
| Favorites  | Favoriler   | Favorites  | Favoriten  | Избранное |

**Overflow analysis at 375.** 375 ÷ 4 = 93.75 per cell. Subtract 8px h-padding each side and 4px safety = ~74px usable. At Inter 11/500, average char ≈ 6.4px. Longest:
- "Kategoriler" 11ch → 70px ✓
- "Startseite" 10ch → 64px ✓
- "Категории" Cyrillic ~ 65px ✓

The 11px label is the **only off-scale typographic decision in the system**. It exists specifically to make all four languages fit single-line at 375px. Do not raise it to match `ui-label`. Cell ≥44pt touch target preserved.

### 3.12 Filter bottom sheet

Opens from category list and search results. Type filter, price range, in-stock-only toggle. Live count CTA.

**Anatomy.** Sheet (§3.16) — 60% viewport height initial, swipe-up to 90%. Header: drag handle, h3 serif "Filter", close ×. Body padding 24. Group 1 Type — pill chips multi-select. Group 2 Price — dual-thumb slider, `bronze-400` track / `wine-500` active range. Group 3 In stock only — toggle. Footer sticky, padding 16/24, two buttons row: ghost "Reset" left (`ink-2`), primary "Show N results" wine fill full remaining width, count updates live.

**Strings.**

| Field | TR | EN | DE | RU |
|---|---|---|---|---|
| Title       | Filtrele       | Filter         | Filter             | Фильтр              |
| Type        | Tür            | Type           | Art                | Тип                 |
| Price range | Fiyat aralığı  | Price range    | Preisspanne        | Ценовой диапазон    |
| In stock    | Sadece stokta  | In stock only  | Nur verfügbar      | Только в наличии    |
| Reset       | Sıfırla        | Reset          | Zurücksetzen       | Сбросить            |
| CTA (count) | 24 ürünü göster| Show 24 results| 24 Ergebnisse zeigen | Показать 24       |

**Overflow.** Group labels short across all languages. CTA grows; reserve full-width minus reset (≈80px).

### 3.13 Empty states

Three variants. Typography-led, centered, never animated.

**Anatomy.** Center stack, max-width 280, margin auto, padding-y 64. Optional 32×32 line icon `bronze-400`. 16px gap. `h3` serif `ink-2` headline 1 line. 8px gap. `body-sm` `ink-3` body 2 lines max. 24px gap. Optional ghost button `wine-500`.

**Variants.**

| Variant | Icon | Headline | Body | CTA |
|---|---|---|---|---|
| No favorites | heart-line | "No favorites yet" | "Tap the heart on a product to save it for the boutique." | "Browse categories" |
| No results | magnifier | "Nothing matches that" | "Try a shorter search term or different category." | "Reset filters" |
| Offline | cloud-slash | "We're offline" | "Reconnect to view live stock." | (none) |

**Strings — favorites empty.**

| Field | TR | EN | DE | RU |
|---|---|---|---|---|
| Headline | Henüz favori yok | No favorites yet | Noch keine Favoriten | Пока нет избранного |
| Body | Bir ürünü kaydetmek için kalbe dokunun. | Tap the heart on a product to save it for the boutique. | Tippen Sie auf das Herz, um ein Produkt zu speichern. | Нажмите на сердце, чтобы сохранить товар. |
| CTA | Kategorilere göz at | Browse categories | Kategorien ansehen | Категории |

### 3.14 Skeleton loaders

Cream-on-ivory shimmer.

**Anatomy.** `surface` rectangles where content will appear, `r-md` matching eventual content. Shimmer overlay: 200%-wide horizontal gradient sliding L→R.
- Light: `linear-gradient(90deg, transparent 0%, rgba(249, 244, 236, 0.6) 50%, transparent 100%)`
- Dark: `linear-gradient(90deg, transparent 0%, rgba(38, 29, 20, 0.6) 50%, transparent 100%)`

Animation: 600ms infinite ease-in-out. `prefers-reduced-motion`: shimmer disabled, static rectangles only.

**Variants.** PDP hero: 1:1 square + 4 rows (overline 30%, h1 80%, h1 60%, price 25%). Category list: 6 rows, h2 50–70% randomized, hairline between. Product card: square + 3 short rows.

### 3.15 Toast

Minimal, ephemeral, bronze-accented.

**Anatomy.** Bottom-anchored, 16px above bottom nav, 24 side gutters, max-width 343. Padding 12/16, radius `r-md`. Bg `surface`, border-left 2px `bronze-400`, shadow `shadow-sheet`. Body row: 16px check icon `bronze-400`, 12px gap, message `body-sm` `ink-2`.

**States.** Enter slide-up 8px + fade in `dur-base` `ease-emphasis`. Visible 3000ms. Exit fade `dur-fast`. Reduced-motion: opacity only.

**Strings.** Added to favorites / Removed / Copied — see strings table in §3.18.

**Overflow.** 2 lines max then ellipsis.

### 3.16 Bottom sheet (generic)

Foundation for filter (§3.12) and Settings (§3.18).

**Anatomy.** Backdrop `rgba(42, 30, 22, 0.5)` (warm, not pure black) tap-to-dismiss. Sheet: bottom-anchored, full-width, max-height 90vh, radius `r-xl` top corners only, bottom corners 0. Bg `surface`, shadow `shadow-sheet`, border-top hairline-soft. Drag handle 40×4 `bronze-400` radius pill margin-y 12. Optional title row: padding 0/24/8/24, h3 left, close × right. Content scrollable padding 24. Optional sticky footer padding 16/24 + safe-area.

**States.** Enter translate from 100% to 0 in `dur-base` `ease-emphasis`. Drag-to-close: track finger, snap closed past 30%. Exit: translate 100% in `dur-fast`.

### 3.17 Stock-state visual logic

When stock data is missing or fetch fails (>3s timeout), default to **Available at Boutique** badge — never expose error chrome. Stock fetched at runtime per PDP mount, cached 60s.

State decision tree, runtime:

```
if fetch_failed or timeout    → "Available at Boutique" (info variant)
else if count == 0            → "Sold Out" (danger variant)
else if count <= 3            → "Last N left" (warning variant)
else                          → "In Stock" (success variant)
```

### 3.18 Settings sheet (replaces header Gizli Mod)

Opens from header `⋯` overflow icon. Hosts privacy, currency display preference (informational only — currency is locale-derived, not user-toggleable), and About.

**Anatomy.** Bottom sheet (§3.16). Title row "Settings". Three rows.

**Row 1 — Gizli Mod / Privacy mode.**

- Left stack: `body` 500 `ink` label · `body-sm` `ink-3` description, 1 line max.
- Right: toggle 44×24 track, 20 thumb, 2px padding.

Toggle states:

| State | Track | Thumb |
|---|---|---|
| Off (default) | `ink-3` 30% α | `canvas`, position left |
| On | `wine-500` | `canvas`, position right |
| Pressed | track darkens 20% | thumb scales 0.95 |
| Focus | 2px `wine-500` outline 2px offset | unchanged |

When ON: all product imagery receives `filter: blur(20px) saturate(0.8)`. Tap an image to reveal for 3000ms then auto-reblur. Setting persists per device via `localStorage` key `ae:gizli-mode`.

**Row 2 — About.** Tap-target row leading to a static About sheet (hotel boutique copy, hours, address). `body` 500 `ink` label, chevron-right `bronze-400`.

**Row 3 — Language (mirror).** Tap-target row that opens the language switcher panel (§3.2) — provides the redundant access path to language change for guests who don't notice the header pill.

**Strings.**

| Field | TR | EN | DE | RU |
|---|---|---|---|---|
| Title | Ayarlar | Settings | Einstellungen | Настройки |
| Privacy label | Gizli mod | Privacy mode | Privater Modus | Приватный режим |
| Privacy desc | Görselleri bulanıklaştır | Blur product images | Produktbilder unscharf | Размытие изображений |
| Reveal hint | Görmek için dokun | Tap to reveal | Tippen zum Anzeigen | Нажмите, чтобы увидеть |
| About | Hakkında | About | Über uns | О нас |
| Language | Dil | Language | Sprache | Язык |

**Overflow.** Description 2 lines max. RU description fits single line at body-sm in available column (~220px).

### 3.19 Sample CTAs and global strings

| Action | TR | EN | DE | RU |
|---|---|---|---|---|
| Add to Favorites | Favorilere Ekle | Add to Favorites | Zu Favoriten hinzufügen | Добавить в избранное |
| Remove from Favorites | Favorilerden Çıkar | Remove from Favorites | Aus Favoriten entfernen | Удалить из избранного |
| Ask at Boutique | Butikte Sor | Ask at Boutique | Im Shop fragen | Спросить в бутике |
| Search products | Ürün ara | Search products | Produkte suchen | Поиск товаров |
| Apply filters | Uygula | Apply | Anwenden | Применить |
| Reset | Sıfırla | Reset | Zurücksetzen | Сбросить |
| Close | Kapat | Close | Schließen | Закрыть |
| Show all | Tümünü göster | Show all | Alle anzeigen | Показать все |
| Added to favorites (toast) | Favorilere eklendi | Added to favorites | Zu Favoriten hinzugefügt | Добавлено в избранное |
| Removed (toast) | Kaldırıldı | Removed | Entfernt | Удалено |

### 3.20 WhatsApp deep-link template

| Locale | Template |
|---|---|
| TR | `Adam & Eve Sex Shop'tan {product.name} (SKU: {sku}) hakkında bilgi almak istiyorum.` |
| EN | `I'd like information about {product.name} (SKU: {sku}) from Adam & Eve Sex Shop.` |
| DE | `Ich hätte gerne Informationen zu {product.name} (SKU: {sku}) aus dem Adam & Eve Sex Shop.` |
| RU | `Я хотел бы получить информацию о {product.name} (SKU: {sku}) из магазина Adam & Eve Sex Shop.` |

URL: `https://wa.me/{HOTEL_WHATSAPP_NUMBER}?text={encodeURIComponent(template)}`. Composed at build time per product per locale; never at runtime.

**Soft-hyphen handling.** `product.name[locale]` may contain U+00AD soft hyphens at compound-word break points (especially DE / RU — see §6.9). These are display-only typography hints, not part of the canonical product name. The composer MUST strip them from the message text before `encodeURIComponent` so the concierge's WhatsApp inbox receives clean strings. The implementation in `src/i18n/whatsapp.ts` does `name.replaceAll("­", "")` at the message-build step. The `HOTEL_WHATSAPP_NUMBER` is normalized to digits only (`/[^\d]/g` stripped) per `wa.me` URL convention.

---

## 4. Sample screens

Two single-file HTML + Tailwind static mocks at 375px viewport ship alongside this spec, using the actual token hex values inline.

**`screen-a-product-detail.html` — QR-landed Product Detail (English).**

Demonstrates: sticky header with wordmark + visible language switcher trigger (rest state) + search + overflow icons; breadcrumb with bronze separators; full-bleed 1:1 hero image with bottom-right pagination dots; product header with overline, h1 product name in serif, price in serif tabular, stock badge in success green, single-line italic bronze curator note; two variant selector axes (Scent, Volume) showing default chip, selected chip in `wine-100/wine-500`, and unavailable chip with diagonal strike; description body in `ink-2`; spec list with hairline-soft separators; sticky bottom action bar with primary `wine-500` "Add to Favorites" CTA and ghost `wine-500` border "Ask at Boutique" with WhatsApp icon; bottom nav with Categories item active (bronze rule above + `wine-500` icon and label).

**`screen-b-homepage.html` — Homepage / Catalog landing (English).**

Demonstrates: same sticky header but with **language switcher in OPEN state** (chevron rotated, dropdown panel anchored top-right showing all four codes + native names with EN as the active row in `wine-100` fill + bronze left rule + wine-500 ink); editorial hero with "HOTEL BOUTIQUE" overline and 2-sentence serif curator note explaining the curation; bronze hairline; "EXPLORE" overline; six-row category list (Wellness, Lingerie, Toys, Accessories, For Couples, Gifts) — typography-only, no thumbnails, bronze hairlines between rows, h2 serif name + small caps count meta, bronze chevron right; bronze hairline; boutique location footer with hours; bottom nav with Home item active.

Both mocks render with Cormorant Garamond (Google Fonts) as serif and Inter Variable as sans; Tailwind 3 is loaded via CDN with the theme.extend block consuming the same hex values that ship in `tokens.css` and `tokens.json`.

---

## 5. Data contracts

The site is statically built. Product, category, and locale string content lives in JSON files inside `src/content/`. Stock is the only runtime data source.

### 5.1 Product schema

`src/content/products/<slug>.json`:

```json
{
  "id": "warming-massage-oil",
  "sku": "AE-WMO-100",
  "category": "wellness",
  "sort_order": 10,
  "active": true,
  "primary_image_index": 0,
  "images": [
    "/products/warming-oil-front.jpg",
    "/products/warming-oil-back.jpg",
    "/products/warming-oil-detail.jpg"
  ],
  "overline": {
    "tr": "Wellness · Yağ",
    "en": "Wellness · Oil",
    "de": "Wellness · Öl",
    "ru": "Велнес · Масло"
  },
  "name": {
    "tr": "Sıcak Masaj Yağı",
    "en": "Warming Massage Oil",
    "de": "Wär\u00ADmendes Massa\u00ADgeöl",
    "ru": "Согре\u00ADвающее массаж\u00ADное масло"
  },
  "description": {
    "tr": "Bedeninizi ve partnerinizin bedenini yumuşak, yavaş bir ritimle deneyimlemek için yağ. Yatak takımlarında leke bırakmaz.",
    "en": "An oil to slow you down — to map your body and your partner's at a softer tempo. Will not stain bedding.",
    "de": "Ein Öl, das Sie entschleunigt — um Ihren Körper und den Ihres Partners in ruhigerem Tempo zu erkunden. Hinterlässt keine Flecken.",
    "ru": "Масло, которое замедляет — чтобы исследовать своё тело и тело партнёра в более мягком ритме. Не оставляет пятен."
  },
  "curator_note": {
    "tr": "Mum ışığı için.",
    "en": "For candlelight.",
    "de": "Für Kerzenlicht.",
    "ru": "Для свечей."
  },
  "price": {
    "tr": { "currency": "TRY", "amount": 480.00, "display": "₺ 480,00" },
    "en": { "currency": "USD", "amount": 24.00, "display": "$ 24.00" },
    "de": { "currency": "EUR", "amount": 22.00, "display": "22,00 €" },
    "ru": { "currency": "RUB", "amount": 2200,  "display": "2 200 ₽" }
  },
  "variants": [
    {
      "axis": "scent",
      "label": { "tr": "Koku", "en": "Scent", "de": "Duft", "ru": "Аромат" },
      "options": [
        {
          "id": "amber-rose",
          "name": { "tr": "Amber Gül", "en": "Amber Rose", "de": "Amber-Rose", "ru": "Амбра и роза" }
        },
        {
          "id": "sandalwood",
          "name": { "tr": "Sandal Ağacı", "en": "Sandalwood", "de": "Sandelholz", "ru": "Сандал" }
        },
        {
          "id": "vetiver",
          "name": { "tr": "Vetiver", "en": "Vetiver", "de": "Vetiver", "ru": "Ветивер" }
        }
      ]
    },
    {
      "axis": "volume",
      "label": { "tr": "Hacim", "en": "Volume", "de": "Volumen", "ru": "Объём" },
      "options": [
        { "id": "50ml",  "name": { "tr": "50 ml",  "en": "50 ml",  "de": "50 ml",  "ru": "50 мл" } },
        { "id": "100ml", "name": { "tr": "100 ml", "en": "100 ml", "de": "100 ml", "ru": "100 мл" } }
      ]
    }
  ],
  "specs": [
    {
      "key": "volume",
      "label": { "tr": "Hacim", "en": "Volume", "de": "Volumen", "ru": "Объём" },
      "value": { "tr": "100 ml", "en": "100 ml", "de": "100 ml", "ru": "100 мл" }
    },
    {
      "key": "made_in",
      "label": { "tr": "Üretim", "en": "Made in", "de": "Hergestellt in", "ru": "Произведено в" },
      "value": { "tr": "Fransa", "en": "France", "de": "Frankreich", "ru": "Франция" }
    }
  ]
}
```

**Conventions.**

- `id` is the URL slug, kebab-case, ASCII only.
- `sku` is the boutique inventory identifier; appears in WhatsApp message templates.
- `sort_order` ascending; lower numbers appear earlier. Default 100; reserve 0–99 for editorial pinning.
- `active: false` excludes the product from build output entirely (no page generated, no nav appearance).
- `primary_image_index` selects which image is the QR-landing hero; the rest become carousel pages.
- `name` may include `\u00AD` (soft hyphen) at compound-word boundaries, especially in DE and RU. Soft hyphens are invisible at default rendering and let the browser break long compound nouns gracefully on narrow widths. Don't strip from data, don't index for search.
- `price.display` is pre-formatted by content; the build doesn't compute it. Keeps locale-specific number formatting (decimal comma in TR/DE/RU, period in EN; thousands space in RU; currency symbol position).
- Variant `id` must be kebab-case ASCII; appears in stock variant keys as `<axis-id>__<axis-id>` joined.

### 5.2 Category schema

`src/content/categories/categories.json`:

```json
[
  {
    "id": "wellness",
    "sort_order": 10,
    "active": true,
    "name":   { "tr": "Wellness",     "en": "Wellness",   "de": "Wellness",  "ru": "Велнес" }
  },
  {
    "id": "lingerie",
    "sort_order": 20,
    "active": true,
    "name":   { "tr": "İç Giyim",      "en": "Lingerie",   "de": "Dessous",   "ru": "Бельё" }
  },
  {
    "id": "toys",
    "sort_order": 30,
    "active": true,
    "name":   { "tr": "Oyuncaklar",    "en": "Toys",       "de": "Spielzeug", "ru": "Игрушки" }
  },
  {
    "id": "accessories",
    "sort_order": 40,
    "active": true,
    "name":   { "tr": "Aksesuarlar",   "en": "Accessories","de": "Zubehör",   "ru": "Аксессуары" }
  },
  {
    "id": "couples",
    "sort_order": 50,
    "active": true,
    "name":   { "tr": "Çiftler İçin",  "en": "For Couples","de": "Für Paare", "ru": "Для пар" }
  },
  {
    "id": "gifts",
    "sort_order": 60,
    "active": true,
    "name":   { "tr": "Hediyeler",     "en": "Gifts",      "de": "Geschenke", "ru": "Подарки" }
  }
]
```

### 5.2.1 Schema refinements (Task 4 acceptance)

The Zod implementation in `src/content/config.ts` is the runtime authority. Where it deviates from §5.1's narrative, the schema wins; the deviations are minor and intentional. Documented here so the next contributor doesn't relitigate them.

**1. Variant axis structure — confirmed.** Each axis has a kebab-case `id`, a localized `label` object (all four locales required), and a non-empty `options[]` array of at least 2 options (zod `.min(2)`). Each option has its own kebab-case `id`, localized `label`, and an `available: boolean` flag (default `true`) — see refinement #4 below for what the flag means. The earlier prose example in §5.1 elided the option-level `id` and `available` fields; both are required.

**2. `specs[]` — content-driven, not enumerated.** The schema accepts an arbitrary number of `{key, label, value}` entries per product, where `key` is a kebab-case ASCII slug for analytics/search, and `label` and `value` are both localized objects. Real catalog data will likely have 2–6 entries per product; the schema imposes no upper bound and no fixed key set. Sample products demonstrate the range: `volume / made-in / base / vegan` (massage oil), `material / made-in / care` (lace robe), `material / made-in / set-of` (tie set). Authors may invent new keys per product as needed.

**3. No-variant case — empty `variants[]`, single-SKU at product level.** A product with no choosable axes ships with `variants: []` (Zod default). Stock for such a product is keyed by the SKU only; there is no synthesized `default` variant key, no `_` placeholder. The runtime stock fetch (§5.4) for a no-variant SKU will return either a top-level `status` and `in_stock` count, **or** a `variants` map with a single entry under a sentinel key — this part is **subject to confirmation with the stock API owner** (see [SPEC-DISAGREEMENTS.md] open item, Task 4 §F-12). The PDP renders the stock badge directly without rendering a variant selector when `variants.length === 0`.

**4. `available` flag location — variant option level, plus runtime.** A variant option may carry `available: false` in its content JSON to mark a permanent or scheduled unavailability (e.g., "we will not stock Vetiver this season"). The PDP renders this option with the diagonal strike (§3.9 unavailable state) regardless of stock-fetch outcome. The runtime stock response in §5.4 may **also** mark a variant as `sold_out` based on live counts; the PDP must merge both signals — content-level `available: false` is sticky, runtime `sold_out` is a transient state that can clear next cache window. `sold_out: true` at the **product** level is a separate flag (used by `ginger-warming-balm` in samples) that hides "Add to Favorites" / "Ask at Boutique" CTAs and shows the danger badge across all variants.

**5. SKU format.** Uppercase ASCII, digits, and hyphens only (`/^[A-Z0-9-]+$/`). The boutique inventory's prior convention (`AE-WMO-100`) is preserved — the prefix `AE-` is informal and not enforced by Zod; mixing prefixes is permitted if the boutique adopts a different one later.

**6. Currency-locale binding — strict.** The Zod schema enforces `tr → TRY`, `en → USD`, `de → EUR`, `ru → RUB` via per-locale `.refine()`. The spec text says "currency is locale-derived"; the schema makes that machine-checkable.

**7. Strict mode.** Every object schema is `.strict()` — unknown keys are rejected at build time. Adding a new field requires updating the schema; this is intentional friction to prevent silent drift between content and code.

### 5.3 UI strings

`src/i18n/ui.ts`:

```ts
export const ui = {
  tr: {
    nav: { home: "Ana Sayfa", categories: "Kategoriler", search: "Ara", favorites: "Favoriler" },
    cta: { add_to_fav: "Favorilere Ekle", remove_from_fav: "Favorilerden Çıkar", ask_at_boutique: "Butikte Sor" },
    stock: { in_stock: "Stokta", last_n: (n: number) => `Son ${n} adet`, sold_out: "Tükendi", at_boutique: "Butikte mevcut" },
    // ...
  },
  en: { /* ... */ },
  de: { /* ... */ },
  ru: { /* ... */ },
} as const;
```

### 5.4 Runtime stock contract

`GET /api/stock?sku=<sku>` → `{ sku, variants, fetched_at }`:

```json
{
  "sku": "AE-WMO-100",
  "variants": {
    "amber-rose__100ml": { "in_stock": 3, "status": "last_n" },
    "amber-rose__50ml":  { "in_stock": 8, "status": "in_stock" },
    "sandalwood__100ml": { "in_stock": 0, "status": "sold_out" },
    "vetiver__100ml":    { "in_stock": null, "status": "available_at_boutique" }
  },
  "fetched_at": "2026-04-28T14:32:00Z"
}
```

`status` is a string enum: `in_stock` | `last_n` | `sold_out` | `available_at_boutique`. Computed server-side from raw counts so the client doesn't decide thresholds.

Variant keys join axis option IDs with `__`. Order follows the `variants[]` array order in the product file. If a SKU has only one axis, the key is just that axis's option ID.

Cache 60s on the client. Timeout 3s. On failure, fall back to `available_at_boutique` for all variants — never surface error UI.

### 5.5 Environment variables

| Var | Type | Example |
|---|---|---|
| `HOTEL_WHATSAPP_NUMBER` | string E.164 | `+905321234567` |
| `HOTEL_NAME` | string | `Adam & Eve Hotel Belek` |
| `HOTEL_BOUTIQUE_LOCATION_TR` | string | `Lobi katı` |
| `HOTEL_BOUTIQUE_LOCATION_EN` | string | `Lobby level` |
| `HOTEL_BOUTIQUE_LOCATION_DE` | string | `Lobby-Ebene` |
| `HOTEL_BOUTIQUE_LOCATION_RU` | string | `Уровень лобби` |
| `HOTEL_HOURS_OPEN` | HH:MM | `09:00` |
| `HOTEL_HOURS_CLOSE` | HH:MM | `23:00` |
| `STOCK_API_URL` | URL | `https://stock.example.com/api/stock` |
| `SITE_URL` | URL | `https://shop.adam-eve-hotels.com` |

All env vars are read at build time. The runtime stock fetch is the only network call from the client — `STOCK_API_URL` is exposed via a build-injected constant, not a runtime env read.

### 5.6 Build-time vs runtime data split

| Data | Source | Phase | Cached |
|---|---|---|---|
| Product names, descriptions, prices, curator notes | JSON content | Build time | Static HTML |
| Category list, sort order | JSON content | Build time | Static HTML |
| Product images | `/public/products/` | Build time | Static asset (CDN) |
| WhatsApp deep-link href | Per locale × product | Build time | Static HTML |
| Hotel hours, address, phone | Env vars | Build time | Static HTML |
| Stock counts | Stock API | Runtime | 60s client memo |
| Favorites | Device storage | Runtime | localStorage `ae:favorites` |
| Age-gate confirmation | Device storage | Runtime | sessionStorage `ae:age-confirmed` |
| Gizli Mod state | Device storage | Runtime | localStorage `ae:gizli-mode` |

---

## 6. Implementation notes

### 6.1 Stack

Astro 5 (static site generation) + Tailwind 3. Node 20 LTS (>= 20.11). The site outputs as plain HTML + minimal JS (only stock fetching, age gate, language switcher, favorites store, Gizli Mod toggle).

### 6.2 Multi-language URL pattern

Astro native i18n configured for default `en` with locales `["tr", "en", "de", "ru"]`. Routing is `/tr/`, `/en/`, `/de/`, `/ru/` — every path is prefixed, including the default. Root `/` resolves via build-time redirect to `/en/` (the longest English baseline is shortest in characters, so a guest who lands rootless gets the English variant; the QR codes always include the locale prefix and never hit the root).

```js
// astro.config.mjs (excerpt)
i18n: {
  locales: ["tr", "en", "de", "ru"],
  defaultLocale: "en",
  routing: { prefixDefaultLocale: true },
}
```

Each page receives `lang` from `Astro.currentLocale` and reads from `ui[lang]` for chrome strings, from product `name[lang]`, etc.

### 6.3 Language-specific QR strategy

QR codes are generated once at hotel-onboarding time per product per locale and printed on shelf cards in the boutique. URL pattern: `https://{SITE_URL}/{lang}/product/{slug}`. Hotel staff selects the right printed sticker variant based on the guest's check-in language preference. The site does no language detection; the URL is authoritative.

### 6.4 Runtime stock fetch

In each PDP, on mount: `fetch('${STOCK_API_URL}?sku=${sku}', { signal: AbortSignal.timeout(3000) })`. Result memoized in module-scoped `Map<sku, {data, fetchedAt}>` for 60s. UI renders skeleton stock badge while pending; on resolution, sets badge variant per the `status` field. On rejection, sets `available_at_boutique` and continues. No retry — the boutique is downstairs.

### 6.5 Age gate persistence

`sessionStorage.setItem('ae:age-confirmed', '1')` on confirm. On every page load, check the flag; if absent, mount the age-gate overlay. SessionStorage clears when the browser tab closes — guests who close the page get the gate again on next QR scan, which is the intended legal posture (per-session courtesy, not a permanent dismissal).

### 6.6 Favorites store

`localStorage.setItem('ae:favorites', JSON.stringify(['sku1', 'sku2']))`. Favorites page reads + filters the static product list against this array. No server, no auth, no sync. If the guest changes device, favorites don't follow — that's the intended model. Listed in spec because engineers will reflexively want to add an account system; please don't.

### 6.7 Gizli Mod implementation

`localStorage.setItem('ae:gizli-mode', 'on' | 'off')`. Persistent across sessions per device. Default 'off'. When 'on', a `<html data-blur="on">` attribute is set; CSS rule `html[data-blur="on"] img.product-image { filter: blur(20px) saturate(0.8) }` does the visual work. Tap-to-reveal: a click handler on `.product-image` toggles a `.revealed` class for 3000ms, which un-applies the blur. CSS:

```css
html[data-blur="on"] img.product-image:not(.revealed) {
  filter: blur(20px) saturate(0.8);
  transition: filter var(--ae-dur-base) var(--ae-ease-standard);
}
```

### 6.8 Cyrillic italic fallback technique

See §3.0. The `unicode-range`-scoped `@font-face` lives in `tokens.css` and is loaded once. No JS, no locale check — the browser swaps faces by codepoint. Lora Italic and Cormorant Garamond Italic ship as self-hosted woff2 in `/public/fonts/`. Self-hosted because the Google Fonts CSS for Lora doesn't expose `unicode-range` per-subset in a way that composes cleanly with Cormorant's Latin coverage.

### 6.9 Soft-hyphen convention

Long compound nouns in DE/RU product names embed `\u00AD` at safe break points (e.g., `Wär\u00ADmendes Massa\u00ADgeöl`). Browsers render the hyphen only when wrap occurs at that boundary, so on wide layouts the name looks intact. Authors edit content as plain JSON; soft hyphens are stored as `\u00AD` escape sequences. Don't strip them in build, don't index them for search (search uses a normalized text field that is `name.replaceAll('\u00AD', '')` at build time).

### 6.10 Performance posture

Single-file mocks load Tailwind via CDN; production uses Tailwind 3 with PostCSS, processed at build, JIT-purged to the static HTML. Total CSS budget ≤30KB gzipped. JS budget ≤15KB gzipped (only the stock fetch, age gate, lang switcher, favorites, Gizli Mod). Fonts: Cormorant Garamond and Inter (Google Fonts), Lora Italic and Cormorant Italic (self-hosted), `font-display: swap` everywhere. Hero images: 1:1 JPEG/WebP, 1024×1024 max, LCP-budgeted.

### 6.11 Accessibility floor

WCAG 2.1 AA across light + dark modes (verified §2.1 / §2.2). Touch targets ≥44pt. Focus rings: 2px `wine-500` at 2px offset (light), 2px `bronze-600` at 2px offset (dark). `prefers-reduced-motion: reduce` collapses durations to 1ms. Screen-reader landmarks: `<header>`, `<main>`, `<nav aria-label="Primary">` (bottom nav), `<nav aria-label="Breadcrumb">`. Language switcher uses `aria-expanded`, `aria-controls`, and `aria-current="true"` on the active row. Variant chips use `aria-pressed` for selection, `aria-disabled="true"` + visible diagonal strike for unavailable.

### 6.12 Dark mode toggle

Driven by `[data-theme="dark"]` on `<html>`. **No `prefers-color-scheme` auto-switch** — explicit only. The hotel-room context is unpredictably lit; a toggle that respects guest preference wins over a heuristic. Toggle lives in the Settings sheet (§3.18) as a future addition; v1 ships light-only and we add the dark toggle in v1.1.

---

End of specification v1.0.

Companion files:
- `tokens.css` — CSS custom properties source of truth
- `tailwind.config.mjs` — Tailwind theme.extend consuming tokens
- `tokens.json` — DTCG flat tree export
- `screen-a-product-detail.html` — sample mock at 375px
- `screen-b-homepage.html` — sample mock at 375px
- `design-handoff.md` — implementation brief for Code
