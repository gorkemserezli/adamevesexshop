# Adam & Eve Sex Shop — component inventory

Part 2 of the design system. Every component is specified with anatomy, states, four-language sample strings, and per-component overflow rules. The longest of TR/EN/DE/RU governs layout — never the English baseline.

---

## 0. Cross-cutting language overflow rules

### 0.1 Length budget

Reserve **1.5× the English character count** for every text-bearing surface. This is the practical headroom that absorbs Russian (typically +30–45%), German compounds (+25–40%), and Turkish agglutination (+15–30%) without reflow.

| Component class | EN baseline (chars) | Reserved budget | Strategy |
|---|---|---|---|
| Inline label (chip, badge, button) | 4–14 | 1.5× | Single line; do not truncate |
| Display heading (product name) | 14–28 | 1.4× | Wrap to max 2 lines, then truncate with serif ellipsis |
| Body paragraph | open | open | Wrap freely |
| Bottom-nav label | 4–10 | exact fit | Drop to 11px with `letter-spacing: 0.01em`; never wrap |
| Curator note | 40–60 | 1.4× | Wrap to max 2 lines, then truncate |
| Category-list row label | 6–14 | 1.5× | Single line; if exceeds, drop one type-step |

### 0.2 Cyrillic italic in Cormorant Garamond — fallback

**Issue.** Cormorant Garamond's Cyrillic italic is incomplete and inconsistent. Several letters (`т`, `д`, `п`, `г`, `к`) render as mechanically slanted upright glyphs rather than true italic letterforms. In a curator-note context, where italic is doing meaningful editorial work, this reads as broken type — particularly damaging on a brand that puts type at the center.

**Fallback strategy — `unicode-range`-scoped face.** Lora has a complete, properly drawn Cyrillic italic with the correct italic letterforms, pairs aesthetically with Cormorant (both warm, slightly weathered serifs in the same weight class), and ships full Latin Extended + Cyrillic via Google Fonts. We load Lora *only* for Cyrillic codepoints, so Latin/Latin-Extended continues to render in Cormorant and only Russian italics swap.

```css
@font-face {
  font-family: "AE Serif Italic";
  src: local("Cormorant Garamond Italic"),
       url("/fonts/cormorant-garamond-italic.woff2") format("woff2");
  font-style: italic;
  font-weight: 400;
  unicode-range: U+0000-024F, U+1E00-1EFF; /* Latin + Latin Extended */
}

@font-face {
  font-family: "AE Serif Italic";
  src: url("/fonts/lora-italic.woff2") format("woff2");
  font-style: italic;
  font-weight: 400;
  unicode-range: U+0400-04FF, U+0500-052F; /* Cyrillic + Cyrillic Supplement */
}

.curator-note { font-family: "AE Serif Italic", serif; font-style: italic; }
```

This is browser-native font fallback by codepoint — no JS, no locale check. A single `<em>` tag in any language produces correct italics without the designer caring.

**Visual matching.** Lora at 14px optically reads ~1pt larger than Cormorant. Compensate with `font-size-adjust: 0.48` on `.curator-note` so x-heights normalize across the two faces. Test in dark mode; Lora's slightly higher contrast can dominate at low light.

**Roman (non-italic) Cyrillic** stays in Cormorant Garamond — its Cyrillic regular is acceptable and we don't gain enough by swapping it to justify a second face for non-italic.

---

## 1. Age gate

A soft splash, not a blocking dialog. The hotel guest is already 18+; this is legal courtesy. A single confirm tap dismisses it permanently for the device.

**Anatomy**

- Full-viewport overlay on `canvas` `#F9F4EC`
- Centered stack, max-width 320px, margin auto
- Wordmark `display-lg` serif `ink`
- Subtitle "SEX SHOP" `overline` `ink-3`
- Bronze hairline divider, 1px × 48px
- Single line of body `body` `ink-2`: a one-sentence age statement
- Single primary button "I am 18 or older" — wine fill, cream text
- Tertiary "Leave" link below in `body-sm` `ink-3`

**States**

