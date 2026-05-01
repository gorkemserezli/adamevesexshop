// ============================================================
// Adam & Eve Sex Shop — Tailwind config
// Consumes CSS custom properties defined in tokens.css.
// Tokens are the source of truth; this config maps them to
// Tailwind utilities. Do not hardcode hex values here.
// ============================================================

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./public/**/*.html",
  ],

  // Dark mode driven by [data-theme="dark"] on <html>, not
  // prefers-color-scheme. The user explicitly toggles it.
  darkMode: ["selector", '[data-theme="dark"]'],

  theme: {
    // Reset font-size and font-family — we drive these via the
    // typographic scale below, not via Tailwind's default scale.
    fontFamily: {
      serif: "var(--ae-font-serif)",
      sans:  "var(--ae-font-sans)",
    },

    extend: {
      // ---------- Colors ----------
      colors: {
        // Wine ramp
        wine: {
          50:  "var(--ae-wine-50)",
          100: "var(--ae-wine-100)",
          200: "var(--ae-wine-200)",
          300: "var(--ae-wine-300)",
          400: "var(--ae-wine-400)",
          500: "var(--ae-wine-500)",
          600: "var(--ae-wine-600)",
          700: "var(--ae-wine-700)",
          900: "var(--ae-wine-900)",
          DEFAULT: "var(--ae-wine-500)",
        },

        // Bronze ramp
        bronze: {
          50:  "var(--ae-bronze-50)",
          100: "var(--ae-bronze-100)",
          200: "var(--ae-bronze-200)",
          300: "var(--ae-bronze-300)",
          400: "var(--ae-bronze-400)",
          500: "var(--ae-bronze-500)",
          600: "var(--ae-bronze-600)",
          700: "var(--ae-bronze-700)",
          800: "var(--ae-bronze-800)",
          DEFAULT: "var(--ae-bronze-400)",
        },

        // Neutrals
        canvas:  "var(--ae-canvas)",
        surface: "var(--ae-surface)",
        sunken:  "var(--ae-surface-sunken)",
        ink: {
          DEFAULT: "var(--ae-ink)",
          2: "var(--ae-ink-2)",
          3: "var(--ae-ink-3)",
        },

        // Semantic
        success: {
          bg:   "var(--ae-success-bg)",
          ink:  "var(--ae-success-ink)",
          mark: "var(--ae-success-mark)",
        },
        warning: {
          bg:   "var(--ae-warning-bg)",
          ink:  "var(--ae-warning-ink)",
          mark: "var(--ae-warning-mark)",
        },
        danger: {
          bg:   "var(--ae-danger-bg)",
          ink:  "var(--ae-danger-ink)",
          mark: "var(--ae-danger-mark)",
        },
        info: {
          bg:   "var(--ae-info-bg)",
          ink:  "var(--ae-info-ink)",
          mark: "var(--ae-info-mark)",
        },

        // Aliases
        accent:        "var(--ae-accent)",
        "accent-press":"var(--ae-accent-press)",
        "accent-soft": "var(--ae-accent-soft)",
        "on-wine":     "var(--ae-text-on-wine)",
        "on-bronze":   "var(--ae-text-on-bronze)",
        decor:         "var(--ae-decor)",
        "decor-ink":   "var(--ae-decor-ink)",
      },

      borderColor: {
        hairline:      "var(--ae-hairline)",
        "hairline-soft": "var(--ae-hairline-soft)",
      },

      backgroundColor: {
        overlay: "var(--ae-overlay)",
      },

      // ---------- Typography scale ----------
      fontSize: {
        // Each entry: [size, { lineHeight, letterSpacing, fontWeight }]
        "display-lg": [
          "var(--ae-fs-display-lg)",
          { lineHeight: "var(--ae-lh-display-lg)", letterSpacing: "var(--ae-tr-display)", fontWeight: "400" },
        ],
        "display": [
          "var(--ae-fs-display)",
          { lineHeight: "var(--ae-lh-display)", letterSpacing: "var(--ae-tr-tight)", fontWeight: "400" },
        ],
        "h1": [
          "var(--ae-fs-h1)",
          { lineHeight: "var(--ae-lh-h1)", letterSpacing: "var(--ae-tr-h1)", fontWeight: "400" },
        ],
        "h2": [
          "var(--ae-fs-h2)",
          { lineHeight: "var(--ae-lh-h2)", letterSpacing: "var(--ae-tr-normal)", fontWeight: "500" },
        ],
        "h3": [
          "var(--ae-fs-h3)",
          { lineHeight: "var(--ae-lh-h3)", letterSpacing: "var(--ae-tr-normal)", fontWeight: "500" },
        ],
        "h4": [
          "var(--ae-fs-h4)",
          { lineHeight: "var(--ae-lh-h4)", letterSpacing: "var(--ae-tr-normal)", fontWeight: "500" },
        ],
        "body-lg": [
          "var(--ae-fs-body-lg)",
          { lineHeight: "var(--ae-lh-body-lg)", letterSpacing: "var(--ae-tr-normal)", fontWeight: "400" },
        ],
        "body": [
          "var(--ae-fs-body)",
          { lineHeight: "var(--ae-lh-body)", letterSpacing: "var(--ae-tr-normal)", fontWeight: "400" },
        ],
        "body-sm": [
          "var(--ae-fs-body-sm)",
          { lineHeight: "var(--ae-lh-body-sm)", letterSpacing: "var(--ae-tr-normal)", fontWeight: "400" },
        ],
        "caption": [
          "var(--ae-fs-caption)",
          { lineHeight: "var(--ae-lh-caption)", letterSpacing: "var(--ae-tr-caption)", fontWeight: "400" },
        ],
        "overline": [
          "var(--ae-fs-overline)",
          { lineHeight: "var(--ae-lh-overline)", letterSpacing: "var(--ae-tr-overline)", fontWeight: "500" },
        ],
        "ui-label": [
          "var(--ae-fs-ui-label)",
          { lineHeight: "var(--ae-lh-ui-label)", letterSpacing: "var(--ae-tr-ui)", fontWeight: "500" },
        ],
        "nav-label": [
          "var(--ae-fs-nav-label)",
          { lineHeight: "1.20", letterSpacing: "var(--ae-tr-nav)", fontWeight: "500" },
        ],
        "price": [
          "var(--ae-fs-price)",
          { lineHeight: "var(--ae-lh-price)", letterSpacing: "var(--ae-tr-normal)", fontWeight: "400" },
        ],
        "curator": [
          "var(--ae-fs-curator)",
          { lineHeight: "var(--ae-lh-curator)", letterSpacing: "var(--ae-tr-normal)", fontWeight: "400" },
        ],
      },

      // ---------- Spacing ----------
      spacing: {
        "ae-1":  "var(--ae-s-1)",
        "ae-2":  "var(--ae-s-2)",
        "ae-3":  "var(--ae-s-3)",
        "ae-4":  "var(--ae-s-4)",
        "ae-5":  "var(--ae-s-5)",
        "ae-6":  "var(--ae-s-6)",
        "ae-7":  "var(--ae-s-7)",
        "ae-8":  "var(--ae-s-8)",
        "ae-10": "var(--ae-s-10)",
        "ae-12": "var(--ae-s-12)",
        "ae-16": "var(--ae-s-16)",
        "ae-20": "var(--ae-s-20)",
        "ae-24": "var(--ae-s-24)",
        "gutter":      "var(--ae-gutter-mobile)",
        "gutter-hero": "var(--ae-gutter-mobile-hero)",
      },

      // ---------- Radius ----------
      borderRadius: {
        sm:   "var(--ae-r-sm)",
        md:   "var(--ae-r-md)",
        lg:   "var(--ae-r-lg)",
        xl:   "var(--ae-r-xl)",
        pill: "var(--ae-r-pill)",
      },

      // ---------- Shadow ----------
      boxShadow: {
        none:  "var(--ae-shadow-none)",
        sheet: "var(--ae-shadow-sheet)",
      },

      // ---------- Motion ----------
      transitionDuration: {
        fast: "var(--ae-dur-fast)",
        base: "var(--ae-dur-base)",
        slow: "var(--ae-dur-slow)",
      },
      transitionTimingFunction: {
        standard: "var(--ae-ease-standard)",
        emphasis: "var(--ae-ease-emphasis)",
      },

      // ---------- Layout ----------
      maxWidth: {
        "ae-text":    "var(--ae-content-max-text)",
        "ae-catalog": "var(--ae-content-max-catalog)",
        "ae-pdp":     "var(--ae-content-max-pdp)",
      },

      screens: {
        // Override defaults with our breakpoints
        sm: "430px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },

      // ---------- Z-index ----------
      zIndex: {
        sticky:   "30",
        dropdown: "40",
        sheet:    "50",
        toast:    "60",
        modal:    "70",
      },
    },
  },

  plugins: [
    // Utility for tabular numerics on prices.
    function ({ addUtilities }) {
      addUtilities({
        ".tnum": { "font-variant-numeric": "tabular-nums lining-nums" },
        ".strike-diag": {
          "background-image":
            "linear-gradient(135deg, transparent 47%, currentColor 47%, currentColor 53%, transparent 53%)",
          "background-size": "100% 100%",
          "background-repeat": "no-repeat",
        },
      });
    },
  ],
};
