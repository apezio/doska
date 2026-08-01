import type { Column } from "@doska/core/types"
import { byPosition } from "@doska/core/utils"
import { generateKeyBetween } from "fractional-indexing"
import { ChevronDown, ChevronUp } from "lucide-react-native"
import { Pressable, ScrollView, Text, View } from "react-native"
import { SheetButton, SheetTitle } from "@/components/ui/sheet"
import { useTokens } from "@/lib/tokens"
import { ColumnSwatch } from "./column-swatch"

interface IProps {
  columns: Column[]
  onReorder: (changed: Column[]) => void
  onClose: () => void
}

/**
 * Reorders the board's columns a step at a time. The web drags them; a drag
 * inside a sheet fights the sheet's own dismiss gesture, so here each column
 * moves by button.
 */
export function ReorderColumns({ columns, onReorder, onClose }: IProps) {
  const tokens = useTokens()
  const ordered = [...columns].sort(byPosition)

  function move(index: number, delta: -1 | 1) {
    const moved = ordered[index]
    const target = index + delta
    if (!moved || target < 0 || target >= ordered.length) return

    const rest = ordered.filter((column) => column.id !== moved.id)
    const before = rest[target - 1]
    const after = rest[target]
    onReorder([
      {
        ...moved,
        position: generateKeyBetween(
          before?.position ?? null,
          after?.position ?? null
        ),
      },
    ])
  }

  return (
    <View>
      <SheetTitle
        title="Reorder columns"
        description="Move a column to change its place on the board."
      />

      <ScrollView className="max-h-96" contentContainerClassName="py-1">
        {ordered.map((column, index) => (
          <View
            key={column.id}
            className="flex-row items-center gap-2 rounded-xl px-3 py-2"
          >
            <ColumnSwatch color={column.color} />
            <Text
              numberOfLines={1}
              className="flex-1 text-[15px] font-sans-medium text-card-foreground"
            >
              {column.title}
            </Text>
            <Step
              icon={ChevronUp}
              label={`Move ${column.title} up`}
              disabled={index === 0}
              color={tokens.mutedForeground}
              onPress={() => move(index, -1)}
            />
            <Step
              icon={ChevronDown}
              label={`Move ${column.title} down`}
              disabled={index === ordered.length - 1}
              color={tokens.mutedForeground}
              onPress={() => move(index, 1)}
            />
          </View>
        ))}
      </ScrollView>

      <View className="mt-3 flex-row">
        <SheetButton label="Done" onPress={onClose} />
      </View>
    </View>
  )
}

function Step({
  icon: Icon,
  label,
  disabled,
  color,
  onPress,
}: {
  icon: typeof ChevronUp
  label: string
  disabled: boolean
  color: string
  onPress: () => void
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={disabled ? { opacity: 0.3 } : undefined}
      className="rounded-lg bg-button-muted p-2 active:opacity-70"
    >
      <Icon size={18} color={color} />
    </Pressable>
  )
}
