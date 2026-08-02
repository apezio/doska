import { useRef } from "react"
import { runOnJS, useAnimatedReaction } from "react-native-reanimated"
import { usePortalContext } from "react-native-sortables"

/**
 * Where the lifted card was last seen, in window coordinates. The sortable
 * clears the position as the card is released, so the last one has to be kept
 * to work out what a drop landed on.
 */
export function useDropPoint() {
  const portal = usePortalContext()
  const point = useRef({ x: 0, y: 0 })

  function keep(next: { x: number; y: number }) {
    point.current = next
  }

  useAnimatedReaction(
    () => portal?.activeItemAbsolutePosition.value ?? null,
    (position) => {
      if (position) runOnJS(keep)(position)
    }
  )

  return point
}
