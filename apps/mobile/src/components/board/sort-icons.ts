import { type SortKey } from "@doska/core/utils"
import type { LucideIcon } from "lucide-react-native"
import CalendarClock from "lucide-react-native/icons/calendar-clock"
import Flag from "lucide-react-native/icons/flag"

/** The native icon for each of core's sort modes. */
export const SORT_ICONS: Record<SortKey, LucideIcon> = {
  priority: Flag,
  deadline: CalendarClock,
}
