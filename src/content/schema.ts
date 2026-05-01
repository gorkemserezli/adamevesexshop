import { z } from "astro/zod";

const localized = <T extends z.ZodTypeAny>(inner: T) =>
  z
    .object({
      tr: inner,
      en: inner,
      de: inner,
      ru: inner,
    })
    .strict();

export const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be kebab-case ASCII")
  .max(150);

export const localizedShortText = localized(z.string().min(1).max(120));
export const localizedCuratorNote = localized(z.string().min(1).max(80));
export const localizedOverline = localized(z.string().min(1).max(30));
export const localizedDescription = localized(z.string().max(5000));
export const localizedSpecValue = localized(z.string().max(200));

export const priceShape = z
  .object({
    value: z.number().nonnegative(),
    currency: z.string().min(1),
  })
  .strict();

export const variantOption = z
  .object({
    id: slug,
    label: localizedShortText,
    available: z.boolean().default(true),
  })
  .strict();

export const variantAxis = z
  .object({
    id: slug,
    label: localizedShortText,
    options: z.array(variantOption).min(2),
  })
  .strict();

export const productSpec = z
  .object({
    label: localizedShortText,
    value: localizedSpecValue,
  })
  .strict();

export const productSchema = z
  .object({
    id: slug,
    sku: z
      .string()
      .min(1)
      .regex(/^[\p{Lu}\p{N}-]+$/u, "SKU must be uppercase letters / digits / hyphens"),
    category_id: slug,
    subcategory_id: slug.nullable().default(null),
    images: z
      .array(
        z
          .string()
          .refine(
            (s) => s.startsWith("/") || s.startsWith("https://"),
            "image must be a local path starting with '/' or an absolute https:// URL",
          ),
      )
      .default([]),
    overline: localizedOverline,
    name: localizedShortText,
    description: localizedDescription,
    curator_note: localizedCuratorNote.nullable().default(null),
    price: z
      .object({
        tr: priceShape,
        en: priceShape,
        de: priceShape,
        ru: priceShape,
      })
      .strict(),
    variants: z.array(variantAxis).default([]),
    specs: z.array(productSpec).default([]),
    sold_out: z.boolean().default(false),
  })
  .strict();

export const subcategorySchema = z
  .object({
    id: slug,
    name: localizedShortText,
  })
  .strict();

export const categorySchema = z
  .object({
    id: slug,
    name: localizedShortText,
    sort_order: z.number().int().nonnegative(),
    description: localizedDescription.optional(),
    subcategories: z.array(subcategorySchema).default([]),
  })
  .strict();

export type Product = z.infer<typeof productSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Subcategory = z.infer<typeof subcategorySchema>;
export type VariantAxis = z.infer<typeof variantAxis>;
export type VariantOption = z.infer<typeof variantOption>;
export type ProductSpec = z.infer<typeof productSpec>;
