# Adam & Eve Sex Shop — part 1: principles and tokens

> Archived from chat delivery on 2026-04-28. Consolidated into `spec.md`. Kept here for history.

## 1. Design principles

1. Hospitality, not retail — extension of the hotel suite, not a storefront.
2. Equal-weight multilingualism — TR, EN, DE, RU as four first-languages.
3. Type-led, chrome-quiet — Cormorant Garamond + Inter + bronze hairlines carry hierarchy.
4. Poured, not printed — warm, saturated palette like a hotel suite at golden hour.
5. Whitespace is content — generous gutters, large sparse imagery.
6. Privacy as comfort, not paranoia — Gizli Mod default OFF, lives in Settings.
7. The boutique is the destination — site informs, boutique serves; CTA flows to WhatsApp.

## 2. Token spec

### Color — light mode

Wine ramp (primary): wine-50 #FBF3F2, wine-100 #F2E0DC, wine-200 #E2BBB2, wine-300 #C58A7E, wine-400 #A05B4E, wine-500 #6B2E26 (primary brand), wine-600 #5A2620, wine-700 #4A1E1A, wine-900 #2A100E.

Bronze ramp (secondary): bronze-50 #F8F1E5, bronze-100 #ECDCBA, bronze-200 #DCC18B, bronze-300 #C4A165, bronze-400 #A88546, bronze-500 #8C6D40 (decorative-only), bronze-600 #71562F (text on cream), bronze-700 #564220 (filled bronze surfaces), bronze-800 #3C2E15.

Neutrals: canvas #F9F4EC, surface #F2EBDD, surface-sunken #EFE4D0, ink #2A1E16, ink-2 #4A3829, ink-3 #6B5642.

Hairlines: rgba(168,133,70,0.30) default; rgba(168,133,70,0.15) soft.

Semantic — success: bg #E5E8D9, ink #3F4933, mark #5C6B4A. Warning: bg #F2E2BD, ink #6B4A1E, mark #A87830. Danger: bg #ECCFC4, ink #7A3525, mark #B4533A. Info: bg #ECDCBA, ink #564220, mark #71562F.

### Color — dark mode

Cocoa neutrals: canvas #1A140F, surface #261D14, surface-sunken #120D09, ink #F0E6D5, ink-2 #C9B89F, ink-3 #8F7E66.

Wine lifted: wine-500 #BC685A (primary), wine-600 #C77264 (emphasis), wine-soft #3A1814.

Bronze (carrier of identity): bronze-400 #B59A6E (hairline), bronze-600 #D8B886 (primary accent), bronze-700 #E8CBA0.

### Contrast verification

Wine 500 #6B2E26 on canvas: 9.63 (AAA). Ink on canvas: 14.8 (AAA). Bronze-600 on canvas: 6.34 (AA). Wine-lifted dark on cocoa: 4.53 (AA). Bronze-dark on cocoa: 9.67 (AAA).

Bronze-500 fails AA in both directions (4.36 / 3.4) — confined to decorative use only.

### Typography

Families: Cormorant Garamond (serif, with `unicode-range`-scoped Lora Italic fallback for Cyrillic codepoints, aliased as `AE Serif Italic`); Inter Variable (sans).

Scale (mobile-first):
- display-lg 40, display 32, h1 28, h2 22, h3 18, h4 16
- body-lg 17, body 15, body-sm 13, caption 12
- overline 11 (tracking 0.20em)
- ui-label 13 (tracking 0.02em)
- nav-label 11 (tracking 0.01em — intentional 2px drop from ui-label so all four languages fit single-line at 375px)
- price 22 serif tabular-nums
- curator 14 italic bronze-600

Weights: 400 regular, 500 medium, 600 bold.

### Spacing

Base 4px: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128. Mobile gutter 24 default, 32 hero. Desktop gutter 64.

### Radius

sm 6, md 10, lg 14, xl 20, pill 999.

### Shadow

shadow-sheet (light): 0 12px 40px rgba(42, 30, 22, 0.12). Dark: 0 12px 40px rgba(0, 0, 0, 0.50). Used only on modals/sheets/toasts. Cards and hero use hairlines + cream-on-ivory layering instead.

### Motion

dur-fast 180ms, dur-base 280ms, dur-slow 400ms. ease-standard cubic-bezier(0.22,1,0.36,1), ease-emphasis cubic-bezier(0.16,1,0.30,1). Reduced-motion: durations collapse to 1ms.

---

End part 1 archive.
