import { useRef } from "react"
import { useAnimatedReaction } from "react-native-reanimated"
import { usePortalContext } from "react-native-sortables"
import { scheduleOnRN } from "react-native-worklets"

/**
 * Where the lifted card was last seen, in window coordinates.
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
      if (position) scheduleOnRN(keep, position)
    }
  )

  return point
}
