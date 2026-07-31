/** The web's `--radius`, 0.625rem at its 16px root. */
const RADIUS = 10

/**
 * The Mulish and Geist Mono weights are separate font files, so a weight is
 * chosen by family rather than by `font-weight` — `font-sans-semibold`, not
 * `font-sans font-semibold`. The names avoid Tailwind's own `font-medium` /
 * `font-bold` weight utilities on purpose: those set `fontWeight`, which a
 * single-weight native font file cannot honour.
 *
 * Every family here must be registered in `_layout.tsx`.
 */
const fontFamily = {
  sans: ["Mulish_400Regular"],
  "sans-medium": ["Mulish_500Medium"],
  "sans-semibold": ["Mulish_600SemiBold"],
  "sans-bold": ["Mulish_700Bold"],
  mono: ["GeistMono_400Regular"],
  "mono-medium": ["GeistMono_500Medium"],
}

// Named after the CSS variables in global.css, which mirror the web's tokens.
const color = (name) => `var(--${name})`

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily,
      colors: {
        background: color("background"),
        foreground: color("foreground"),
        card: { DEFAULT: color("card"), foreground: color("card-foreground") },
        popover: {
          DEFAULT: color("popover"),
          foreground: color("popover-foreground"),
        },
        primary: {
          DEFAULT: color("primary"),
          foreground: color("primary-foreground"),
        },
        secondary: {
          DEFAULT: color("secondary"),
          foreground: color("secondary-foreground"),
        },
        muted: {
          DEFAULT: color("muted"),
          foreground: color("muted-foreground"),
        },
        accent: {
          DEFAULT: color("accent"),
          foreground: color("accent-foreground"),
        },
        destructive: color("destructive"),
        success: {
          DEFAULT: color("success"),
          foreground: color("success-foreground"),
        },
        sidebar: {
          DEFAULT: color("sidebar"),
          foreground: color("sidebar-foreground"),
          primary: color("sidebar-primary"),
          "primary-foreground": color("sidebar-primary-foreground"),
          accent: color("sidebar-accent"),
          "accent-foreground": color("sidebar-accent-foreground"),
          border: color("sidebar-border"),
        },
        border: color("border"),
        input: color("input"),
        ring: color("ring"),
        mark: color("mark"),
        "quote-bar": color("quote-bar"),
        "card-ring": color("card-ring"),
        "button-muted": color("button-muted"),
        deadline: {
          overdue: color("deadline-overdue"),
          soon: color("deadline-soon"),
          "soon-foreground": color("deadline-soon-foreground"),
        },
      },
      borderRadius: {
        sm: RADIUS * 0.6,
        md: RADIUS * 0.8,
        lg: RADIUS,
        xl: RADIUS * 1.4,
        "2xl": RADIUS * 1.8,
        "3xl": RADIUS * 2.2,
        "4xl": RADIUS * 2.6,
      },
    },
  },
  plugins: [],
}
