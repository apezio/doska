import { cardDisplayId } from "@doska/contract/prefix"
import { useCardCol, useCardDeck } from "@doska/core/queries"
import { Chip, IconButton } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { MoreHorizontal } from "lucide-react-native"
import { Text, View } from "react-native"
import { CardMeta } from "@/components/card/card-meta"
import { ColumnSwatch } from "@/components/column/column-swatch"
import { ROUTES } from "@/lib/routes"

interface IProps {
  cardId: string
  /** The unsaved body, so task progress tracks it live. */
  body: string
  deadline: string | null
  cardNumber: number | null
}

/** The card's meta row, standing in for a navigation bar. The system draws the
 * sheet's grabber over the top ~16pt of this, so the row starts below it. */
export function CardPaneHeader({ cardId, body, deadline, cardNumber }: IProps) {
  const { data: column } = useCardCol(cardId)
  const { data: deck } = useCardDeck(cardId)

  return (
    <View className="flex-row items-center gap-4 border-b border-muted px-4 pb-2.5 pt-5">
      <CardMeta
        displayId={cardDisplayId(deck?.prefix ?? "", cardNumber) ?? ""}
        body={body}
        deadline={deadline}
        done={column?.done ?? false}
      />
      {column ? (
        <Chip className="bg-muted">
          <ColumnSwatch color={column.color} />
          <Text className="text-xs font-sans-medium uppercase text-muted-foreground">
            {column.title}
          </Text>
        </Chip>
      ) : null}
      <IconButton
        icon={MoreHorizontal}
        label="Card actions"
        onPress={() => router.push(ROUTES.cardActions(cardId))}
      />
    </View>
  )
}
