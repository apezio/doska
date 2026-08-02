import { useEffect, useRef } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"
import type Animated from "react-native-reanimated"
import {
  runOnJS,
  scrollTo,
  useAnimatedRef,
  useFrameCallback,
  useScrollViewOffset,
  useSharedValue,
} from "react-native-reanimated"
import { usePortalContext } from "react-native-sortables"

/**
 * How far sideways a lifted card has to be carried, as a share of the screen,
 * before it counts as being held against that side. Travel rather than a band
 * at the screen's edge: a card is nearly as wide as the screen, so its own
 * edges sit in both bands from the moment it lifts.
 */
const EDGE_TRAVEL = 0.2
const DWELL_MS = 450

/**
 * Pages the board while a card is in the air. A column fills the screen, so a
 * card can only reach another column by the board moving under it: hold the
 * card against either side and the next column comes across.
 *
 * The sortable publishes the lifted card's position for its own portal, which
 * is what this reads — there is no second gesture here.
 */
export function useEdgePaging(columnIds: string[], width: number) {
  const portal = usePortalContext()
  const pagerRef = useAnimatedRef<Animated.ScrollView>()
  const offset = useScrollViewOffset(pagerRef)
  const edgeSince = useSharedValue(0)
  const ids = useSharedValue(columnIds)
  const pageWidth = useSharedValue(width)
  // The page this hook has scrolled to, held until the scroll lands, since
  // until then the offset still reads as the page being left. -1 when the
  // board is where the user last put it.
  const target = useSharedValue(-1)
  // Where the card was when it lifted, so its travel can be read off. NaN
  // while nothing is in the air.
  const originX = useSharedValue(Number.NaN)

  // Frame callbacks capture their closure once, so what they read travels as
  // shared values rather than as props.
  useEffect(() => {
    ids.value = columnIds
  }, [columnIds, ids])
  useEffect(() => {
    pageWidth.value = width
  }, [width, pageWidth])

  // The drop handler runs on the JS side and needs to know which column the
  // card is over, so every page change is mirrored back out.
  const page = useRef(0)
  function setPage(next: number) {
    page.current = next
  }

  function onPagerScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width > 0)
      page.current = Math.round(event.nativeEvent.contentOffset.x / width)
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
    const reach = pageWidth.value * EDGE_TRAVEL
    const step = travel < -reach ? -1 : travel > reach ? 1 : 0
    const current =
      target.value >= 0
        ? target.value
        : Math.round(offset.value / pageWidth.value)
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

    // Set, not cleared: holding on at the edge pages again only after another
    // full dwell, never on the frame the scroll starts.
    edgeSince.value = now
    target.value = next
    runOnJS(setPage)(next)
    scrollTo(pagerRef, next * pageWidth.value, 0, true)
  })

  return { pagerRef, onPagerScroll, page }
}