| State | Notes |
|---|---|
| Default | Static; no entry animation longer than `dur-base` opacity fade |
| Confirmed | Set `localStorage` flag, fade out 280ms, reveal page |
| Reduced motion | Skip fade; immediate hide |

**Strings**

| Field | TR | EN | DE | RU |
|---|---|---|---|---|
| Body | Bu sayfa yetişkinler içindir. Devam etmek için 18 yaşından büyük olmanız gerekir. | This page is for adults. You must be 18 or older to continue. | Diese Seite ist für Erwachsene. Sie müssen 18 oder älter sein, um fortzufahren. | Эта страница для взрослых. Чтобы продолжить, вам должно быть 18 лет или больше. |
| CTA | 18 yaşından büyüğüm | I am 18 or older | Ich bin 18 oder älter | Мне 18 лет или больше |
| Leave | Çık | Leave | Verlassen | Покинуть |

**Overflow.** Body line wraps to max 4 lines at `body` size. RU runs longest (~95 chars vs EN ~62); reserve 4 lines × 320px. Button wraps to 2 lines if needed but never truncates.

---

## 2. Language switcher

Header dropdown. Codes only, never flags. Native names appear in the open panel as a recognition aid.

**Anatomy — trigger (rest)**

- Pill button, height 36, padding-x 12, radius `r-pill`
- Inner row: 2-letter code (`ui-label`, `ink`) · 8px gap · chevron-down 14px
- Border `hairline`; bg transparent
- Min-width 56px (fits longest code at scale)

**Anatomy — open panel**

- Anchored to trigger right edge, top offset 8px
- Width 200px, padding 8px, radius `r-lg`, bg `surface`, shadow `shadow-sheet`
- Stack of 4 rows, height 44 each (touch target)
- Each row: code (`ui-label` ink) · 12px gap · native name (`body-sm` `ink-2`)
- Active row: `wine-100` fill (light) / `wine-soft` fill (dark); 2px `bronze-400` left rule; code in `wine-500`

**States**

| State | Trigger | Panel row |
|---|---|---|
| Rest | Border `hairline`, ink text | — |
| Hover | Border `bronze-400`, ink text | bg `bronze-50` |
| Focus | 2px `wine-500` outline at 2px offset | Same |
| Open | Border `bronze-400`, chevron rotates 180° | — |
| Active (selected) | n/a (closed state shows current) | `wine-100` fill, bronze left rule, `wine-500` code |
| Disabled | n/a | n/a |

**Strings**

| Code | Native name shown in panel |
|---|---|
| TR | Türkçe |
| EN | English |
| DE | Deutsch |
| RU | Русский |

**Overflow.** Codes are fixed 2-letter ISO. Native names max 8 characters — comfortably fits 200px panel at `body-sm`. Trigger never shows native name; code-only keeps width constant across languages.

---

## 3. QR landing hero

Above-the-fold of a product page when the guest arrives via in-boutique QR scan. The product *is* the experience; chrome retreats.

**Anatomy**

- Full-bleed 1:1 product image, edge to viewport
- No overlay, no caption, no badge on image — the product carries itself
- Below image: 24px top padding, 24px side gutters
- Block: `overline` (category, e.g., "WELLNESS · OIL"), 8px gap, `h1` serif (product name), 12px gap, `price` serif tabular, 16px gap, stock badge, 20px gap, curator note italic bronze

**States**

| State | Notes |
|---|---|
| Default | Static, no auto-play, no carousel auto-advance |
| Loading | Skeleton (see §14) — image: ivory rect; text: cream-on-ivory shimmer rows |
| Image failed | Bronze hairline rectangle 1:1 with centered serif "—" glyph in `ink-3` |

**Overflow.** Product names can run long in DE (compound nouns) and RU. `h1` wraps to max 2 lines, then truncates with `…`. At 375px, that's ~28 EN chars / ~22 DE chars / ~24 RU chars before wrap. Reserve `h1 line-height × 2 = 67.2px` of vertical space for the name regardless of length.

---

## 4. Sticky header

Persistent header across all pages. Wordmark left; utility cluster right. Gizli Mod is **not** here — it lives behind the overflow icon's settings menu.

**Anatomy**

