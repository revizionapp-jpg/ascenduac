import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Brand (vert UAC) ── */
        brand: {
          50:  "#ECF7EF",
          100: "#D5EEDB",
          200: "#ABDCB8",
          300: "#7CC792",
          400: "#4CC26B",
          500: "#2F9A50",
          600: "#248A43",
          700: "#1F7A3A",
          800: "#196330",
          900: "#14532D",
          DEFAULT: "#1F7A3A",
          hover: "#248A43",
        },
        /* ── Accent (jaune UAC) ── */
        accent: {
          100: "#FEF6CC",
          400: "#F6D02F",
          700: "#8A6D00",
          DEFAULT: "#F6D02F",
        },
        /* ── Danger (rouge UAC) ── */
        danger: {
          50:  "#FDECEA",
          500: "#E4372A",
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
        },
        /* ── Semantic surfaces (CSS var driven) ── */
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          bg:     "rgb(var(--bg) / <alpha-value>)",
          card:   "rgb(var(--surface) / <alpha-value>)",
          2:      "rgb(var(--surface-2) / <alpha-value>)",
          border: "rgb(var(--border) / <alpha-value>)",
        },
        /* ── Semantic ink (CSS var driven) ── */
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted:   "rgb(var(--ink-muted) / <alpha-value>)",
        },
        /* ── Semantic aliases ── */
        bg: "rgb(var(--bg) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        /* ── Primary / On-Primary ── */
        primary: {
          DEFAULT:   "rgb(var(--primary) / <alpha-value>)",
          onPrimary: "rgb(var(--on-primary) / <alpha-value>)",
          foreground: "rgb(var(--on-primary) / <alpha-value>)",
        },
        /* ── Knowledge (garde d'origine) ── */
        knowledge: {
          DEFAULT: "#2F9A50",
          hover:   "#248A43",
          light:   "#ECF7EF",
        },
        /* ── Exam Type badges — harmonisées avec la palette ── */
        examType: {
          devoir: {
            text:   "#1D4ED8",
            bg:     "#EFF6FF",
            border: "#BFDBFE",
          },
          examen: {
            text:   "#1F7A3A",
            bg:     "#ECF7EF",
            border: "#ABDCB8",
          },
          rattrapage: {
            text:   "#8A6D00",
            bg:     "#FEF6CC",
            border: "#F6D02F",
          },
        },
      },
      borderRadius: {
        card:  "16px",
        btn:   "12px",
        badge: "9999px",
      },
      boxShadow: {
        subtle:      "0 1px 3px 0 rgba(20, 35, 26, 0.04), 0 1px 2px -1px rgba(20, 35, 26, 0.02)",
        card:        "0 2px 10px -2px rgba(20, 35, 26, 0.05), 0 4px 16px -4px rgba(20, 35, 26, 0.03)",
        "card-hover": "0 16px 36px -8px rgba(31, 122, 58, 0.10), 0 4px 12px -2px rgba(31, 122, 58, 0.04)",
        glass:       "0 8px 30px rgba(0, 0, 0, 0.06)",
        glow:        "0 0 20px -2px rgba(31, 122, 58, 0.25)",
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
