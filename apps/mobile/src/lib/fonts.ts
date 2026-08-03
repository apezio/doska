// Per-face paths, not the package root: the root barrel re-exports every
// weight and italic, and Metro bundles the lot.
import { GeistMono_400Regular } from "@expo-google-fonts/geist-mono/400Regular"
import { GeistMono_500Medium } from "@expo-google-fonts/geist-mono/500Medium"
import { Mulish_400Regular } from "@expo-google-fonts/mulish/400Regular"
import { Mulish_500Medium } from "@expo-google-fonts/mulish/500Medium"
import { Mulish_600SemiBold } from "@expo-google-fonts/mulish/600SemiBold"
import { Mulish_700Bold } from "@expo-google-fonts/mulish/700Bold"

/** Keys become family names, so they must match `fontFamily` in tailwind.config.js. */
export const FONTS = {
  Mulish_400Regular,
  Mulish_500Medium,
  Mulish_600SemiBold,
  Mulish_700Bold,
  GeistMono_400Regular,
  GeistMono_500Medium,
}

/** The same faces for anything styled outside Tailwind — a native header, say.
 * Named after the `font-*` classes they mirror. */
export const FONT = {
  sans: "Mulish_400Regular",
  sansMedium: "Mulish_500Medium",
  sansSemibold: "Mulish_600SemiBold",
  sansBold: "Mulish_700Bold",
  mono: "GeistMono_400Regular",
  monoMedium: "GeistMono_500Medium",
} as const satisfies Record<string, keyof typeof FONTS>