- Height 56 mobile, 72 desktop
- Background `canvas` with `backdrop-filter: blur(12px)` once user scrolls > 8px
- Border-bottom `hairline-soft` (visible only when scrolled)
- Left: wordmark cluster
  - "Adam & Eve" `font-serif` 18px `ink`, line-height 1
  - "SEX SHOP" `overline` 9px tracking 0.20em `ink-3`, margin-top 2px
- Right cluster: row, gap 8
  - Language switcher trigger (see §2)
  - Search icon button (36×36, no bg)
  - Overflow ⋯ icon button (36×36, no bg) — opens settings sheet containing Gizli Mod, currency display preference (informational only), about

**States**

| Element | Rest | Hover | Active | Focus |
|---|---|---|---|---|
| Wordmark | `ink` | n/a | n/a | n/a — not interactive |
| Search/overflow | `ink` icon | `bronze-400` icon | `wine-500` icon | 2px wine outline |

**Strings.** No header copy except the wordmark itself, which is identical in all four languages. The "Sex Shop" subline is identical per the brief.

**Overflow.** Header content is icon-only on the right, so localization risk is zero. Wordmark width is fixed.

---

## 5. Breadcrumb

Single line above the hero on PDP. Bronze separators; no backgrounds.

**Anatomy**

- `body-sm` `ink-3`, padding 16/24/8/24
- Crumb separator: bronze `›` (U+203A) or chevron-right SVG, 8px horizontal margin, `bronze-400`
- Last crumb (current page) `ink-2`, no link
- Truncate middle crumbs to first/last with `…` between if total exceeds viewport

**States**

| State | Color |
|---|---|
| Link | `ink-3` |
| Hover | `wine-500` |
| Current | `ink-2` |

**Strings (sample path Categories › Wellness › Massage Oil)**

| TR | Kategoriler › Wellness › Masaj Yağı |
| EN | Categories › Wellness › Massage Oil |
| DE | Kategorien › Wellness › Massageöl |
| RU | Категории › Велнес › Массажное масло |

**Overflow.** When total crumb width > viewport — 48px gutters, collapse middle crumbs. Reserve at least 48px for first crumb and 96px for last; `…` between.

---

## 6. Category list (homepage primary nav)

Typography-led list; no thumbnails, no card chrome. Bronze hairlines between rows. The site's primary navigation gesture.

**Anatomy**

- Full-width vertical stack, 24px side gutters
- Each row: 72px tall, padding-y 20px, padding-x 0
- Row content: `h2` serif label `ink` left, chevron-right 18px `bronze-400` right
- Optional `body-sm` `ink-3` count below label (e.g., "12 products / 8 in stock")
- Hairline-soft separator between rows, full-width, 1px

**States**

| State | Label | Chevron | Bg |
|---|---|---|---|
| Default | `ink` | `bronze-400` | transparent |
| Hover | `wine-500` | `wine-500` | transparent |
| Pressed | `wine-600` | `wine-600` | `bronze-50` (50ms tint) |

**Strings (sample categories)**

| Slug | TR | EN | DE | RU |
|---|---|---|---|---|
| wellness | Wellness | Wellness | Wellness | Велнес |
| lingerie | İç Giyim | Lingerie | Dessous | Бельё |
| toys | Oyuncaklar | Toys | Spielzeug | Игрушки |
| accessories | Aksesuarlar | Accessories | Zubehör | Аксессуары |
| couples | Çiftler İçin | For Couples | Für Paare | Для пар |
| gifts | Hediyeler | Gifts | Geschenke | Подарки |
| count-line | 12 ürün · 8 stokta | 12 products · 8 in stock | 12 Produkte · 8 verfügbar | 12 товаров · 8 в наличии |

**Overflow.** Single-line `h2` labels. Longest at 22px serif: "Aksesuarlar" / "Accessories" / "Accessoires" / "Аксессуары" — all comfortably under 240px at this size. If a future category exceeds, drop one type-step (`h3`) for the whole list rather than wrapping. Count line allowed to wrap to 2 lines max.

---

## 7. Product card

Used only in catalog grid contexts. Image-dominant, type-quiet.

**Anatomy**

