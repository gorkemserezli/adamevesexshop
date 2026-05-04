import type { Locale } from "~/i18n/ui";

function read(key: string, fallback?: string): string {
  const value =
    (typeof process !== "undefined" ? process.env[key] : undefined) ??
    (import.meta.env as Record<string, string | undefined>)[key];
  if (value !== undefined && value !== "") return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${key}`);
}

export const HOTEL_NAME = read("HOTEL_NAME", "Adam & Eve Hotels Belek");
export const HOTEL_WHATSAPP_NUMBER = read("HOTEL_WHATSAPP_NUMBER", "+905000000000");
export const HOTEL_HOURS_OPEN = read("HOTEL_HOURS_OPEN", "09:00");
export const HOTEL_HOURS_CLOSE = read("HOTEL_HOURS_CLOSE", "23:00");
export const HOTEL_MARKETING_URL = (() => {
  const value = read("HOTEL_MARKETING_URL");
  // FUTURE: this only rejects example.com. Other plausible-looking dev
  // placeholders (localhost, test.com, placeholder.com, etc.) would pass.
  // Consider expanding to a positive-allowlist of acceptable production
  // domains if this list grows or if a wrong-domain ship-to-prod incident
  // happens. For now, the explicit example.com block + .env.example
  // "REPLACE WITH ACTUAL" comment covers the most likely failure mode.
  if (/^https:\/\/example\.com/i.test(value)) {
    throw new Error(
      "HOTEL_MARKETING_URL must point to a real hotel marketing URL; example.com placeholders are rejected.",
    );
  }
  return value;
})();
export const SITE_URL = read("SITE_URL", "https://catalog.placeholder.invalid");

export const HOTEL_BOUTIQUE_LOCATION: Record<Locale, string> = {
  tr: read("HOTEL_BOUTIQUE_LOCATION_TR", "Lobi katı, Adam & Eve Hotel Belek"),
  en: read("HOTEL_BOUTIQUE_LOCATION_EN", "Lobby level, Adam & Eve Hotel Belek"),
  de: read("HOTEL_BOUTIQUE_LOCATION_DE", "Lobby-Ebene, Adam & Eve Hotel Belek"),
  ru: read("HOTEL_BOUTIQUE_LOCATION_RU", "Уровень лобби, Adam & Eve Hotel Belek"),
};
