import { createContext, useContext } from "react"
import { Text as RNText, type TextProps } from "react-native"
import { cn } from "./lib/cn"

/** Whether a `Text` is being rendered inside another one. */
const Nested = createContext(false)

/**
 * `Text`, in the app's face by default.
 *
 * React Native resolves no font from a parent `View`, so an unstyled `Text`
 * falls back to the system face — which is why this stands in for the one from
 * `react-native` everywhere.
 *
 * Two things keep the default from overriding what a caller wants: a `font-*`
 * class is left alone (rather than merged, which would depend on which rule
 * Tailwind emits last), and a nested `Text` is left alone too, since it already
 * inherits its parent's face and forcing the default would flatten a run set in
 * bold back to regular.
 */
export function Text({ className, ...props }: TextProps) {
  const nested = useContext(Nested)
  const inherits = nested || className?.includes("font-") === true

  return (
    <Nested.Provider value={true}>
      <RNText
        className={inherits ? className : cn("font-sans", className)}
        {...props}
      />
    </Nested.Provider>
  )
}
