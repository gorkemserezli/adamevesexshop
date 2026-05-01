import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

const localized = <T extends z.ZodTypeAny>(inner: T) =>
  z
    .object({
      tr: inner,
      en: inner,
      de: inner,
      ru: inner,
    })
    .strict();

const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be kebab-case ASCII")
  .max(80);

const isoCountry = z
  .string()
  .regex(/^[A-Z]{2}$/, "ISO 3166-1 alpha-2 (e.g., FR, TR)");

const localizedShortText = localized(z.string().min(1).max(120));
const localizedCuratorNote = localized(z.string().min(1).max(80));
const localizedOverline = localized(z.string().min(1).max(30));
const localizedDescription = localized(z.string().min(1).max(800));
const localizedSpecValue = localized(z.string().min(1).max(120));

const priceShape = z
  .object({
    display: z.string().min(1),
    value: z.number().nonnegative(),
    currency: z.enum(["TRY", "USD", "EUR", "RUB"]),
  })
  .strict();

const variantOption = z
  .object({
    id: slug,
    label: localizedShortText,
    available: z.boolean().default(true),
  })
  .strict();

const variantAxis = z
  .object({
    id: slug,
    label: localizedShortText,
    options: z.array(variantOption).min(2),
  })
  .strict();

const productSpec = z
  .object({
    key: slug,
    label: localizedShortText,
    value: localizedSpecValue,
  })
  .strict();

const productSchema = z
  .object({
    id: slug,
    sku: z
      .string()
      .min(1)
      .regex(/^[A-Z0-9-]+$/, "SKU must be uppercase ASCII / digits / hyphens"),
    category_id: slug,
    subcategory_id: slug.nullable().default(null),
    sort_order: z.number().int().nonnegative(),
    images: z
      .array(
        z
          .string()
          .refine(
            (s) => s.startsWith("/") || s.startsWith("https://"),
            "image must be a local path starting with '/' or an absolute https:// URL",
          ),
      )
      .min(1),
    overline: localizedOverline,
    name: localizedShortText,
    description: localizedDescription,
    curator_note: localizedCuratorNote,
    price: z
      .object({
        tr: priceShape.refine((p) => p.currency === "TRY", "tr price must be TRY"),
        en: priceShape.refine((p) => p.currency === "USD", "en price must be USD"),
        de: priceShape.refine((p) => p.currency === "EUR", "de price must be EUR"),
        ru: priceShape.refine((p) => p.currency === "RUB", "ru price must be RUB"),
      })
      .strict(),
    variants: z.array(variantAxis).default([]),
    specs: z.array(productSpec).default([]),
    made_in: isoCountry,
    sold_out: z.boolean().default(false),
  })
  .strict();

const subcategorySchema = z
  .object({
    id: slug,
    name: localizedShortText,
  })
  .strict();

const categorySchema = z
  .object({
    id: slug,
    name: localizedShortText,
    sort_order: z.number().int().nonnegative(),
    description: localizedDescription.optional(),
    subcategories: z.array(subcategorySchema).default([]),
  })
  .strict();

export const collections = {
  products: defineCollection({
    loader: glob({ pattern: "**/*.json", base: "./src/content/products" }),
    schema: productSchema,
  }),
  categories: defineCollection({
    loader: file("./src/content/categories/categories.json"),
    schema: categorySchema,
  }),
};

export type Product = z.infer<typeof productSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Subcategory = z.infer<typeof subcategorySchema>;
export type VariantAxis = z.infer<typeof variantAxis>;
export type VariantOption = z.infer<typeof variantOption>;
export type ProductSpec = z.infer<typeof productSpec>;
