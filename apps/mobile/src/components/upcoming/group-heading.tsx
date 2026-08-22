import { cn, Text } from "@doska/ui-kit-mobile"
import { View } from "react-native"
import type { GroupSection } from "@/components/upcoming/sections"

export function GroupHeading({ section }: { section: GroupSection }) {
  return (
    <View className="flex-row items-baseline gap-2 pt-3">
      <Text
        className={cn(
          "text-base font-sans-bold",
          section.kind === "overdue"
            ? "text-destructive"
            : section.kind === "undated"
              ? "text-muted-foreground"
              : "text-foreground"
        )}
      >
        {section.title}
      </Text>
      {section.kind === "date" && (
        <>
          <Text className="text-footnote text-muted-foreground">
            {section.day}
          </Text>
          <Text className="text-footnote text-muted-foreground">
            {section.countdown}
          </Text>
        </>
      )}
    </View>
  )
}
