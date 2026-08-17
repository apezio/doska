import { PRIORITIES, PRIORITY } from "@doska/tokens/priority"
import Flag from "lucide-react-native/icons/flag"
import { useMemo } from "react"
import { useTokens } from "./tokens"

interface IProps {
  value: string
  size?: number
}

export function PriorityChip({ value, size = 14 }: IProps) {
  const { destructive, mutedForeground, dark } = useTokens()

  const priority = PRIORITIES.find((p) => p.id === value)
  const color = useMemo(() => {
    if (priority?.id === "high") return destructive
    if (priority?.id === "medium") {
      return PRIORITY[dark ? "dark" : "light"].medium
    }
    return mutedForeground
  }, [priority, destructive, dark, mutedForeground])

  return (
    <Flag size={size} color={color} fill={priority ? color : "transparent"} />
  )
}
