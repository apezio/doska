import { PRIORITIES, PRIORITY } from "@doska/tokens/priority"
import Flag from "lucide-react-native/icons/flag"
import { View } from "react-native"
import { useTokens } from "./tokens"

interface IProps {
  value: string
  size?: number
}

/** 80%, the alpha the web mixes the flag's own colour down to. */
const DIMMED = "cc"

/** The flag's colour and the dot's, which the web keeps a shade apart. */
function usePriorityColors(value: string) {
  const { destructive, mutedForeground, dark } = useTokens()

  const priority = PRIORITIES.find((p) => p.id === value)
  const amber = PRIORITY[dark ? "dark" : "light"]

  if (priority?.id === "high") {
    return { priority, flag: destructive + DIMMED, dot: destructive }
  }
  if (priority?.id === "medium") {
    return { priority, flag: amber.flagMedium, dot: amber.dotMedium }
  }
  return { priority, flag: mutedForeground, dot: mutedForeground }
}

export function PriorityChip({ value, size = 14 }: IProps) {
  const { priority, flag } = usePriorityColors(value)

  return (
    <Flag size={size} color={flag} fill={priority ? flag : "transparent"} />
  )
}

/** A small dot marking a card's priority, meant to sit at the end of its title. */
export function PriorityDot({ value, size = 6 }: IProps) {
  const { priority, dot } = usePriorityColors(value)
  if (!priority) return null

  return (
    <View
      accessibilityLabel={`Priority: ${priority.label}`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: dot,
      }}
    />
  )
}
