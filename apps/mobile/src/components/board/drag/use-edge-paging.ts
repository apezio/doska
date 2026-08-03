import { useEffect, useRef } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"
import type Animated from "react-native-reanimated"
import {
  scrollTo,
  useAnimatedRef,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated"
import { usePortalContext } from "react-native-sortables"
import { scheduleOnRN } from "react-native-worklets"

/** Travel, not a band at the screen edge: a card is nearly screen-wide, so it
 * sits in both bands from the moment it lifts. Small because the room between
 * finger and screen edge is all there is; the dwell is what filters wobble. */
const EDGE_TRAVEL = 36
const DWELL_MS = 450

/**
 * Pages the board while a card is in the air — a column fills the screen, so a
 * card reaches another column only by the board moving under it. Reads the
 * position the sortable publishes for its portal; there is no gesture here.
 */
export function useEdgePaging(columnIds: string[], width: number) {
  const portal = usePortalContext()
  const pagerRef = useAnimatedRef<Animated.ScrollView>()
  const edgeSince = useSharedValue(0)
  const ids = useSharedValue(columnIds)
  const pageWidth = useSharedValue(width)
  // -1 while the board is where the user put it. Held until the scroll lands:
  // until then the offset still reads as the page being left.
  const target = useSharedValue(-1)
  // NaN while nothing is in the air.
  const originX = useSharedValue(Number.NaN)

  // Frame callbacks capture their closure once, so what they read travels as
  // shared values rather than as props.
  useEffect(() => {
    ids.value = columnIds
  }, [columnIds, ids])
  useEffect(() => {
    pageWidth.value = width
  }, [width, pageWidth])

  // For the drop handler, which runs on the JS side.
  const page = useRef(0)
  // The same page for the frame callback. Off scroll events rather than
  // `useScrollViewOffset`, whose ref is still empty on the first render — the
  // pager mounts only once the board loads.
  const scrolledPage = useSharedValue(0)

  function setPage(next: number) {
    page.current = next
  }

  function onPagerScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width > 0) {
      const next = Math.round(event.nativeEvent.contentOffset.x / width)
      page.current = next
      scrolledPage.value = next
    }
  }

  useFrameCallback((frame) => {
    "worklet"
    const position = portal?.activeItemAbsolutePosition.value
    if (!position) {
      edgeSince.value = 0
      target.value = -1
      originX.value = Number.NaN
      return
    }
    if (Number.isNaN(originX.value)) {
      originX.value = position.x
      return
    }

    const travel = position.x - originX.value
    const step = travel < -EDGE_TRAVEL ? -1 : travel > EDGE_TRAVEL ? 1 : 0
    const current = target.value >= 0 ? target.value : scrolledPage.value
    const next = current + step
    if (step === 0 || next < 0 || next >= ids.value.length) {
      edgeSince.value = 0
      return
    }

    const now = frame.timeSinceFirstFrame
    if (edgeSince.value === 0) {
      edgeSince.value = now
      return
    }
    if (now - edgeSince.value < DWELL_MS) return

    // Set, not cleared: holding on pages again only after another full dwell.
    edgeSince.value = now
    target.value = next
    scheduleOnRN(setPage, next)
    scrollTo(pagerRef, next * pageWidth.value, 0, true)
  })

  return { pagerRef, onPagerScroll, page }
}
