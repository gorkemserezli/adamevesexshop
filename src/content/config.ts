import { defineCollection } from "astro:content";
import { glob, file } from "astro/loaders";
import { productSchema, categorySchema } from "./schema";

export { productSchema, categorySchema };
export type {
  Product,
  Category,
  Subcategory,
  VariantAxis,
  VariantOption,
  ProductSpec,
} from "./schema";

export const collections = {
  products: defineCollection({
    loader: glob({ pattern: "**/*.json", base: "./src/content/products" }),
    schema: productSchema,
  }),
  categories: defineCollection({
    loader: file("./src/content/categories/categories.json", {
      parser: (text) => {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.categories ?? []);
      },
    }),
    schema: categorySchema,
  }),
};
