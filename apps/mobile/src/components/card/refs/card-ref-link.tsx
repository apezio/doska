import { useCardRef } from "@doska/core/card-refs"
import { columnSwatch } from "@doska/tokens/columns"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { router } from "expo-router"
import { Text } from "react-native"
import { ROUTES } from "@/lib/routes"

interface IProps {
  deckId: string
  prefix: string
  displayId: string
}

/**
 * A `[[ROAD-12]]` reference inside a card body: the card's id, its title, then
 * the column it sits in, tinted with that column's color. Everything shown is
 * read live rather than stored in the text, so a rename, a move or a re-color
 * propagates to every reference.
 *
 * All `Text`, no `View`: a reference sits mid-sentence, and a view nested in a
 * text node does not lay out inline.
 */
export function CardRefLink({ deckId, prefix, displayId }: IProps) {
  const tokens = useTokens()
  const ref = useCardRef(deckId, prefix, displayId)

  if (!ref)
    return (
      <Text className="font-mono text-[13px] text-muted-foreground/50">
        {` ${displayId} `}
      </Text>
    )

  const { card, columnTitle, columnColor } = ref
  const swatch = columnSwatch(columnColor)

  return (
    <Text
      // A pressable text node is its own touch target, so this never reaches
      // the board card's open-detail handler underneath it.
      onPress={() => router.push(ROUTES.card(card.id))}
      accessibilityRole="link"
    >
      <Text className="font-mono text-[13px]" style={{ color: tokens.primary }}>
        {` ${displayId} `}
      </Text>
      <Text className="text-[15px] text-card-foreground">
        {card.title || "Untitled card"}
      </Text>
      {columnTitle ? (
        <Text
          className="text-xs font-sans-medium"
          style={{
            color: swatch ? swatch.ring : tokens.mutedForeground,
            backgroundColor: swatch ? `${swatch.dot}33` : tokens.muted,
          }}
        >
          {` ${columnTitle} `}
        </Text>
      ) : null}
    </Text>
  )
}