- Full card width: 50% of viewport minus gutters (mobile 2-up grid)
- 1:1 image at top, no border, sits on `canvas`
- 12px gap below image
- `overline` (category) `ink-3`, single line
- 4px gap
- `h3` serif product name `wine-500` (specifically ink-on-cream wine, not the body ink — the only place product names take wine)
- 4px gap
- `price` serif `ink` tabular
- 6px gap
- Curator note line (`curator-note`, `bronze-600`, italic, single line, truncate)

**States**

| State | Image | Name | Card |
|---|---|---|---|
| Default | full opacity | `wine-500` | — |
| Hover | image scale 1.02 over 280ms | `wine-600` | — |
| Pressed | scale 0.99 | `wine-700` | — |
| Out of stock | image opacity 0.6 | name unchanged | `caption` "Sold Out" appears between name and price in `danger.ink` |

**Strings (sample card)**

| Field | TR | EN | DE | RU |
|---|---|---|---|---|
| Overline | WELLNESS · YAĞ | WELLNESS · OIL | WELLNESS · ÖL | ВЕЛНЕС · МАСЛО |
| Name | Sıcak Masaj Yağı | Warming Massage Oil | Wärmendes Massageöl | Согревающее массажное масло |
| Price | ₺ 480,00 | $24.00 | 22,00 € | 2 200 ₽ |
| Curator note | Mum ışığı için. | For candlelight. | Für Kerzenlicht. | Для свечей. |

**Overflow.** Name wraps to 2 lines max, then ellipsis. Curator note single line, ellipsis. RU name "Согревающее массажное масло" is 26 chars — at `h3` serif wraps to 2 lines on a 50%-viewport card, which is acceptable. Reserve `h3 lh × 2 = 47px` regardless of locale.

---

## 8. Product detail page (PDP)

The hero workflow. Reached via QR scan or category navigation.

**Anatomy (top to bottom)**

1. Sticky header (§4)
2. Breadcrumb (§5)
3. Hero image carousel — 1:1 frame, swipe paging, 6px-tall bronze pagination dots below right-aligned at 24px from edge
4. Category overline + h1 product name + price (§3 hero block)
5. Stock badge (§10)
6. Curator note line — italic, bronze-600, single line, displayed beneath the stock badge with 16px gap
7. Bronze hairline (full-width, within 24px gutters)
8. Variant selector (§9), one selector per variant axis
9. Bronze hairline
10. Description block — `body` `ink-2`, no headings, 1–3 paragraphs
11. Spec list — `body-sm` two-column key/value pairs, 24px row gap, hairline-soft between rows
12. Bronze hairline
13. Sticky bottom action bar — primary CTA "Add to Favorites" (wine fill cream text) full width minus gutters; ghost CTA "Ask at Boutique" with WhatsApp icon below it
14. Bottom nav (§11)

**States** — see component-specific entries.

**Strings**

| Field | TR | EN | DE | RU |
|---|---|---|---|---|
| Description body sample | Bedeninizi ve partnerinizin bedenini yumuşak, yavaş bir ritimle deneyimlemek için yağ. Yatak takımlarında leke bırakmaz. | An oil to slow you down — to map your body and your partner's at a softer tempo. Will not stain bedding. | Ein Öl, das Sie entschleunigt — um Ihren Körper und den Ihres Partners in ruhigerem Tempo zu erkunden. Hinterlässt keine Flecken auf der Bettwäsche. | Масло, которое замедляет — чтобы исследовать своё тело и тело партнёра в более мягком ритме. Не оставляет пятен на постельном белье. |
| Spec — Volume | Hacim | Volume | Volumen | Объём |
| Spec — Origin | Üretim | Made in | Hergestellt in | Произведено в |
| Primary CTA | Favorilere Ekle | Add to Favorites | Zu Favoriten hinzufügen | Добавить в избранное |
| Ghost CTA | Butikte Sor | Ask at Boutique | Im Shop fragen | Спросить в бутике |

**Overflow.** Primary CTA — German variant "Zu Favoriten hinzufügen" is 23 chars; reserve full-width minus 48px gutters, button wraps to 2 lines if needed (button height grows from 56 to 76). Russian "Добавить в избранное" is 20 chars and fits single-line. Ghost CTA always single line.

