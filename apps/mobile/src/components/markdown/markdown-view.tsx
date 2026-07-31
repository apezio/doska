import { markdownExtra, parseMarkdown } from "@doska/markdown/ast"
import { attachmentKeyFromSrc } from "@doska/markdown/core"
import * as Haptics from "expo-haptics"
import { Fragment, useMemo, type ReactNode } from "react"
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native"
import { useMarkdownRenderers, type MarkdownRenderers } from "./renderers"
import { tagColor } from "./tag-palette"

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
  dark: boolean
  renderers: MarkdownRenderers
  onToggleTask?: (index: number) => void
  /** Inside a ticked task, whose text the web dims. */
  muted?: boolean
  /**
   * Running count of task checkboxes in document order, so an index handed to
   * `onToggleTask` lines up with `taskProgress` / `toggleTaskByIndex`. Mutated
   * during the render pass; created fresh for each one.
   */
  tasks: { seen: number }
}

// Body copy: 1rem at the web's 16px root, line-height 1.6.
const BODY = "font-sans text-base leading-6 text-card-foreground"

function isBlank(node: MdNode): boolean {
  return node.type === "text" && !node.value?.trim()
}

/** The plain text of a subtree, for nodes rendered as a single flat label. */
function flatten(node: MdNode): string {
  if (node.value) return node.value
  return (node.children ?? []).map(flatten).join("")
}

// ---------------------------------------------------------------- inline

