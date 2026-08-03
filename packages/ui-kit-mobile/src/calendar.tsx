import { ChevronLeft, ChevronRight } from "lucide-react-native"
import { useState } from "react"
import { Pressable, Text, View } from "react-native"
import { useTokens } from "./tokens"

/** Local `YYYY-MM-DD` for today. Deliberately a copy of `@doska/ui-kit`'s — a
 * native kit has no business depending on the web one, and `@doska/core` keeps
 * its own for the same reason. */
function todayIso(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

/** Monday-first, in the device's language. 2024-01-01 was a Monday. */
const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(undefined, {
    weekday: "narrow",
    timeZone: "UTC",
  })
)

/** Always six weeks, so the sheet does not resize as the month changes. */
const CELLS = 42

/** Every date drawn for `month` (`YYYY-MM`), including the days either side of
 * it that fill the first and last weeks. Walked in UTC so a DST boundary can't
 * shift a cell onto the wrong calendar day. */
function monthGrid(month: string): string[] {
  const first = new Date(`${month}-01T00:00:00Z`)
  const mondayFirst = (first.getUTCDay() + 6) % 7

  const cursor = new Date(first)
  cursor.setUTCDate(1 - mondayFirst)

  const days: string[] = []
  for (let i = 0; i < CELLS; i++) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

function shiftMonth(month: string, by: number): string {
  const d = new Date(`${month}-01T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + by)
  return d.toISOString().slice(0, 7)
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

interface IProps {
  /** The selected day as `YYYY-MM-DD`, or `null` for none. */
  value: string | null
  onSelect: (iso: string) => void
}

/**
 * A month grid for picking one date — the web kit's `Calendar`, which is
 * `react-day-picker` and cannot come along. Selection is the caller's state;
 * this only draws it and reports taps.
 */
export function Calendar({ value, onSelect }: IProps) {
  const tokens = useTokens()
  const today = todayIso()
  // Opens on the selected date's month, or this one. Not re-derived: paging
  // away and having the grid snap back on the next render would be unusable.
  const [month, setMonth] = useState(() => (value ?? today).slice(0, 7))

  return (
    <View>
      <View className="h-11 flex-row items-center justify-between">
        <Pressable
          hitSlop={8}
          onPress={() => setMonth(shiftMonth(month, -1))}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          className="rounded-lg p-1.5 active:bg-muted"
        >
          <ChevronLeft size={20} color={tokens.foreground} />
        </Pressable>
        <Text className="text-[15px] font-sans-semibold text-card-foreground">
          {monthLabel(month)}
        </Text>
        <Pressable
          hitSlop={8}
          onPress={() => setMonth(shiftMonth(month, 1))}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          className="rounded-lg p-1.5 active:bg-muted"
        >
          <ChevronRight size={20} color={tokens.foreground} />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((day, index) => (
          <Text
            // Two weekdays share a narrow letter in most languages, so the
            // position is the only unique thing about a cell.
            key={index}
            className="flex-1 pb-1 text-center text-xs font-sans-medium text-muted-foreground"
          >
            {day}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {monthGrid(month).map((iso) => (
          <Day
            key={iso}
            iso={iso}
            selected={iso === value}
            isToday={iso === today}
            outside={!iso.startsWith(month)}
            onPress={() => onSelect(iso)}
          />
        ))}
      </View>
    </View>
  )
}

function Day({
  iso,
  selected,
  isToday,
  outside,
  onPress,
}: {
  iso: string
  selected: boolean
  isToday: boolean
  outside: boolean
  onPress: () => void
}) {
  const label = String(Number(iso.slice(8)))

  let box = "items-center justify-center rounded-full"
  if (selected) box += " bg-primary"
  else if (isToday) box += " border border-border"

  let text = "text-[15px] font-sans"
  if (selected) text += " font-sans-semibold text-primary-foreground"
  else if (outside) text += " text-muted-foreground/50"
  else text += " text-card-foreground"

  return (
    // A seventh of the row, whatever the sheet is wide; the square inside it
    // is what gets the selected fill.
    <View className="w-[14.2857%] items-center py-0.5">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={iso}
        accessibilityState={{ selected }}
        className={`size-10 ${box}`}
      >
        <Text className={text}>{label}</Text>
      </Pressable>
    </View>
  )
}
