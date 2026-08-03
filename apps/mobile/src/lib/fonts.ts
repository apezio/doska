import {
  GeistMono_400Regular,
  GeistMono_500Medium,
} from "@expo-google-fonts/geist-mono"
import {
  Mulish_400Regular,
  Mulish_500Medium,
  Mulish_600SemiBold,
  Mulish_700Bold,
} from "@expo-google-fonts/mulish"

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
