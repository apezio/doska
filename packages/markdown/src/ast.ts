import type { Root } from "mdast"
import remarkGfm from "remark-gfm"
import { remarkMark } from "remark-mark-highlight"
import remarkParse from "remark-parse"
import { unified } from "unified"
import { remarkCut } from "./plugins/remark-cut"
import { remarkTags } from "./plugins/remark-tags"
import { remarkWikilinks } from "./plugins/remark-wikilinks"

/**
 * The same plugin stack `Markdown` runs, stopping at mdast instead of going on
 * to hast and the DOM. Every plugin here is a plain tree transform, so a
 * platform without a DOM gets the identical `[[wikilink]]`, `[tag]`, `==mark==`
 * and cut handling by walking this tree itself.
 *
 * Plugin order matters: `remarkWikilinks` must run before `remarkTags`, which
 * would otherwise claim the inner `[target]` as a tag pill.
 */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMark)
  .use(remarkCut)
  .use(remarkWikilinks)
  .use(remarkTags)

export function parseMarkdown(markdown: string): Root {
  return processor.runSync(processor.parse(markdown))
}

/**
 * The extra node types the custom plugins introduce. They ride on `emphasis`
 * nodes tagged with `data.hProperties` (which is what the web build turns into
 * span attributes), so a renderer checks for these before treating an
 * `emphasis` as italics.
 */
export type MarkdownExtra =
  | { kind: "wikilink"; target: string }
  | { kind: "tag"; color: number }
  | { kind: "cut" }
  | null

export function markdownExtra(node: { data?: unknown }): MarkdownExtra {
  const properties = (
    node.data as { hProperties?: Record<string, unknown> } | undefined
  )?.hProperties
  if (!properties) return null

  const target = properties.dataWikilink
  if (typeof target === "string") return { kind: "wikilink", target }

  const className = properties.className
  const names = Array.isArray(className) ? className : []
  if (names.includes("tag")) {
    const color = properties.dataTagColor
    return { kind: "tag", color: typeof color === "number" ? color : 0 }
  }
  if (names.includes("cut-divider")) return { kind: "cut" }

  return null
}