---

## 9. Variant selector — chip/swatch hybrid

Per variant axis (size, scent, color, etc.). Unavailable variants stay visible with a diagonal strike rather than disappearing — the guest can still ask at the boutique.

**Anatomy**

- Section label `ui-label` `ink-2` left, current selection summary `body-sm` `ink-3` right ("Size · M")
- 12px gap below
- Horizontal flex-wrap chip row, 8px gap, padding-y 0
- Chip: height 40, padding-x 16, radius `r-pill`, border 1px, `ui-label` text
- For color/material variants, prepend an 18px circular swatch inside the chip

**States**

| State | Border | Bg | Label |
|---|---|---|---|
| Default | `hairline` (bronze 30%) | transparent | `ink` |
| Hover | `bronze-400` | `bronze-50` | `ink` |
| Selected | `wine-500` | `wine-100` | `wine-500` 500-weight |
| Pressed | `wine-600` | `wine-100` | `wine-600` |
| Unavailable | `hairline-soft` | transparent | `ink-3` 400-weight, with diagonal strike `linear-gradient(135deg, transparent 47%, ink-3 47%, ink-3 53%, transparent 53%)` |
| Focus | 2px `wine-500` outline 2px offset | unchanged | unchanged |

**Strings (sample size axis)**

| Axis label | TR | EN | DE | RU |
|---|---|---|---|---|
| Size | Beden | Size | Größe | Размер |
| Scent | Koku | Scent | Duft | Аромат |
| Color | Renk | Color | Farbe | Цвет |
| Volume | Hacim | Volume | Volumen | Объём |
| Material | Malzeme | Material | Material | Материал |

**Overflow.** Chip widths vary; flex-wrap absorbs growth. Section labels are short across all four languages. The diagonal-strike pattern is generated in CSS, language-independent.

---

## 10. Stock badge

Small inline indicator beneath product name on PDP and inside product card on out-of-stock state. Restrained — calibrated to coexist with the wine/bronze foundation.

**Anatomy**

- Inline pill, height 24, padding-x 10, radius `r-pill`
- Optional 6px circular marker dot at left, 8px gap to label
- Label `caption` 500-weight

**Variants**

| Variant | Bg | Ink | Marker |
|---|---|---|---|
| In Stock | `success.bg` `#E5E8D9` | `success.ink` `#3F4933` | `success.mark` `#5C6B4A` |
| Last N | `warning.bg` `#F2E2BD` | `warning.ink` `#6B4A1E` | `warning.mark` `#A87830` |
| Sold Out | `danger.bg` `#ECCFC4` | `danger.ink` `#7A3525` | (no dot) |
| Available at Boutique | `bronze-100` `#ECDCBA` | `bronze-700` `#564220` | `bronze-500` `#8C6D40` |

**Strings**

| Variant | TR | EN | DE | RU |
|---|---|---|---|---|
| In Stock | Stokta | In Stock | Verfügbar | В наличии |
| Last N | Son 2 adet | Last 2 left | Nur noch 2 | Осталось 2 |
| Sold Out | Tükendi | Sold Out | Ausverkauft | Распродано |
| At Boutique | Butikte mevcut | Available at boutique | Im Shop verfügbar | Есть в бутике |

**Overflow.** Single line, no wrap. Longest case: DE "Im Shop verfügbar" / TR "Butikte mevcut" / RU "Есть в бутике" — all under 140px at caption size. Pill grows with content.

---

## 11. Bottom nav

The hardest overflow component. Persistent across all pages except age gate. Four items, equal width.

**Anatomy**

- Height 64 + safe-area-inset-bottom
- Bg `canvas` with `backdrop-filter: blur(16px)`, border-top `hairline-soft`
- 4 equal columns, each: stack center-aligned with 4px gap
  - Active indicator: 24px-wide × 2px bronze rule above icon (visible only on active item)
  - Icon 22×22 line stroke
  - Label `ui-label` 11px (yes, smaller than the standard 13px — see overflow note), tracking 0.01em, max-width 80px

