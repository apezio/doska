import type { Column } from "@doska/core/types"
import { cn, IconButton, Text } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { router } from "expo-router"
import Check from "lucide-react-native/icons/check"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import FoldVertical from "lucide-react-native/icons/fold-vertical"
import UnfoldVertical from "lucide-react-native/icons/unfold-vertical"
import { Pressable, View } from "react-native"
import { ROUTES } from "@/lib/routes"
import { ColumnSwatch } from "./column-swatch"

interface IProps {
  column: Column
  showBody: boolean
  onToggleBody: () => void
}

export function ColumnHead({ column, showBody, onToggleBody }: IProps) {
  const tokens = useTokens()

  return (
    <View className="flex-row items-center justify-between gap-3 bg-background px-3 h-20">
      <ColumnSwatch color={column.color} />
      <View
        className={cn(
          "flex-1 flex-row items-center gap-3",
          column.done && "-mt-1"
        )}
      >
        <Pressable
          onPress={() => router.push(ROUTES.columnRename(column.id))}
          accessibilityRole="button"
          accessibilityLabel={`Rename ${column.title}`}
          className="active:opacity-40 relative"
        >
          <Text
            numberOfLines={1}
            className="text-base font-sans-medium text-muted-foreground"
          >
            {column.title}
          </Text>
          {column.done && (
            <Text
              numberOfLines={1}
              className="text-xs font-sans text-muted-foreground absolute -bottom-3.5 w-[120px]"
            >
              Marks cards as done
            </Text>
          )}
        </Pressable>
        {column.done && (
          <Check
            size={16}
            color={tokens.mutedForeground}
            accessibilityLabel={`${column.title} is the done column`}
          />
        )}
      </View>

      <View className="flex-row items-center gap-1">
        <IconButton
          icon={showBody ? FoldVertical : UnfoldVertical}
          label={showBody ? "Hide card bodies" : "Show card bodies"}
          onPress={onToggleBody}
        />
        <IconButton
          icon={MoreHorizontal}
          label={`${column.title} actions`}
          onPress={() => router.push(ROUTES.columnActions(column.id))}
        />
      </View>
    </View>
  )
}
