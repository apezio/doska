import type { Foreground } from "@doska/ports"
import { AppState } from "react-native"

/** `inactive` is the iOS transition state — mid app-switcher, or a system
 * prompt over the app. It is not the foreground, so only `active` counts. */
export const mobileForeground: Foreground = {
  active: () => AppState.currentState === "active",
  subscribe: (listener) => {
    const subscription = AppState.addEventListener("change", listener)
    return () => subscription.remove()
  },
}
