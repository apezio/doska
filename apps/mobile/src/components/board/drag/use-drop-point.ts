import { useRef } from "react"
import { useAnimatedReaction } from "react-native-reanimated"
import { usePortalContext } from "react-native-sortables"
import { scheduleOnRN } from "react-native-worklets"

/**
 * Where the lifted card was last seen, in window coordinates. `onMove` runs on
 * the JS thread for every position the drag reports.
 */
export function useDropPoint(onMove?: (y: number) => void) {
  const portal = usePortalContext()
  const point = useRef({ x: 0, y: 0 })
  // Read through a ref so a caller may pass a fresh closure every render.
  const notify = useRef(onMove)
  notify.current = onMove

  function keep(next: { x: number; y: number }) {
    point.current = next
    notify.current?.(next.y)
  }

  useAnimatedReaction(
    () => portal?.activeItemAbsolutePosition.value ?? null,
    (position) => {
      if (position) scheduleOnRN(keep, position)
    }
  )

  return point
}
