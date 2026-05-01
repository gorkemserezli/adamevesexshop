import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: process.env.SITE_URL ?? "https://catalog.placeholder.invalid",
  output: "static",

  i18n: {
    locales: ["tr", "en", "de", "ru"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: true,
    },
  },

  redirects: {
    "/": "/en/",
  },

  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],

  vite: {
    resolve: {
      alias: {
        "~": "/src",
      },
    },
  },
});
