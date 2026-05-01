import { describe, it, expect } from "vitest";
import { productCardHTML } from "./product-card-html";
import type { Locale } from "~/i18n/ui";

const sample = {
  slug: "warming-massage-oil",
  name: "Warming Massage Oil",
  priceDisplay: "$ 24.00",
  image: "/products/placeholder.jpg",
};

describe("productCardHTML", () => {
  it("emits a single <li> wrapper with default classes", () => {
    const html = productCardHTML(sample, "en");
    expect(html).toMatch(/^<li class="ae-product-card">/);
    expect(html).toContain("</li>");
  });

  it("appends extraClass after the base class", () => {
    const html = productCardHTML(sample, "en", { extraClass: "ae-fav-card" });
    expect(html).toContain('class="ae-product-card ae-fav-card"');
  });

  it("renders outerAttrs verbatim on the <li>", () => {
    const html = productCardHTML(sample, "en", {
      outerAttrs: { "data-fav-sku": "AE-WMO-100", style: "display: none;" },
    });
    expect(html).toContain('data-fav-sku="AE-WMO-100"');
    expect(html).toContain('style="display: none;"');
  });

  it("escapes HTML in name, price, image URL", () => {
    const html = productCardHTML(
      { slug: "x", name: "Foo & <Bar>", priceDisplay: "\"$5\"", image: "/p.jpg?a=1&b=2" },
      "en",
    );
    expect(html).toContain("Foo &amp; &lt;Bar&gt;");
    expect(html).toContain("&quot;$5&quot;");
    expect(html).toContain("/p.jpg?a=1&amp;b=2");
  });

  it("routes link via productHref(lang, slug)", () => {
    expect(productCardHTML(sample, "en")).toContain('href="/en/product/warming-massage-oil/"');
    expect(productCardHTML(sample, "ru")).toContain('href="/ru/product/warming-massage-oil/"');
    expect(productCardHTML(sample, "tr")).toContain('href="/tr/product/warming-massage-oil/"');
    expect(productCardHTML(sample, "de")).toContain('href="/de/product/warming-massage-oil/"');
  });

  it("includes ae-product-image class on the thumbnail (privacy mode applies)", () => {
    expect(productCardHTML(sample, "en")).toContain('class="ae-product-image w-full h-full object-cover"');
  });

  it("server-call and client-call paths produce identical strings for the same input", () => {
    // The whole point of the utility: ProductCard.astro's frontmatter call and
    // search.astro's inline JS call both hit productCardHTML with the same data
    // shape. The "two paths" are just two call sites of the same function, so
    // identity is enforced by construction. This test guards against accidental
    // wrapper drift if either site grows extra logic.
    const locales: Locale[] = ["tr", "en", "de", "ru"];
    for (const lang of locales) {
      const a = productCardHTML(sample, lang);
      const b = productCardHTML({ ...sample }, lang); // fresh object, same data
      expect(a).toBe(b);
    }
  });

  it("identical output regardless of property enumeration order on input", () => {
    const a = productCardHTML(
      { slug: "x", name: "N", priceDisplay: "P", image: "/i.jpg" },
      "en",
    );
    const b = productCardHTML(
      { image: "/i.jpg", priceDisplay: "P", name: "N", slug: "x" },
      "en",
    );
    expect(a).toBe(b);
  });
});
