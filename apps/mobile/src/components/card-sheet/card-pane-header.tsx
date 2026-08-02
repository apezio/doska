import { cardDisplayId } from "@doska/contract/prefix"
import { useCardCol, useCardDeck } from "@doska/core/queries"
import { Text, View } from "react-native"
import { CardMeta } from "@/components/board/card-meta"
import { ColumnSwatch } from "@/components/board/column-swatch"

interface IProps {
  cardId: string
  /** The unsaved body, so task progress tracks it live. */
  body: string
  deadline: string | null
  cardNumber: number | null
}

/** The card's meta row. Rendered as the sheet header's title, so the bar draws
 * its own background and separator and this holds no chrome of its own. */
export function CardPaneHeader({ cardId, body, deadline, cardNumber }: IProps) {
  const { data: column } = useCardCol(cardId)
  const { data: deck } = useCardDeck(cardId)

  return (
    <View className="flex-row items-center gap-4">
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
  )
}
