import { markdownExtra, parseMarkdown } from "@doska/markdown/ast"
import { attachmentKeyFromSrc } from "@doska/markdown/core"
import { Fragment, useMemo, type ReactNode } from "react"
import { Linking, Pressable, ScrollView, Text, View } from "react-native"
import { useMarkdownRenderers, type MarkdownRenderers } from "./renderers"
import { tagColor } from "./tag-palette"
import { useMarkdownTheme, type MarkdownTheme } from "./theme"

/**
 * Permissive mdast shape, matching how the shared remark plugins type the tree.
 * The real `mdast` unions do not know about the `mark` node `remarkMark` adds,
 * and every renderer here dispatches on `type` anyway.
 */
interface MdNode {
  type: string
  value?: string
  url?: string
  alt?: string | null
  depth?: number
  ordered?: boolean | null
  start?: number | null
  checked?: boolean | null
  lang?: string | null
  align?: (string | null)[]
  children?: MdNode[]
  data?: unknown
}

interface Ctx {
  theme: MarkdownTheme
  renderers: MarkdownRenderers
  onToggleTask?: (index: number) => void
  /**
   * Running count of task checkboxes in document order, so an index handed to
   * `onToggleTask` lines up with `taskProgress` / `toggleTaskByIndex`. Mutated
   * during the render pass; created fresh for each one.
   */
  tasks: { seen: number }
}

const HEADING_SIZE = [24, 20, 17, 16, 15, 15]

function isBlank(node: MdNode): boolean {
  return node.type === "text" && !node.value?.trim()
}

// ---------------------------------------------------------------- inline

function Chip({
  label,
  bg,
  fg,
}: {
  label: string
  bg: string
  fg: string
}) {
  return (
    <Text
      style={{
        backgroundColor: bg,
        color: fg,
        fontSize: 13,
        fontWeight: "500",
      }}
    >
      {` ${label} `}
    </Text>
  )
}

function renderInline(node: MdNode, ctx: Ctx, key: string): ReactNode {
  const { theme } = ctx

  switch (node.type) {
    case "text":
      return node.value
    case "break":
      return "\n"

    case "strong":
      return (
        <Text key={key} style={{ fontWeight: "700" }}>
          {renderInlines(node.children, ctx)}
        </Text>
      )

    case "delete":
      return (
        <Text key={key} style={{ textDecorationLine: "line-through" }}>
          {renderInlines(node.children, ctx)}
        </Text>
      )

    case "mark":
      return (
        <Text
          key={key}
          style={{ backgroundColor: theme.markBg, color: theme.markFg }}
        >
          {renderInlines(node.children, ctx)}
        </Text>
      )

    case "inlineCode":
      return (
        <Text
          key={key}
          style={{
            fontFamily: "Menlo",
            fontSize: 13,
            backgroundColor: theme.codeBg,
            color: theme.text,
          }}
        >
          {` ${node.value ?? ""} `}
        </Text>
      )

    case "link":
      return (
        <Text
          key={key}
          style={{ color: theme.linkFg }}
          onPress={() => {
            if (node.url) void Linking.openURL(node.url)
          }}
        >
          {renderInlines(node.children, ctx)}
        </Text>
      )

    // Inline images are lifted to blocks by `renderParagraph`; anything left
    // here sits alongside text, where only the alt text can be shown.
    case "image":
      return node.alt ? <Text key={key}>{node.alt}</Text> : null

    case "emphasis": {
      const extra = markdownExtra(node)

      if (extra?.kind === "wikilink") {
        const custom = ctx.renderers.renderWikilink?.(extra.target)
        if (custom) return <Fragment key={key}>{custom}</Fragment>
        return (
          <Chip
            key={key}
            label={extra.target}
            bg={theme.chipBg}
            fg={theme.chipFg}
          />
        )
      }

      if (extra?.kind === "tag") {
        const color = tagColor(extra.color)
        return (
          <Chip
            key={key}
            label={flatten(node)}
            bg={theme.dark ? color.darkBg : color.lightBg}
            fg={theme.dark ? color.darkFg : color.lightFg}
          />
        )
      }

      if (extra?.kind === "cut")
        return (
          <Text key={key} style={{ color: theme.muted, fontSize: 12 }}>
            {"— end of preview —"}
          </Text>
        )

      return (
        <Text key={key} style={{ fontStyle: "italic" }}>
          {renderInlines(node.children, ctx)}
        </Text>
      )
    }

    default:
      return node.children ? (
        <Text key={key}>{renderInlines(node.children, ctx)}</Text>
      ) : (
        (node.value ?? null)
      )
  }
}

