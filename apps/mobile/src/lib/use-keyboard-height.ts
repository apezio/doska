import { useEffect, useState } from "react"
import { Keyboard, Platform } from "react-native"

/**
 * Height the keyboard currently covers, for padding a container that reaches the
 * screen bottom.
 *
 * `KeyboardAvoidingView` would need the navigation header's height passed in as
 * an offset to get this right inside a modal, and gets it silently wrong
 * without one. Padding by the measured height needs no such correction.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    // The `Will` events run alongside the iOS animation; Android only emits `Did`.
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow"
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide"

    const show = Keyboard.addListener(showEvent, (e) =>
      setHeight(e.endCoordinates.height)
    )
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0))

    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  return height
}
