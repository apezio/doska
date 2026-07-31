import { cardDisplayId } from "@doska/contract/prefix"
import { useCardCol, useCardDeck } from "@doska/core/queries"
import { Pressable, Text, View } from "react-native"
import { CardMeta } from "@/components/board/card-meta"
import { ColumnSwatch } from "@/components/board/column-swatch"

interface IProps {
  cardId: string
  /** The unsaved body, so task progress tracks it live. */
  body: string
  deadline: string | null
  cardNumber: number | null
  isPreview: boolean
  onTogglePreview: () => void
  onClose: () => void
}

/** The card panel's own bar: preview toggle, save, then the meta row. The
 * sheet's own gesture is the way back, so there is no close button. */
export function CardPaneHeader({
  cardId,
  body,
  deadline,
  cardNumber,
  isPreview,
  onTogglePreview,
  onClose,
}: IProps) {
  const { data: column } = useCardCol(cardId)
  const { data: deck } = useCardDeck(cardId)

  return (
    <View className="shrink-0 bg-card">
      <View className="flex-row items-center justify-end gap-2 px-3 py-2">
        <Pressable onPress={onTogglePreview} hitSlop={8} className="px-2 py-1">
          <Text className="text-base font-sans-medium text-card-foreground">
            {isPreview ? "Edit" : "Preview"}
          </Text>
        </Pressable>
        {/* Saving is continuous; the button is the way out that flushes it. */}
        <Pressable
          onPress={onClose}
          className="rounded-lg bg-primary px-3 py-1.5 active:opacity-80"
        >
          <Text className="text-base font-sans-medium text-primary-foreground">
            Save
          </Text>
        </Pressable>
      </View>

      <View className="flex-row items-center gap-4 border-t border-muted px-4 py-2">
        <CardMeta
          displayId={cardDisplayId(deck?.prefix ?? "", cardNumber) ?? ""}
          body={body}
          deadline={deadline}
          done={column?.done ?? false}
        />
        {column ? (
          <View className="flex-row items-center gap-1.5 rounded-full bg-muted px-2 py-0.5">
            <ColumnSwatch color={column.color} />
            <Text className="text-xs font-sans-medium uppercase text-muted-foreground">
              {column.title}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}
