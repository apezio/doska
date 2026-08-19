import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/** The app's own font sizes, from `tailwind.config.js`. tailwind-merge reads a
 * `text-*` it does not know as a colour, and would drop one against a real
 * colour class. */
const FONT_SIZES = [
  "text-caption",
  "text-footnote",
  "text-subheadline",
  "text-callout",
  "text-body",
  "text-title",
]

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": FONT_SIZES } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