**States**

| State | Indicator | Icon | Label |
|---|---|---|---|
| Inactive | hidden | `ink-3` | `ink-3` |
| Active | `bronze-400` rule visible | `wine-500` | `wine-500` 500-weight |
| Pressed | rule darkens to `wine-500` | `wine-600` | `wine-600` |

**Strings — the overflow case**

| Item | TR | EN | DE | RU | Longest |
|---|---|---|---|---|---|
| Home | Ana Sayfa | Home | Startseite | Главная | DE 10 |
| Categories | Kategoriler | Categories | Kategorien | Категории | TR 11 |
| Search | Ara | Search | Suche | Поиск | EN 6 |
| Favorites | Favoriler | Favorites | Favoriten | Избранное | EN/RU 9 |

**Overflow analysis at 375px viewport.** 375 ÷ 4 = 93.75px per cell. Subtract 8px horizontal padding each side and 4px safety = ~74px usable for label. At Inter 11px 500-weight, average char width ≈ 6.4px. Longest labels:
- "Kategoriler" 11 × 6.4 = 70px ✓ fits
- "Startseite" 10 × 6.4 = 64px ✓ fits
- "Категории" Cyrillic ~ 65px ✓ fits

Conclusion: drop nav label from `ui-label` 13 to a custom 11px size (defined as token `nav-label`). All four languages fit single-line at 375px. **No language wraps; no language truncates.** This is the explicit reason the nav-label size differs from the rest of the UI.

For TR, the optional alternative is "Anasayfa" (no space, 8 chars) — keep "Ana Sayfa" as the canonical form per Pembe Tilki's rejected baseline; the new system can absorb it.

**Touch targets.** Cell width ~94px > 44pt minimum. Vertical hit area = full nav height minus 4px top inset.

---

## 12. Filter bottom sheet

Opens from category list and search results. Type filter, price range, in-stock-only toggle. Live count CTA — the button updates as filters change.

**Anatomy**

- Sheet (see §16) — 60% viewport height initial, swipe-up to 90%
- Header: drag handle (40×4 bronze-400 rounded), 16px gap, h3 serif "Filter", close ×
- Body padding 24px sides
- Group 1: Type — pill chips, multi-select, see §9 chip styling
- Group 2: Price — dual-thumb slider in `bronze-400` track / `wine-500` active range
- Group 3: In stock only — toggle (see §17 toggle anatomy, repurposed)
- Footer: sticky bottom, padding 16/24, two buttons row
  - Ghost "Reset" — text only, `ink-2`, left
  - Primary "Show N results" — wine fill, full remaining width, count updates live

**States** — see component-specific.

**Strings**

| Field | TR | EN | DE | RU |
|---|---|---|---|---|
| Title | Filtrele | Filter | Filter | Фильтр |
| Group: Type | Tür | Type | Art | Тип |
| Group: Price | Fiyat aralığı | Price range | Preisspanne | Ценовой диапазон |
| Group: In stock | Sadece stokta | In stock only | Nur verfügbar | Только в наличии |
| Reset | Sıfırla | Reset | Zurücksetzen | Сбросить |
| CTA (count) | 24 ürünü göster | Show 24 results | 24 Ergebnisse zeigen | Показать 24 |

**Overflow.** "Ценовой диапазон" 17 chars — group label sits above chips, single line. Footer "Reset" is short across all languages. CTA: DE "Ergebnisse zeigen" can run to 24 chars; reserve full-width minus reset button (≈80px) — measure each render.

---

## 13. Empty states

Three variants. Always typography-led, always centered, never animated.

**Anatomy**

- Center stack, max-width 280px, margin auto, padding-y 64
- Optional 32×32 line icon `bronze-400` (no fill, no decorative shapes)
- 16px gap
- `h3` serif `ink-2` headline, 1 line
- 8px gap
- `body-sm` `ink-3` body, max 2 lines
- 24px gap
- Optional ghost button (text + chevron) — `wine-500`

**Variants**

