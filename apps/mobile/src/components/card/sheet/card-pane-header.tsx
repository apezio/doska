import { cardDisplayId } from "@doska/contract/prefix"
import { useCardCol, useCardDeck } from "@doska/core/queries"
import { Chip, IconButton, Text } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import { Pressable, View } from "react-native"
import { CardMeta } from "@/components/card/card-meta"
import { ColumnSwatch } from "@/components/column/column-swatch"
import { ROUTES } from "@/lib/routes"

interface IProps {
  cardId: string
  /** The unsaved body, so task progress tracks it live. */
  body: string
  deadline: string | null
  priority: string
  cardNumber: number | null
}

/** The card's meta row, standing in for a navigation bar. The system draws the
 * sheet's grabber over the top ~16pt of this, so the row starts below it. */
export function CardPaneHeader({
  cardId,
  body,
  deadline,
  priority,
  cardNumber,
}: IProps) {
  const { data: column } = useCardCol(cardId)
  const { data: deck } = useCardDeck(cardId)

  return (
    <View className="flex-row items-center gap-4 border-b border-muted px-4 pb-2.5 pt-5">
      <CardMeta
        cardId={cardId}
        displayId={cardDisplayId(deck?.prefix ?? "", cardNumber) ?? ""}
        body={body}
        deadline={deadline}
        priority={priority}
        done={column?.done ?? false}
      />
      {!!column && (
        <Pressable
          onPress={() => router.push(ROUTES.cardMove(cardId))}
          accessibilityRole="button"
          accessibilityLabel={`Column: ${column.title}`}
          hitSlop={6}
          className="shrink"
        >
          <Chip className="gap-2">
            <ColumnSwatch color={column.color} />
            <Text
              numberOfLines={1}
              className="shrink font-sans-medium text-muted-foreground"
            >
              {column.title}
            </Text>
          </Chip>
        </Pressable>
      )}
      {/* Trailing, the way a navigation bar sets its overflow button. */}
      <View className="ml-auto shrink-0 -mr-1.5">
        <IconButton
          icon={MoreHorizontal}
          label="Card actions"
          variant="plain"
          onPress={() => router.push(ROUTES.cardActions(cardId))}
        />
      </View>
    </View>
  )
}
