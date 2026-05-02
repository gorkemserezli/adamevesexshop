import type { Locale } from "~/i18n/ui";
import { productHref } from "~/lib/routes";

export interface ProductCardData {
  slug: string;
  name: string;
  priceDisplay: string;
  image: string;
}

interface ProductCardHTMLOptions {
  /** Optional extra classes appended to "ae-product-card". */
  extraClass?: string;
  /** Optional extra attributes for the outer <li> (data-*, style, etc.). */
  outerAttrs?: Record<string, string>;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function attrsToString(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
    .join(" ");
}

/**
 * Single source of truth for the product-card markup. Used by:
 *   - src/components/product/ProductCard.astro (server-side render)
 *   - src/pages/[lang]/search.astro inline JS (client-side render)
 *
 * Keep these two paths byte-identical by routing both through this function.
 */
export function productCardHTML(
  data: ProductCardData,
  lang: Locale,
  opts: ProductCardHTMLOptions = {},
): string {
  const { extraClass = "", outerAttrs = {} } = opts;
  const liClass = ["ae-product-card", extraClass].filter(Boolean).join(" ");
  const attrsBlock = Object.keys(outerAttrs).length > 0 ? " " + attrsToString(outerAttrs) : "";
  const href = productHref(lang, data.slug);

  return `<li class="${liClass}"${attrsBlock}><a href="${escapeHtml(href)}" class="block no-underline" style="color: var(--ae-ink);"><div class="aspect-square bg-sunken overflow-hidden rounded-md"><img src="${escapeHtml(data.image)}" alt="${escapeHtml(data.name)}" class="ae-product-image w-full h-full object-cover" loading="lazy" decoding="async" width="512" height="512" /></div><p class="ae-product-card-name font-serif text-[18px] mt-ae-2 leading-tight">${escapeHtml(data.name)}</p><p class="text-body-sm mt-1" style="color: var(--ae-ink-3);">${escapeHtml(data.priceDisplay)}</p></a></li>`;
}

/**
 * Skeleton placeholder card for index-fetch / search-pending states. Reuses
 * the same outer structure so layout doesn't shift when real cards swap in.
 * Shimmer comes from the .ae-card-skeleton rule in BaseLayout / globals.
 * Honors prefers-reduced-motion via the media query on .ae-card-skeleton.
 */
export function productCardSkeletonHTML(): string {
  return `<li class="ae-product-card ae-card-skeleton" aria-hidden="true"><div class="block"><div class="aspect-square bg-sunken overflow-hidden rounded-md ae-skeleton-shimmer"></div><p class="ae-product-card-name ae-skeleton-line font-serif text-[18px] mt-ae-2 leading-tight ae-skeleton-shimmer">&nbsp;</p><p class="ae-skeleton-line ae-skeleton-line-short text-body-sm mt-1 ae-skeleton-shimmer">&nbsp;</p></div></li>`;
}

export function productCardSkeletonGridHTML(count = 4): string {
  return Array.from({ length: count }, () => productCardSkeletonHTML()).join("");
}
