import {
  deadlineRelative,
  deadlineStatus,
  formatDeadlineNoYearIfCurrent,
} from "@doska/core/utils"
import { DEADLINE } from "@doska/tokens/deadline"
import { Text } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import Calendar from "lucide-react-native/icons/calendar"
import { View } from "react-native"

/** The web tints the chip `/80`; native colors take the alpha as hex. */
const SOFT = "cc"

interface IProps {
  /** No deadline still renders: the bare calendar is how one gets set. */
  value: string | null
  /** The card sits in the board's done column. */
  done: boolean
}

export function DeadlineChip({ value, done }: IProps) {
  const { destructive, mutedForeground, dark } = useTokens()

  // A done card is neutral whatever its deadline: no red, plain date.
  const status = done || !value ? "upcoming" : deadlineStatus(value)
  const label =
    value === null
      ? null
      : status === "upcoming"
        ? formatDeadlineNoYearIfCurrent(value)
        : deadlineRelative(value)
  const tint =
    status === "overdue"
      ? destructive + SOFT
      : status === "soon"
        ? DEADLINE[dark ? "dark" : "light"].soonForeground + SOFT
        : mutedForeground

  return (
    <View className="flex-row items-center gap-1">
      <Calendar size={14} color={tint} />
      {label !== null && (
        <Text className="text-xs font-sans-semibold" style={{ color: tint }}>
          {label}
        </Text>
      )}
    </View>
  )
}
