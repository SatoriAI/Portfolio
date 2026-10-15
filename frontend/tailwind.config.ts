import type { Config } from "tailwindcss";

// A shadow's colour at the kit's light alpha `a`: ink in light, near-black at
// twice the alpha in dark (--shadow-strength), never past 0.6, where a float
// would turn solid.
const cast = (a: number) => `hsl(var(--shadow) / min(calc(${a} * var(--shadow-strength)), 0.6))`;

// The colour and type values here mirror the Visual Identity Kit ("Binary Axis",
// v5.2), kept in the repository at ../visual-kit.
// Every colour resolves through a CSS variable declared in src/index.css so that
// the dark theme is a second block there and this file does not change.
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
        note: {
          DEFAULT: "hsl(var(--note))",
          rule: "hsl(var(--note-rule))",
        },
        // Brand names from the kit, for places where the intent is the brand
        // colour itself rather than a semantic role.
        lavender: {
          DEFAULT: "hsl(var(--lavender))",
          deep: "hsl(var(--lavender-deep))",
          // Lavender on surface: a control hovered or open, or a tile set on a
          // card. Plain lavender is for panels and bands on the page.
          hover: "hsl(var(--lavender-hover))",
        },
        blush: {
          DEFAULT: "hsl(var(--blush))",
          deep: "hsl(var(--blush-deep))",
        },
        iris: "hsl(var(--iris))",
        "control-border": "hsl(var(--control-border))",
        published: "hsl(var(--published))",
        preprint: "hsl(var(--preprint))",
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
        // Handwriting, for the students' words on the sticky notes only.
        hand: ["Caveat", "cursive"],
      },
      // The kit's type scale, desktop first with a -sm mobile counterpart.
      fontSize: {
        display: ["4rem", { lineHeight: "4.375rem", letterSpacing: "-0.035em" }],
        "display-sm": ["2.25rem", { lineHeight: "2.5625rem", letterSpacing: "-0.035em" }],
        // The home masthead: the hero line set small enough to share the first
        // screen with the project index.
        "display-md": ["3rem", { lineHeight: "3.25rem", letterSpacing: "-0.035em" }],
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
        // The kit has three radii (2, 12, 20) and "no fourth value". The
        // shadcn defaults derived md and sm from --radius as 10px and 8px,
        // which put the header links and inline text links off the scale, so
        // md is a control's 12px and sm the motif's 2px.
        md: "var(--radius)",
        sm: "2px",
        card: "20px",
        // The kit's smallest radius, for motif modules; the name says why.
        motif: "2px",
      },
      // Elevation, per the kit: every shadow is cast in --shadow (see `cast`)
      // rather than neutral black, because a grey shadow over this palette
      // reads as dirt. `lift` and
      // `float` are the kit's two named elevations. `lift` is deliberately
      // not called `card`: a boxShadow key that collides with a colour key
      // makes Tailwind read `shadow-card` as a shadow-COLOUR utility, which
      // rendered the card hover lift in white on a near-white page. sm-xl keep Tailwind's
      // default geometry and only restate the colour, so the vendored
      // primitives in components/ui pick up the brand tint without being
      // edited. Elevation still means actionable: a static card gets none.
      boxShadow: {
        sm: `0 1px 2px 0 ${cast(0.06)}`,
        DEFAULT: `0 1px 3px 0 ${cast(0.1)}, 0 1px 2px -1px ${cast(0.1)}`,
        md: `0 4px 6px -1px ${cast(0.1)}, 0 2px 4px -2px ${cast(0.1)}`,
        lg: `0 10px 15px -3px ${cast(0.12)}, 0 4px 6px -4px ${cast(0.12)}`,
        xl: `0 20px 25px -5px ${cast(0.14)}, 0 8px 10px -6px ${cast(0.14)}`,
        lift: `0 8px 24px -12px ${cast(0.25)}`,
        float: `0 12px 32px -12px ${cast(0.5)}`,
        // Pressed in: the chosen project in the list, and a live check while
        // its request is out. Only on controls, as every elevation here.
        press: `inset 0 1px 3px 0 ${cast(0.14)}`,
        // A pressable circle: a white gap, a solid 2px control-border rim
        // round it (the edge every control has), and the lift beneath, so a
        // logo reads as a button even when its own colours are white. Not a
        // colour key, see above.
        rim: `0 0 0 3px hsl(var(--surface)), 0 0 0 5px hsl(var(--control-border)), 0 8px 24px -12px ${cast(0.35)}`,
        // The same circle with keyboard focus: the kit's 2px iris ring, 3px
        // outside the rim. On the rim itself it would read as the circle
        // being chosen, which is drawn there.
        "rim-focus": `0 0 0 3px hsl(var(--surface)), 0 0 0 5px hsl(var(--control-border)), 0 0 0 8px hsl(var(--surface)), 0 0 0 10px hsl(var(--iris)), 0 8px 24px -12px ${cast(0.35)}`,
        // The chosen circle on the timeline: the rim itself turns iris, where
        // a name sits just above it and its dialog opens over it at once.
        "rim-chosen": `0 0 0 3px hsl(var(--surface)), 0 0 0 5px hsl(var(--iris)), 0 8px 24px -12px ${cast(0.35)}`,
        // Chosen and focused from the keyboard: the iris rim, and the focus
        // ring outside it.
        "rim-chosen-focus": `0 0 0 3px hsl(var(--surface)), 0 0 0 5px hsl(var(--iris)), 0 0 0 8px hsl(var(--surface)), 0 0 0 10px hsl(var(--iris)), 0 8px 24px -12px ${cast(0.35)}`,
        // A project's puck on the home page's heat field: the circle's white
        // gap with a hairline instead of the control rim, which on a pale
        // field and at phone size read as a disabled control.
        puck: `0 0 0 3px hsl(var(--surface)), 0 0 0 4px hsl(var(--border)), 0 8px 24px -12px ${cast(0.35)}`,
        "puck-focus": `0 0 0 3px hsl(var(--surface)), 0 0 0 4px hsl(var(--border)), 0 0 0 7px hsl(var(--surface)), 0 0 0 9px hsl(var(--iris)), 0 8px 24px -12px ${cast(0.35)}`,
      },
      // The dimmed page behind a sheet or dialog, cast like a shadow: in the
      // text colour it would lighten the dark theme instead of dimming it.
      // Not a colour key, so it takes no alpha modifier: the alpha is here.
      backgroundColor: {
        scrim: cast(0.4),
        "scrim-faint": cast(0.15),
      },
      // Vex's answers are set with @tailwindcss/typography, whose colours are
      // its own greys: bold, headings, quotes and bullets drew near-black on
      // the dark theme's navy. Every prose colour is a theme token instead,
      // and the inverted set (the reader's own messages, on the primary fill)
      // follows primary-foreground.
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "hsl(var(--foreground))",
            "--tw-prose-headings": "hsl(var(--foreground))",
            "--tw-prose-lead": "hsl(var(--muted-foreground))",
            "--tw-prose-links": "hsl(var(--iris))",
            "--tw-prose-bold": "hsl(var(--foreground))",
            "--tw-prose-counters": "hsl(var(--muted-foreground))",
            "--tw-prose-bullets": "hsl(var(--control-border))",
            "--tw-prose-hr": "hsl(var(--border))",
            "--tw-prose-quotes": "hsl(var(--foreground))",
            "--tw-prose-quote-borders": "hsl(var(--border))",
            "--tw-prose-captions": "hsl(var(--muted-foreground))",
            "--tw-prose-kbd": "hsl(var(--foreground))",
            "--tw-prose-code": "hsl(var(--foreground))",
            "--tw-prose-pre-code": "hsl(var(--primary-foreground))",
            "--tw-prose-pre-bg": "hsl(var(--primary))",
            "--tw-prose-th-borders": "hsl(var(--control-border))",
            "--tw-prose-td-borders": "hsl(var(--border))",
            "--tw-prose-invert-body": "hsl(var(--primary-foreground))",
            "--tw-prose-invert-headings": "hsl(var(--primary-foreground))",
            "--tw-prose-invert-lead": "hsl(var(--primary-foreground))",
            "--tw-prose-invert-links": "hsl(var(--primary-foreground))",
            "--tw-prose-invert-bold": "hsl(var(--primary-foreground))",
            "--tw-prose-invert-counters": "hsl(var(--primary-foreground))",
            "--tw-prose-invert-bullets": "hsl(var(--primary-foreground))",
            "--tw-prose-invert-hr": "hsl(var(--primary-foreground))",
            "--tw-prose-invert-quotes": "hsl(var(--primary-foreground))",
            "--tw-prose-invert-quote-borders": "hsl(var(--primary-foreground))",
            "--tw-prose-invert-captions": "hsl(var(--primary-foreground))",
            "--tw-prose-invert-code": "hsl(var(--primary-foreground))",
          },
        },
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
        // A clock numeral counted as the hand passes it: iris, fading back.
        tick: {
          from: { fill: "hsl(var(--iris))" },
        },
        // A highlighter drawn across words, left to right, line after line.
        marker: {
          from: { backgroundSize: "0% 70%" },
          to: { backgroundSize: "100% 70%" },
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
        // At a hand's pace: easing in and out, not the brand's quick start.
        marker: "marker 600ms cubic-bezier(0.45, 0, 0.55, 1) both",
        tick: "tick 700ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
