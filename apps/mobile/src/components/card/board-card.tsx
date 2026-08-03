import { cardDisplayId } from "@doska/contract/prefix"
import type { Card } from "@doska/core/types"
import { router } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { CardPreview } from "@/components/card/card-preview"
import { ROUTES } from "@/lib/routes"
import { CardMeta } from "./card-meta"

interface IProps {
  card: Card
  deckId: string
  prefix: string
  /** The card's column is collapsed, so only the title and meta show. */
  showBody: boolean
  /** The card sits in the board's done column. */
  done: boolean
}

/** A board card: title, meta row, then the cut-truncated body preview. */
export function BoardCard({ card, deckId, prefix, showBody, done }: IProps) {
  return (
    <Pressable
      onPress={() => router.push(ROUTES.card(card.id))}
      className="gap-2 overflow-hidden rounded-xl border border-card-ring bg-card py-2 active:opacity-70"
    >
      <View className="px-3">
        <Text className="text-base font-sans-semibold leading-snug text-card-foreground">
          {card.title || "Untitled card"}
        </Text>
      </View>

      <View className="border-t border-muted px-3 pt-2">
        <CardMeta
          displayId={cardDisplayId(prefix, card.number) ?? ""}
          body={card.body}
          deadline={card.deadline}
          done={done}
        />
      </View>

      {showBody && <CardPreview card={card} deckId={deckId} prefix={prefix} />}
    </Pressable>
  )
}
