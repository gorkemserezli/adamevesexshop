import type { Locale } from "./ui";
import { ui } from "./ui";

const intlLocale: Record<Locale, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  ru: "ru-RU",
};

export function formatCount(n: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale]).format(n);
}

export function formatProductCount(total: number, inStock: number, locale: Locale): string {
  return ui[locale].productCount(total, inStock);
}

export function formatLastN(n: number, locale: Locale): string {
  return ui[locale].stock.lastN(n);
}

export function formatShowCount(n: number, locale: Locale): string {
  return ui[locale].filter.showCount(n);
}

export function formatCurrencyNote(symbol: string, locale: Locale): string {
  return ui[locale].settings.currencyNote(symbol);
}

/**
 * Russian plural form for "ruble". Three forms:
 *   - "рубль"   — for last digit 1, except teens (11–14)
 *   - "рубля"   — for last digits 2–4, except teens
 *   - "рублей"  — for 0, 5–9, and teens (11–14)
 *
 * Order of checks matters: teens must be checked before lastOne === 1, since
 * 11 has lastOne === 1 but takes "рублей".
 */
export function ruPlural(n: number): "рубль" | "рубля" | "рублей" {
  const abs = Math.abs(Math.trunc(n));
  const lastTwo = abs % 100;
  const lastOne = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "рублей";
  if (lastOne === 1) return "рубль";
  if (lastOne >= 2 && lastOne <= 4) return "рубля";
  return "рублей";
}

/**
 * Spoken-form price string for screen reader value text. Returns the number
 * spelled-out form rather than the symbolic form (which SRs read as "dollar
 * sign two four"). Per-locale inflection:
 *   tr: "24 Türk lirası" (invariant)
 *   en: "24 dollars"     (always plural)
 *   de: "24 Euro"        (invariant)
 *   ru: "24 рубля"       (full plural rules via ruPlural)
 */
export function formatPriceForScreenReader(value: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat(intlLocale[locale]).format(value);
  switch (locale) {
    case "tr":
      return `${formatted} Türk lirası`;
    case "en":
      return `${formatted} dollars`;
    case "de":
      return `${formatted} Euro`;
    case "ru":
      return `${formatted} ${ruPlural(value)}`;
  }
}
