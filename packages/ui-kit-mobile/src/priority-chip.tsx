import { PRIORITIES, PRIORITY } from "@doska/tokens/priority"
import Flag from "lucide-react-native/icons/flag"
import { useTokens } from "./tokens"

interface IProps {
  /** `""` means none: the outline flag still renders, since it is how one gets set. */
  value: string
  size?: number
}

/** The priority flag, colored by how urgent the level is — filled once a level
 * is set, an outline while there is none. */
export function PriorityChip({ value, size = 14 }: IProps) {
  const { destructive, mutedForeground, dark } = useTokens()

  const priority = PRIORITIES.find((p) => p.id === value)
  const color =
    priority?.id === "high"
      ? destructive
      : priority?.id === "medium"
        ? PRIORITY[dark ? "dark" : "light"].medium
        : mutedForeground

  return (
    <Flag size={size} color={color} fill={priority ? color : "transparent"} />
  )
}
