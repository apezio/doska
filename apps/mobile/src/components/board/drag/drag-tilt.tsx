import type { PropsWithChildren } from "react"
import type { LayoutChangeEvent } from "react-native"
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated"
import { useItemContext } from "react-native-sortables"

/** Degrees a card leans by once it is fully lifted. */
const TILT_DEG = 1

/**
 * Tilts the card it wraps while it is being dragged. Must render inside a
 * sortable item, which is where `useItemContext` gets its progress value.
 */
export function DragTilt({
  children,
  onLayout,
}: PropsWithChildren<{ onLayout?: (event: LayoutChangeEvent) => void }>) {
  const { activationAnimationProgress } = useItemContext()

  const style = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(activationAnimationProgress.value, [0, 1], [0, TILT_DEG])}deg`,
      },
    ],
  }))

  return (
    <Animated.View style={style} onLayout={onLayout}>
      {children}
    </Animated.View>
  )
}
