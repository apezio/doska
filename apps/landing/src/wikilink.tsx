import { columnHue, MdWikilink } from "@doska/ui-kit"
import { cardRefs } from "./cards"

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