| Variant | Icon | Headline | Body | CTA |
|---|---|---|---|---|
| No favorites | heart-line | "No favorites yet" | "Tap the heart on a product to save it for the boutique." | "Browse categories" |
| No results | magnifier | "Nothing matches that" | "Try a shorter search term or different category." | "Reset filters" |
| Offline | cloud-slash | "We're offline" | "Reconnect to view live stock." | (none) |

**Strings — favorites empty**

| Field | TR | EN | DE | RU |
|---|---|---|---|---|
| Headline | Henüz favori yok | No favorites yet | Noch keine Favoriten | Пока нет избранного |
| Body | Bir ürünü kaydetmek için kalbe dokunun. | Tap the heart on a product to save it for the boutique. | Tippen Sie auf das Herz, um ein Produkt zu speichern. | Нажмите на сердце, чтобы сохранить товар. |
| CTA | Kategorilere göz at | Browse categories | Kategorien ansehen | Категории |

**Overflow.** Headline single line up to 22 chars at h3 — RU "Пока нет избранного" 19 chars fits. Body wraps freely up to 4 lines.

---

## 14. Skeleton loaders

Cream-on-ivory shimmer. Subtle — the warm palette can't carry a high-contrast pulse.

**Anatomy**

- Solid `surface` `#F2EBDD` rectangles where content will appear, with `r-md` radius matching the eventual content
- Shimmer overlay: a 200%-wide horizontal linear-gradient sliding left-to-right
  - Light: `linear-gradient(90deg, transparent 0%, rgba(249, 244, 236, 0.6) 50%, transparent 100%)` — that's the canvas color at 60%, sliding across the ivory base
  - Dark: same with `rgba(38, 29, 20, 0.6)`
- Animation: `dur-slow` × 1.5 (600ms), infinite, ease-in-out
- `prefers-reduced-motion`: shimmer disabled, static rectangles only

**Variants**

- PDP hero: 1:1 square, then 4 rows below: overline width 30%, h1 width 80%, h1 width 60% (2-line wrap), price width 25%
- Category list: 6 rows, each h2 width 50–70% randomized, hairline between
- Product card: square + 3 short rows

**Overflow.** N/a — language-independent.

---

## 15. Toast

Minimal, ephemeral. Bronze-accented. Used for "Added to favorites" and similar micro-confirmations.

**Anatomy**

- Bottom-anchored, 16px above bottom nav, 24px side gutters, max-width 343px
- Height auto, padding 12/16, radius `r-md`
- Bg `surface`, border-left 2px `bronze-400`, shadow `shadow-sheet`
- Body row: 16px check icon `bronze-400`, 12px gap, message `body-sm` `ink-2`

**States**

| State | Animation |
|---|---|
| Enter | Slide up 8px + fade in over `dur-base` `ease-emphasis` |
| Visible | 3000ms |
| Exit | Fade out `dur-fast` |
| Reduced motion | Opacity only |

**Strings (sample)**

| Action | TR | EN | DE | RU |
|---|---|---|---|---|
| Added to favorites | Favorilere eklendi | Added to favorites | Zu Favoriten hinzugefügt | Добавлено в избранное |
| Removed | Kaldırıldı | Removed | Entfernt | Удалено |
| Copied to clipboard | Kopyalandı | Copied | Kopiert | Скопировано |

**Overflow.** DE "Zu Favoriten hinzugefügt" 24 chars at body-sm — fits 343px - 24px chrome = 319px width. Allow wrap to 2 lines maximum; longer messages get truncated with ellipsis.

---

## 16. Bottom sheet (generic)

Foundation for filter (§12) and any secondary-action surface.

**Anatomy**

- Backdrop: `rgba(42, 30, 22, 0.5)` (warm dark; not pure black) tap-to-dismiss
- Sheet: bottom-anchored, full-width, max-height 90vh, radius `r-xl` top corners only (top-left and top-right), bottom corners 0 since sheet meets viewport
- Bg `surface`, shadow `shadow-sheet`, border-top hairline-soft
- Drag handle: centered top, 40×4, `bronze-400`, radius pill, margin-y 12
- Optional title row: padding 0/24/8/24, h3 left, close × right
- Content area: padding 24, scrollable
- Optional sticky footer: padding 16/24/24/24 (last 24 for safe-area), border-top hairline-soft

