import type { Column } from "@doska/core/types"
import { IconButton } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { router } from "expo-router"
import CircleCheck from "lucide-react-native/icons/circle-check"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import { Pressable, Text, View } from "react-native"
import { ROUTES } from "@/lib/routes"
import { ColumnSwatch } from "./column-swatch"

const HEAD_HEIGHT = 60

/** The web's `text-emerald-600/50 dark:text-emerald-500/50`, which is a
 * Tailwind palette entry rather than a theme token. */
const DONE_TINT = { light: "#05966980", dark: "#34d39980" }

interface IProps {
  column: Column
  showBody: boolean
  onToggleBody: () => void
}

export function ColumnHead({ column, showBody, onToggleBody }: IProps) {
  const { dark } = useTokens()

  return (
    <View
      style={{ height: HEAD_HEIGHT }}
      className="flex-row items-center justify-between gap-2 bg-background px-3"
    >
      <View className="flex-1 flex-row items-center gap-1.5">
        <ColumnSwatch color={column.color} />
        <Pressable
          onPress={() => router.push(ROUTES.columnRename(column.id))}
          accessibilityRole="button"
          accessibilityLabel={`Rename ${column.title}`}
          className="shrink active:opacity-40"
        >
          <Text
            numberOfLines={1}
            className="text-base font-sans-medium text-muted-foreground"
          >
            {column.title}
          </Text>
        </Pressable>
        {/* The only place the flag shows — its toggle lives in the sheet. */}
        {column.done ? (
          <CircleCheck
            size={16}
            color={dark ? DONE_TINT.dark : DONE_TINT.light}
            accessibilityLabel={`${column.title} is the done column`}
          />
        ) : null}
      </View>

      <View className="flex-row items-center gap-1">
        <Pressable onPress={onToggleBody} hitSlop={10}>
          <Text className="text-[13px] font-sans-medium text-muted-foreground">
            {showBody ? "Hide body" : "Show body"}
          </Text>
        </Pressable>
        <IconButton
          icon={MoreHorizontal}
          label={`${column.title} actions`}
          onPress={() => router.push(ROUTES.columnActions(column.id))}
        />
      </View>
    </View>
  )
}
