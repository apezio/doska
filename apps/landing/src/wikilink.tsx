import { columnHue, MdWikilink } from "@doska/ui-kit"
import { cardRefs } from "./cards"

/**
 * A `[[CARD-1]]` reference, drawn with the app's own component. Static here —
 * in the app the title and column are read live from the card.
 */
export function Wikilink({ target }: { target: string }) {
  const ref = cardRefs[target]
  if (!ref) return <MdWikilink target={target} />

  return (
    <MdWikilink
      target={target}
      label={ref.title}
      badge={ref.column}
      hue={columnHue(ref.color)}
      title={`${ref.title}, ${ref.column}`}
    />
  )
}