function renderInline(node: MdNode, ctx: Ctx, key: string): ReactNode {
  switch (node.type) {
    case "text":
      return node.value
    case "break":
      return "\n"

    case "strong":
      return (
        <Text key={key} className="font-sans-bold">
          {renderInlines(node.children, ctx)}
        </Text>
      )

    case "delete":
      return (
        <Text key={key} className="line-through">
          {renderInlines(node.children, ctx)}
        </Text>
      )

    case "mark":
      return (
        <Text key={key} className="bg-mark">
          {renderInlines(node.children, ctx)}
        </Text>
      )

    case "inlineCode":
      return (
        <Text key={key} className="bg-muted font-mono text-[13px]">
          {` ${node.value ?? ""} `}
        </Text>
      )

    case "link":
      return (
        <Text
          key={key}
          className="text-primary underline"
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
          <Text
            key={key}
            className="bg-muted font-sans-medium text-[13px] text-muted-foreground"
          >
            {` ${extra.target} `}
          </Text>
        )
      }

      if (extra?.kind === "tag") {
        const color = tagColor(extra.color)
        return (
          <Text
            key={key}
            className="font-sans-medium text-[13px]"
            style={{
              backgroundColor: ctx.dark ? color.darkBg : color.lightBg,
              color: ctx.dark ? color.darkFg : color.lightFg,
            }}
          >
            {` ${flatten(node)} `}
          </Text>
        )
      }

      if (extra?.kind === "cut")
        return (
          <Text key={key} className="font-sans text-xs text-muted-foreground">
            {"— end of preview —"}
          </Text>
        )

      return (
        <Text key={key} className="italic">
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

// ---------------------------------------------------------------- blocks

function BlockImage({ node, ctx }: { node: MdNode; ctx: Ctx }) {
  const alt = node.alt ?? ""
  const key = attachmentKeyFromSrc(node.url)
  const custom =
    key !== null ? ctx.renderers.renderImage?.(key, alt) : undefined

  if (custom) return <View className="my-1">{custom}</View>

  return (
    <View className="my-1 rounded-md border border-border bg-muted px-3 py-4">
      <Text className="font-sans text-[13px] text-muted-foreground">
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
        className={ctx.muted ? `${BODY} text-muted-foreground` : BODY}
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
}: {
  checked: boolean
  onPress?: () => void
}) {
  const box = (
    <View
      className={
        checked
          ? "mt-1 size-4 items-center justify-center rounded-[4px] border border-primary bg-primary"
          : "mt-1 size-4 items-center justify-center rounded-[4px] border border-input"
      }
    >
      {checked ? (
        <Text className="text-[10px] leading-[12px] text-primary-foreground">
          ✓
        </Text>
      ) : null}
    </View>
  )

  if (!onPress) return box
  // Widens the touch target without moving the box.
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      hitSlop={10}
    >
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
  // Only unordered items carry checkboxes in the shared regex, so only they may
  // consume a task index — otherwise an ordered `1. [ ]` would shift every
  // index after it.
  const isTask = !ordered && item.checked != null
  const taskIndex = isTask ? ctx.tasks.seen++ : -1

  return (
    <View key={key} className="flex-row gap-1.5">
      {isTask ? (
        <Checkbox
          checked={item.checked === true}
          onPress={
            ctx.onToggleTask ? () => ctx.onToggleTask?.(taskIndex) : undefined
          }
        />
      ) : (
        <Text className={`min-w-[18px] ${BODY} text-muted-foreground`}>
          {ordered ? `${number}.` : "•"}
        </Text>
      )}
      <View className="flex-1 gap-1">
        {renderBlocks(
          item.children,
          item.checked === true ? { ...ctx, muted: true } : ctx
        )}
      </View>
    </View>
  )
}

function renderTable(node: MdNode, ctx: Ctx, key: string): ReactNode {
  const rows = node.children ?? []

  return (
    <ScrollView key={key} horizontal showsHorizontalScrollIndicator={false}>
      <View className="overflow-hidden rounded-md border border-border">
        {rows.map((row, r) => (
          <View
            key={r}
            className={
              r === 0 ? "flex-row" : "flex-row border-t border-border"
            }
          >
            {(row.children ?? []).map((cell, c) => (
              <View
                key={c}
                className={[
                  "w-36 px-3 py-2",
                  c === 0 ? "" : "border-l border-border",
                  r === 0 ? "bg-muted" : "",
                ].join(" ")}
              >
                <Text
                  className={
                    r === 0
                      ? "font-sans-semibold text-sm text-card-foreground"
                      : "font-sans text-sm text-card-foreground"
                  }
                  style={{
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
  switch (node.type) {
    case "paragraph":
      return renderParagraph(node, ctx, key)

    // Every heading level is body-sized on the web; only the weight and, at h3,
    // the colour set them apart.
    case "heading":
      return (
        <Text
          key={key}
          className={
            (node.depth ?? 1) >= 3
              ? "mt-1 font-sans-bold text-base leading-5 text-muted-foreground"
              : "mt-1 font-sans-bold text-base leading-5 text-card-foreground"
          }
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
        <View key={key} className="gap-2 border-l-2 border-quote-bar pl-3">
          {renderBlocks(node.children, ctx)}
        </View>
      )

    case "code":
      return (
        <ScrollView
          key={key}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="rounded-md border border-border bg-muted"
          contentContainerClassName="p-3"
        >
          <Text className="font-mono text-[13px] leading-5 text-card-foreground">
            {node.value ?? ""}
          </Text>
        </ScrollView>
      )

    case "thematicBreak":
      return <View key={key} className="my-1 h-px bg-border" />

    case "table":
      return renderTable(node, ctx, key)

    // Raw HTML has no native equivalent; showing the source beats dropping it.
    case "html":
      return (
        <Text key={key} className="font-mono text-[13px] text-muted-foreground">
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
  // Only the tag palette needs the scheme as a value; everything else themes
  // itself through the `dark:` variants NativeWind resolves.
  const dark = useColorScheme() === "dark"
  const renderers = useMarkdownRenderers()

  const content = useMemo(() => {
    const ctx: Ctx = { dark, renderers, onToggleTask, tasks: { seen: 0 } }
    return renderBlocks(parseMarkdown(children).children as MdNode[], ctx)
  }, [children, dark, renderers, onToggleTask])

  return <View className="gap-2">{content}</View>
}
