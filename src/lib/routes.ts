import type { Locale } from "~/i18n/ui";

export function homeHref(lang: Locale): string {
  return `/${lang}/`;
}

export function favoritesHref(lang: Locale): string {
  return `/${lang}/favorites/`;
}

export function searchHref(lang: Locale): string {
  return `/${lang}/search/`;
}

export function productHref(lang: Locale, slug: string): string {
  return `/${lang}/product/${slug}/`;
}

export function categoriesIndexHref(lang: Locale): string {
  return `/${lang}/categories/`;
}

export function categoryHref(lang: Locale, slug: string): string {
  return `/${lang}/categories/${slug}/`;
}

// Empty-state CTA target for the favorites page.
// Now points at the categories index per Task 11 (closes Task 8 Decision 3 promise:
// "When a dedicated /{lang}/categories/ index lands, swap this single constant").
export function favoritesEmptyCtaHref(lang: Locale): string {
  return categoriesIndexHref(lang);
}
