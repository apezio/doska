const RADIUS = 10

const fontFamily = {
  sans: ["Mulish_400Regular"],
  "sans-medium": ["Mulish_500Medium"],
  "sans-semibold": ["Mulish_600SemiBold"],
  "sans-bold": ["Mulish_700Bold"],
  mono: ["GeistMono_400Regular"],
  "mono-medium": ["GeistMono_500Medium"],
}

/* The iOS type scale, in size only. Tailwind's own `text-*` sizes each set a
   line height too, which a `Text` cannot then inherit — so every size the app
   sets is named here and leading is left to `leading-*` where it matters.
   Mirrored by the `font-size` group in the kit's `cn`, which would otherwise
   read these as text colours and drop them. */
const fontSize = {
  caption: "11px",
  footnote: "13px",
  subheadline: "15px",
  callout: "16px",
  body: "17px",
  title: "22px",
}

const sharedColors = require("@doska/tokens/tailwind-colors.cjs")

const color = (name) => `var(--${name})`

/** @type {import('tailwindcss').Config} */
module.exports = {
  // The kit ships as source, so its classes are only generated if scanned here.
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui-kit-mobile/src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily,
      fontSize,
      colors: {
        ...sharedColors,
        mark: color("mark"),
        "quote-bar": color("quote-bar"),
        "card-ring": color("card-ring"),
        "button-muted": color("button-muted"),
        "checkbox-fill": color("checkbox-fill"),
        "column-neutral": color("column-neutral"),
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
