import type { DigestFilter } from "@doska/core/operations"
import { cn, Text } from "@doska/ui-kit-mobile"
import { Pressable, View } from "react-native"

const FILTERS: { id: DigestFilter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Upcoming" },
]

interface IProps {
  value: DigestFilter
  onChange: (filter: DigestFilter) => void
}

/** The digest's two ranges, as the iOS segmented control the web draws as two
 * header buttons. */
export function UpcomingFilter({ value, onChange }: IProps) {
  return (
    <View className="mx-3 mt-3 flex-row rounded-lg bg-muted p-0.5">
      {FILTERS.map((filter) => {
        const selected = filter.id === value

        return (
          <Pressable
            key={filter.id}
            onPress={() => onChange(filter.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={cn(
              "flex-1 items-center rounded-[6px] py-1.5",
              selected ? "bg-card" : "active:opacity-70"
            )}
          >
            <Text
              className={cn(
                "text-footnote font-sans-medium",
                selected ? "text-card-foreground" : "text-muted-foreground"
              )}
            >
              {filter.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
