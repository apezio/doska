import { BlurView } from "expo-blur"
import type { ReactNode } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { useTokens } from "./tokens"

/**
 * A blurred surface for content to pass under. Styled by value, not by class:
 * NativeWind only rewrites `className` on React Native's own components, and
 * `BlurView` is not one — so callers pass `style`.
 */
export function Frosted({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>
  children: ReactNode
}) {
  const { dark } = useTokens()

  return (
    <BlurView intensity={20} tint={dark ? "dark" : "light"} style={style}>
      {children}
    </BlurView>
  )
}
