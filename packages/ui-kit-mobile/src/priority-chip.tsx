import { PRIORITY, priorityBand } from "@doska/tokens/priority"
import Flag from "lucide-react-native/icons/flag"
import { useMemo } from "react"
import { useTokens } from "./tokens"

interface IProps {
  /** The card's priority, 0–100; `0` draws the outline only. */
  value: number
  size?: number
}

export function PriorityChip({ value, size = 14 }: IProps) {
  const { destructive, mutedForeground, dark } = useTokens()

  const band = priorityBand(value)
  const color = useMemo(() => {
    if (band === "high") return destructive
    if (band === "medium") return PRIORITY[dark ? "dark" : "light"].medium
    return mutedForeground
  }, [band, destructive, dark, mutedForeground])

  return <Flag size={size} color={color} fill={band ? color : "transparent"} />
}
