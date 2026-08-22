import { cn, Text } from "@doska/ui-kit-mobile"
import { View } from "react-native"
import type { GroupSection } from "@/components/upcoming/sections"

export function GroupHeading({ section }: { section: GroupSection }) {
  return (
    <View className="flex-row items-baseline gap-2 pt-3">
      <Text
        className={cn(
          "text-xs font-sans-semibold uppercase",
          section.kind === "overdue"
            ? "text-destructive"
            : "text-muted-foreground"
        )}
      >
        {section.title}
      </Text>
      {section.aside.length > 0 && (
        <Text className="text-xs text-muted-foreground/70">
          {section.aside}
        </Text>
      )}
    </View>
  )
}