**States**

| State | Animation |
|---|---|
| Enter | Translate from 100% to 0 over `dur-base` `ease-emphasis` |
| Open | Static |
| Drag-to-close | Track finger, snap closed if past 30% threshold |
| Exit | Translate to 100% over `dur-fast` |

**Overflow.** Sheet content scrolls; sheet height does not. Header remains pinned.

---

## 17. Gizli Mod / Privacy Mode

Image-blur toggle. **Default OFF.** Lives in the Settings sheet (accessed via header overflow ⋯), not the header itself.

**Anatomy — settings row**

- Row, full-width, padding 16/24
- Left stack:
  - `body` 500-weight `ink` label
  - `body-sm` `ink-3` description, 1 line max
- Right: toggle (44×24 track, 20px thumb, 2px padding)

**Toggle states**

| State | Track | Thumb | Notes |
|---|---|---|---|
| Off (default) | `ink-3` 30% opacity | `canvas` | Resting position left |
| On | `wine-500` | `canvas` | Position right |
| Pressed | track darkens 20% | thumb scales 0.95 | — |
| Focus | 2px wine outline at 2px offset | unchanged | — |

**Effect when ON**

- All product imagery receives `filter: blur(20px) saturate(0.8)`
- Tap an image to reveal it temporarily (3s); auto-reblurs after
- Setting persists per device via `localStorage`

**Strings**

| Field | TR | EN | DE | RU |
|---|---|---|---|---|
| Label | Gizli mod | Privacy mode | Privater Modus | Приватный режим |
| Description | Görselleri bulanıklaştır | Blur product images | Produktbilder unscharf | Размытие изображений |
| Tap-to-reveal hint | Görmek için dokun | Tap to reveal | Tippen zum Anzeigen | Нажмите, чтобы увидеть |

**Overflow.** Description wraps to 2 lines max. RU description is the longest at ~25 chars; fits comfortably on a single line at body-sm in the available ~220px column.

---

## 18. Sample CTAs and global strings

Consolidated here for quick reference; individual components reference these.

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

### WhatsApp message template (build-time encoded into `wa.me` href)

| Locale | Template |
|---|---|
| TR | `Adam & Eve Sex Shop'tan {product.name} (SKU: {sku}) hakkında bilgi almak istiyorum.` |
| EN | `I'd like information about {product.name} (SKU: {sku}) from Adam & Eve Sex Shop.` |
| DE | `Ich hätte gerne Informationen zu {product.name} (SKU: {sku}) aus dem Adam & Eve Sex Shop.` |
| RU | `Я хотел бы получить информацию о {product.name} (SKU: {sku}) из магазина Adam & Eve Sex Shop.` |

URL: `https://wa.me/{HOTEL_BOUTIQUE_NUMBER}?text={URL_ENCODED_MESSAGE}`. Built statically at build time per product per locale; no runtime composition.

---

## Summary table — overflow strategy by component

| Component | Strategy | Hardest language |
|---|---|---|
| Age gate | 4-line wrap allowed | RU |
| Lang switcher | Code-only trigger; native names panel-only | n/a |
| QR landing hero | h1 wraps to 2 lines; reserve 67px | DE |
| Sticky header | Icon-only right side; wordmark fixed | n/a |
| Breadcrumb | Collapse middle crumbs to ellipsis | RU |
| Category list | Single-line h2; type-step down if longer | TR |
| Product card | Name 2 lines max; curator note 1 line | RU |
| PDP | Primary CTA grows to 2 lines if needed | DE |
| Variant chip | Flex-wrap absorbs growth | n/a |
| Stock badge | Pill grows with content, no wrap | DE |
| Bottom nav | 11px nav-label token; all 4 languages fit | TR/DE |
| Filter sheet | CTA grows; group labels short | RU |
| Empty state | Body wraps freely 4 lines | DE |
| Skeleton | Language-independent | — |
| Toast | 2-line wrap then truncate | DE |
| Bottom sheet | Content scrolls | — |
| Gizli Mod | Description 2-line wrap | RU |

---

End of part 2 (component inventory). HTML mocks and token files follow.
