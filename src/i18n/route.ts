import type { Locale } from "./ui";
import { LOCALES } from "./ui";

const LOCALE_PREFIX = new RegExp(`^/(${LOCALES.join("|")})(/|$)`);

export function getLocalizedPath(currentPath: string, toLocale: Locale): string {
  const match = currentPath.match(LOCALE_PREFIX);
  if (match) {
    return currentPath.replace(LOCALE_PREFIX, `/${toLocale}$2`);
  }
  return `/${toLocale}${currentPath.startsWith("/") ? currentPath : `/${currentPath}`}`;
}

export function getCurrentLocale(currentPath: string): Locale | null {
  const match = currentPath.match(LOCALE_PREFIX);
  if (!match) return null;
  return match[1] as Locale;
}
