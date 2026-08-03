import {
  deadlineRelative,
  deadlineStatus,
  formatDeadline,
} from "@doska/core/utils"
import { DEADLINE } from "@doska/tokens/deadline"
import { Chip } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { Calendar } from "lucide-react-native"
import { Text } from "react-native"

/** Matches the web's `CHIP_BY_STATUS`, minus the hover state. */
const CHIP = {
  overdue: { box: "bg-deadline-overdue", text: "text-destructive" },
  soon: { box: "bg-deadline-soon", text: "text-deadline-soon-foreground" },
  upcoming: { box: "", text: "text-muted-foreground" },
}

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
        ? formatDeadline(value)
        : deadlineRelative(value)
  const chip = CHIP[status]
  const tint =
    status === "overdue"
      ? destructive
      : status === "soon"
        ? DEADLINE[dark ? "dark" : "light"].soonForeground
        : mutedForeground

  return (
    <Chip className={chip.box}>
      <Calendar size={14} color={tint} />
      {label !== null && (
        <Text className={`text-xs font-sans-semibold ${chip.text}`}>
          {label}
        </Text>
      )}
    </Chip>
  )
}
