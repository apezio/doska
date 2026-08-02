import { cardDisplayId } from "@doska/contract/prefix"
import { useCardCol, useCardDeck } from "@doska/core/queries"
import { Text, View } from "react-native"
import { CardMeta } from "@/components/board/card-meta"
import { ColumnSwatch } from "@/components/board/column-swatch"
import { SheetBar } from "@/components/ui/sheet"

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

/** The card sheet's own bar: the mode toggle leading, `Done` trailing, then the
 * meta row. Editing saves as you type, so the trailing action dismisses rather
 * than commits — which is what `Done` means on iOS and `Save` does not. */
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
      {/* Clears the sheet's grabber, which the system draws over the top edge. */}
      <View className="px-4 pt-2">
        <SheetBar
          leading={{
            label: isPreview ? "Edit" : "Preview",
            onPress: onTogglePreview,
          }}
          trailing={{ label: "Done", onPress: onClose }}
        />
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
