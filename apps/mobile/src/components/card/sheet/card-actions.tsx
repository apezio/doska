import { useCard, useCardCol } from "@doska/core/queries"
import { Separator, SheetItem } from "@doska/ui-kit-mobile"
import { formatDeadline } from "@doska/core/utils"
import { router } from "expo-router"
import { ArrowRightLeft, CalendarClock, Trash2 } from "lucide-react-native"
import { View } from "react-native"
import { ROUTES } from "@/lib/routes"

/** A card's own actions: the web's card menu, plus the deadline and column
 * controls it puts in the card panel's header. */
export function CardActions({ cardId }: { cardId: string }) {
  const { data: card } = useCard(cardId)
  const { data: column } = useCardCol(cardId)
  if (!card) return null

  return (
    <View>
      <SheetItem
        icon={CalendarClock}
        label="Due date"
        trailing={card.deadline ? formatDeadline(card.deadline) : "None"}
        onPress={() => router.push(ROUTES.cardDeadline(cardId))}
      />
      <SheetItem
        icon={ArrowRightLeft}
        label="Move to column"
        trailing={column?.title ?? ""}
        onPress={() => router.push(ROUTES.cardMove(cardId))}
      />
      <Separator className="my-1" />
      <SheetItem
        icon={Trash2}
        label="Delete card"
        destructive
        onPress={() => router.push(ROUTES.cardDelete(cardId))}
      />
    </View>
  )
}
