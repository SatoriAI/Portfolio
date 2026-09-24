import type { Config } from "tailwindcss";

// The colour and type values here mirror the Visual Identity Kit ("Binary Axis",
// v5), kept in the repository at ../visual-kit.
// Every colour resolves through a CSS variable declared in src/index.css so that
// a future dark theme can be added there without touching this file.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand names from the kit, for places where the intent is the brand
        // colour itself rather than a semantic role.
        lavender: {
          DEFAULT: "hsl(var(--lavender))",
          deep: "hsl(var(--lavender-deep))",
        },
        blush: {
          DEFAULT: "hsl(var(--blush))",
          deep: "hsl(var(--blush-deep))",
        },
        iris: "hsl(var(--iris))",
        "control-border": "hsl(var(--control-border))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      // The kit's type scale, desktop first with a -sm mobile counterpart.
      fontSize: {
        display: ["4rem", { lineHeight: "4.375rem", letterSpacing: "-0.035em" }],
        "display-sm": ["2.25rem", { lineHeight: "2.5625rem", letterSpacing: "-0.035em" }],
        h2: ["2.5rem", { lineHeight: "3rem", letterSpacing: "-0.035em" }],
        "h2-sm": ["1.75rem", { lineHeight: "2.125rem", letterSpacing: "-0.035em" }],
        "card-title": ["1.5rem", { lineHeight: "1.9375rem", letterSpacing: "-0.02em" }],
        "card-title-sm": ["1.375rem", { lineHeight: "1.8125rem", letterSpacing: "-0.02em" }],
        "body-lg": ["1.125rem", { lineHeight: "1.8125rem" }],
        meta: ["0.8125rem", { lineHeight: "1.25rem" }],
      },
      maxWidth: {
        content: "1160px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "20px",
        // The kit's smallest radius, for motif modules. `rounded-sm` here is
        // calc(var(--radius) - 4px) = 8px, which turned every module into a pebble.
        motif: "2px",
      },
      // Elevation, per the kit: every shadow is cast in ink rather than neutral
      // black, because a grey shadow over this palette reads as dirt. `lift`
      // and `float` are the kit's two named elevations. `lift` is deliberately
      // not called `card`: a boxShadow key that collides with a colour key
      // makes Tailwind read `shadow-card` as a shadow-COLOUR utility, which
      // rendered the card hover lift in white on a near-white page. sm-xl keep Tailwind's
      // default geometry and only restate the colour, so the vendored
      // primitives in components/ui pick up the brand tint without being
      // edited. Elevation still means actionable: a static card gets none.
      boxShadow: {
        sm: "0 1px 2px 0 hsl(var(--ink) / 0.06)",
        DEFAULT: "0 1px 3px 0 hsl(var(--ink) / 0.1), 0 1px 2px -1px hsl(var(--ink) / 0.1)",
        md: "0 4px 6px -1px hsl(var(--ink) / 0.1), 0 2px 4px -2px hsl(var(--ink) / 0.1)",
        lg: "0 10px 15px -3px hsl(var(--ink) / 0.12), 0 4px 6px -4px hsl(var(--ink) / 0.12)",
        xl: "0 20px 25px -5px hsl(var(--ink) / 0.14), 0 8px 10px -6px hsl(var(--ink) / 0.14)",
        lift: "0 8px 24px -12px hsl(var(--ink) / 0.25)",
        float: "0 12px 32px -12px hsl(var(--ink) / 0.5)",
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        400: "400ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // A stroke drawing itself: pair with pathLength={1} and strokeDasharray={1}.
        draw: {
          from: { strokeDashoffset: "1" },
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        draw: "draw 500ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
