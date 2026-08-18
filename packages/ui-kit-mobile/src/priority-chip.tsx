import { PRIORITIES, PRIORITY } from "@doska/tokens/priority"
import Flag from "lucide-react-native/icons/flag"
import { useMemo } from "react"
import { View } from "react-native"
import { useTokens } from "./tokens"

interface IProps {
  value: string
  size?: number
}

function usePriorityColor(value: string) {
  const { destructive, mutedForeground, dark } = useTokens()

  const priority = PRIORITIES.find((p) => p.id === value)
  const color = useMemo(() => {
    if (priority?.id === "high") return destructive
    if (priority?.id === "medium") {
      return PRIORITY[dark ? "dark" : "light"].medium
    }
    return mutedForeground
  }, [priority, destructive, dark, mutedForeground])

  return { priority, color }
}

export function PriorityChip({ value, size = 14 }: IProps) {
  const { priority, color } = usePriorityColor(value)

  return (
    <Flag size={size} color={color} fill={priority ? color : "transparent"} />
  )
}

/** A small dot marking a card's priority, meant to sit at the end of its title. */
export function PriorityDot({ value, size = 6 }: IProps) {
  const { priority, color } = usePriorityColor(value)
  if (!priority) return null

  return (
    <View
      accessibilityLabel={`Priority: ${priority.label}`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  )
}
