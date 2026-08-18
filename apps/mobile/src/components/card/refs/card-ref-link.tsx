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
  /** The label as in `[[ROAD-12|Fix the sync bug]]`. */
  alias?: string
}

/**
 * A `[[ROAD-12]]` reference inside a card body: the card's id, its title, then
 * the column it sits in, tinted with that column's color.
 */
export function CardRefLink({ deckId, prefix, displayId, alias }: IProps) {
  const tokens = useTokens()
  const ref = useCardRef(deckId, prefix, displayId)

  if (!ref)
    return (
      <Text className="font-mono text-[13px] text-muted-foreground/50">
        {alias ? ` ${displayId} — ${alias} ` : ` ${displayId} `}
      </Text>
    )

  const { card, columnTitle, columnColor, columnDone } = ref
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
        {alias || card.title || "Untitled card"}
      </Text>
      {/* A glyph, not an icon: everything here is one text flow, and an inline
          Svg inside a Text does not lay out reliably on Android. */}
      {columnDone ? (
        <Text className="text-[13px] text-card-foreground">{" ✓"}</Text>
      ) : null}
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
