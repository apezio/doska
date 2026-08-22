import { addDays, todayIso } from "@doska/core/utils"
import { cn, SheetAction, SheetBar, Text } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useState } from "react"
import { Pressable, View } from "react-native"

/** A deadline is a plain `YYYY-MM-DD`, so it is read and written in local time:
 * `new Date("2026-08-03")` is UTC midnight, which is the 2nd west of Greenwich. */
function toDate(iso: string | null): Date {
  if (!iso) return new Date()
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function toIso(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

interface IProps {
  value: string | null
  onCommit: (value: string | null) => void
  onClose: () => void
}

/** Picks a card's deadline — the web menu's presets over the system calendar,
 * with its Clear and Save. The pick is a draft until saved, so a mis-tap costs
 * nothing. */
export function DeadlineForm({ value, onCommit, onClose }: IProps) {
  const { primary } = useTokens()
  const [draft, setDraft] = useState(value)

  const today = todayIso()
  const presets = [
    { label: "Today", iso: today },
    { label: "Tomorrow", iso: addDays(today, 1) },
    { label: "In a week", iso: addDays(today, 7) },
  ]

  return (
    <View>
      <SheetBar
        title="Due date"
        leading={{ label: "Cancel", onPress: onClose }}
        trailing={{
          label: "Save",
          onPress: () => {
            if (draft !== value) onCommit(draft)
            onClose()
          },
        }}
      />

      <View className="flex-row gap-2 pb-2 pt-1">
        {presets.map((preset) => {
          const selected = preset.iso === draft
          return (
            <Pressable
              key={preset.iso}
              onPress={() => setDraft(preset.iso)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={cn(
                "flex-1 items-center rounded-xl px-3 py-2",
                selected ? "bg-secondary" : "bg-button-muted active:bg-muted"
              )}
            >
              <Text
                className={cn(
                  "text-footnote font-sans-medium",
                  selected
                    ? "text-secondary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {preset.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <DateTimePicker
        value={toDate(draft)}
        mode="date"
        // The month grid rather than the wheels — the only iOS display that is
        // a calendar at all.
        display="inline"
        accentColor={primary}
        onChange={(_event, date) => {
          if (date) setDraft(toIso(date))
        }}
      />

      {!!draft && (
        <SheetAction
          label="Clear date"
          role="destructive"
          onPress={() => setDraft(null)}
        />
      )}
    </View>
  )
}
