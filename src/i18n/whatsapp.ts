import type { Locale } from "./ui";
import type { Product } from "../content/config";

const HOTEL_WHATSAPP_NUMBER =
  import.meta.env.HOTEL_WHATSAPP_NUMBER ?? process.env.HOTEL_WHATSAPP_NUMBER ?? "+905000000000";

const messageTemplates: Record<Locale, (name: string, sku: string) => string> = {
  tr: (name, sku) =>
    `Adam & Eve Sex Shop'tan ${name} (SKU: ${sku}) hakkında bilgi almak istiyorum.`,
  en: (name, sku) =>
    `I'd like information about ${name} (SKU: ${sku}) from Adam & Eve Sex Shop.`,
  de: (name, sku) =>
    `Ich hätte gerne Informationen zu ${name} (SKU: ${sku}) aus dem Adam & Eve Sex Shop.`,
  ru: (name, sku) =>
    `Я хотел бы получить информацию о ${name} (SKU: ${sku}) из магазина Adam & Eve Sex Shop.`,
};

function normalizeNumber(input: string): string {
  return input.replace(/[^\d]/g, "");
}

export function buildWhatsAppHref(product: Product, locale: Locale): string {
  const name = product.name[locale].replaceAll("­", "");
  const text = messageTemplates[locale](name, product.sku);
  const number = normalizeNumber(HOTEL_WHATSAPP_NUMBER);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
