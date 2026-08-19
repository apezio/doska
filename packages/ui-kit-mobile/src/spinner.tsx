import LoaderCircle from "lucide-react-native/icons/loader-circle"
import { useEffect, useState } from "react"
import { Animated, Easing, View } from "react-native"
import { useTokens } from "./tokens"

/** One turn, matching the web's `animate-spin`. */
const SPIN_MS = 1000

interface IProps {
  size?: number
  color?: string
}

/** The web's spinning `LoaderCircle` — every loading state in the app uses it,
 * in place of the platform `ActivityIndicator`. */
export function Loader({ size = 16, color }: IProps) {
  const tokens = useTokens()
  const [turn] = useState(() => new Animated.Value(0))

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: SPIN_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )
    spin.start()
    return () => spin.stop()
  }, [turn])

  const rotate = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <LoaderCircle size={size} color={color ?? tokens.mutedForeground} />
    </Animated.View>
  )
}

/** Fills whatever it is dropped into while a screen waits on its query. */
export function Spinner() {
  return (
    <View className="flex-1 items-center justify-center">
      <Loader size={24} />
    </View>
  )
}