function renderInlines(children: MdNode[] | undefined, ctx: Ctx): ReactNode[] {
  return (children ?? []).map((child, i) => renderInline(child, ctx, String(i)))
}

/** The plain text of a subtree, for nodes rendered as a single flat label. */
function flatten(node: MdNode): string {
  if (node.value) return node.value
  return (node.children ?? []).map(flatten).join("")
}

// ---------------------------------------------------------------- blocks

function BlockImage({ node, ctx }: { node: MdNode; ctx: Ctx }) {
  const alt = node.alt ?? ""
  const key = attachmentKeyFromSrc(node.url)
  const custom =
    key !== null ? ctx.renderers.renderImage?.(key, alt) : undefined

  if (custom) return <View className="my-1">{custom}</View>

  return (
    <View
      className="my-1 rounded-lg px-3 py-4"
      style={{ backgroundColor: ctx.theme.codeBg }}
    >
      <Text style={{ color: ctx.theme.muted, fontSize: 13 }}>
        {alt || "Image"}
      </Text>
    </View>
  )
}

/**
 * Images parse as inline nodes but read as blocks, so a paragraph is split into
 * runs of text with the images hoisted out between them.
 */
function renderParagraph(node: MdNode, ctx: Ctx, key: string): ReactNode {
  const parts: ReactNode[] = []
  let run: MdNode[] = []

  const flushRun = () => {
    if (run.every(isBlank)) {
      run = []
      return
    }
    parts.push(
      <Text
        key={`t${parts.length}`}
        style={{ color: ctx.theme.text, fontSize: 15, lineHeight: 22 }}
      >
        {renderInlines(run, ctx)}
      </Text>
    )
    run = []
  }

  for (const child of node.children ?? []) {
    if (child.type === "image") {
      flushRun()
      parts.push(<BlockImage key={`i${parts.length}`} node={child} ctx={ctx} />)
    } else {
      run.push(child)
    }
  }
  flushRun()

  if (parts.length === 0) return null
  return (
    <View key={key} className="gap-1">
      {parts}
    </View>
  )
}

function Checkbox({
  checked,
  onPress,
  theme,
}: {
  checked: boolean
  onPress?: () => void
  theme: MarkdownTheme
}) {
  const box = (
    <View
      className="mt-[3px] h-[18px] w-[18px] items-center justify-center rounded-[5px] border"
      style={{
        borderColor: checked ? "#2563eb" : theme.border,
        backgroundColor: checked ? "#2563eb" : "transparent",
      }}
    >
      {checked ? (
        <Text style={{ color: "white", fontSize: 12, lineHeight: 14 }}>✓</Text>
      ) : null}
    </View>
  )

  if (!onPress) return box
  // Widens the touch target without moving the box.
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      {box}
    </Pressable>
  )
}

function renderListItem(
  item: MdNode,
  ctx: Ctx,
  ordered: boolean,
  number: number,
  key: string
): ReactNode {
  const { theme } = ctx

  // Only unordered items carry checkboxes in the shared regex, so only they may
  // consume a task index — otherwise an ordered `1. [ ]` would shift every
  // index after it.
  const isTask = !ordered && item.checked != null
  const taskIndex = isTask ? ctx.tasks.seen++ : -1

  return (
    <View key={key} className="flex-row gap-2">
      {isTask ? (
        <Checkbox
          checked={item.checked === true}
          theme={theme}
          onPress={
            ctx.onToggleTask ? () => ctx.onToggleTask?.(taskIndex) : undefined
          }
        />
      ) : (
        <Text
          style={{ color: theme.muted, fontSize: 15, lineHeight: 22 }}
          className="min-w-[18px]"
        >
          {ordered ? `${number}.` : "•"}
        </Text>
      )}
      <View className="flex-1 gap-1">{renderBlocks(item.children, ctx)}</View>
    </View>
  )
}

