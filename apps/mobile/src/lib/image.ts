import { Image } from "expo-image"
import { cssInterop } from "nativewind"

/**
 * `expo-image` rather than React Native's: it decodes to the size it is drawn
 * at and keeps a bounded memory cache, where RN holds every mounted image's
 * bitmap at full source resolution.
 */
// Not a core component, so nativewind has to be told `className` is its style.
cssInterop(Image, { className: "style" })

export { Image }