function renderTable(node: MdNode, ctx: Ctx, key: string): ReactNode {
  const { theme } = ctx
  const rows = node.children ?? []

  return (
    <ScrollView key={key} horizontal showsHorizontalScrollIndicator={false}>
      <View
        className="overflow-hidden rounded-lg border"
        style={{ borderColor: theme.border }}
      >
        {rows.map((row, r) => (
          <View
            key={r}
            className="flex-row"
            style={{
              borderTopWidth: r === 0 ? 0 : 1,
              borderTopColor: theme.border,
            }}
          >
            {(row.children ?? []).map((cell, c) => (
              <View
                key={c}
                className="w-36 px-3 py-2"
                style={{
                  borderLeftWidth: c === 0 ? 0 : 1,
                  borderLeftColor: theme.border,
                  backgroundColor: r === 0 ? theme.codeBg : "transparent",
                }}
              >
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 14,
                    fontWeight: r === 0 ? "600" : "400",
                    textAlign:
                      (node.align?.[c] as "left" | "center" | "right") ??
                      "left",
                  }}
                >
                  {renderInlines(cell.children, ctx)}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function renderBlock(node: MdNode, ctx: Ctx, key: string): ReactNode {
  const { theme } = ctx

  switch (node.type) {
    case "paragraph":
      return renderParagraph(node, ctx, key)

    case "heading":
      return (
        <Text
          key={key}
          style={{
            color: theme.text,
            fontSize: HEADING_SIZE[(node.depth ?? 1) - 1] ?? 15,
            fontWeight: "700",
            marginTop: 4,
          }}
        >
          {renderInlines(node.children, ctx)}
        </Text>
      )

    case "list": {
      const ordered = node.ordered === true
      const start = node.start ?? 1
      return (
        <View key={key} className="gap-1.5">
          {(node.children ?? []).map((item, i) =>
            renderListItem(item, ctx, ordered, start + i, String(i))
          )}
        </View>
      )
    }

    case "blockquote":
      return (
        <View
          key={key}
          className="gap-2 pl-3"
          style={{ borderLeftWidth: 3, borderLeftColor: theme.quoteBar }}
        >
          {renderBlocks(node.children, ctx)}
        </View>
      )

    case "code":
      return (
        <ScrollView
          key={key}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="rounded-lg"
          style={{ backgroundColor: theme.codeBg }}
          contentContainerClassName="p-3"
        >
          <Text
            style={{ fontFamily: "Menlo", fontSize: 13, color: theme.text }}
          >
            {node.value ?? ""}
          </Text>
        </ScrollView>
      )

    case "thematicBreak":
      return (
        <View
          key={key}
          style={{ height: 1, backgroundColor: theme.border }}
          className="my-1"
        />
      )

    case "table":
      return renderTable(node, ctx, key)

    // Raw HTML has no native equivalent; showing the source beats dropping it.
    case "html":
      return (
        <Text key={key} style={{ color: theme.muted, fontSize: 13 }}>
          {node.value ?? ""}
        </Text>
      )

    case "definition":
      return null

    default:
      return renderParagraph(node, ctx, key)
  }
}

function renderBlocks(nodes: MdNode[] | undefined, ctx: Ctx): ReactNode[] {
  return (nodes ?? [])
    .map((node, i) => renderBlock(node, ctx, String(i)))
    .filter((node) => node !== null)
}

// ---------------------------------------------------------------- entry

interface IProps {
  children: string
  /**
   * When provided, task-list checkboxes become interactive; tapping one calls
   * back with its 0-based index in document order (matching `taskProgress` /
   * `toggleTaskByIndex`). Without it they render read-only.
   */
  onToggleTask?: (index: number) => void
}

/**
 * Renders a card body natively, over the same mdast the web renderer uses. The
 * caller applies any markers first — this draws whatever markdown it is given.
 */
export function MarkdownView({ children, onToggleTask }: IProps) {
  const theme = useMarkdownTheme()
  const renderers = useMarkdownRenderers()

  const content = useMemo(() => {
    const ctx: Ctx = { theme, renderers, onToggleTask, tasks: { seen: 0 } }
    return renderBlocks(parseMarkdown(children).children as MdNode[], ctx)
  }, [children, theme, renderers, onToggleTask])

  return <View className="gap-2">{content}</View>
}
