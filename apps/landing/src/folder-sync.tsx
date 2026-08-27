import { useEffect, useState } from "react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { cn, columnHue } from "@doska/ui-kit"

type ColumnId = "todo" | "doing"
type Card = { id: string; title: string; column: ColumnId }

const columns: { id: ColumnId; name: string; color: string }[] = [
  { id: "todo", name: "Todo", color: "violet" },
  { id: "doing", name: "Doing", color: "green" },
]

const docs: Card = { id: "docs", title: "Ship the docs page", column: "todo" }
const sync: Card = { id: "sync", title: "Sync on save", column: "doing" }

const scenes: { cards: Card[]; changed?: string }[] = [
  {
    cards: [docs, sync],
  },
  {
    cards: [
      docs,
      { id: "banner", title: "Offline banner", column: "todo" },
      sync,
    ],
    changed: "banner",
  },
  {
    cards: [
      docs,
      sync,
      { id: "banner", title: "Offline banner", column: "doing" },
    ],
    changed: "banner",
  },
]

const SCENE_MS = 2800

/** Cards and their files travel between columns and folders, not just fade. */
const transition = { type: "spring", stiffness: 320, damping: 34 } as const

const enter = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}

/**
 * A card crosses between columns, so it gets no y offset: any offset on the
 * incoming element is added to the layout flight and bends it into an arc.
 */
const cardEnter = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
}

function fileName(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + ".md"
  )
}

/**
 * The pitch as a demo: the same three cards shown as a board and as the folder
 * it syncs to, with one edit played out on both sides at once.
 */
export function FolderSync() {
  // Last scene first, so the prerendered HTML is the finished state and
  // reduced-motion visitors keep it.
  const [scene, setScene] = useState(scenes.length - 1)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const timer = setInterval(
      () => setScene((i) => (i + 1) % scenes.length),
      SCENE_MS
    )
    return () => clearInterval(timer)
  }, [])

  const { cards, changed } = scenes[scene]

  return (
    <MotionConfig reducedMotion="user" transition={transition}>
      <div className="mt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <MiniBoard cards={cards} changed={changed} />
          <FileTree cards={cards} changed={changed} />
        </div>
      </div>
    </MotionConfig>
  )
}

function MiniBoard({ cards, changed }: { cards: Card[]; changed?: string }) {
  return (
    <div className="flex h-36 gap-3 overflow-hidden rounded-2xl border bg-background p-3 sm:h-40">
      {columns.map((column) => (
        <section key={column.id} className="flex-1">
          <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground uppercase">
            <span
              className="size-2 rounded-full"
              style={{
                background: `oklch(0.72 0.14 ${columnHue(column.color)})`,
              }}
            />
            <span className="font-heading font-bold">{column.name}</span>
          </div>
          <div className="flex flex-col gap-2">
            {/* Default mode, not popLayout: popLayout takes the leaving card
                out of flow, and the shifted origin bends the flight. */}
            <AnimatePresence initial={false}>
              {cards
                .filter((card) => card.column === column.id)
                .map((card) => (
                  <motion.div
                    key={card.id}
                    // Shared id across the two columns: the card flies over
                    // rather than vanishing here and appearing there.
                    layoutId={card.id}
                    {...cardEnter}
                    className={cn(
                      "rounded-lg border bg-card px-2.5 py-2 text-sm shadow-xs",
                      card.id === changed && "ring-2 ring-primary/60"
                    )}
                  >
                    {card.title}
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * The same cards as one flat list of tree rows. Flat because a file that moves
 * folder is then a reorder inside a single list — the row keeps its identity
 * and slides, instead of unmounting in one group and remounting in another.
 */
function treeRows(cards: Card[]) {
  const rows: { key: string; text: string; cardId?: string }[] = []

  columns.forEach((column, columnIndex) => {
    const lastColumn = columnIndex === columns.length - 1
    const stem = lastColumn ? "   " : "│  "
    const files = cards.filter((card) => card.column === column.id)

    rows.push({
      key: `folder-${column.id}`,
      text: `${lastColumn ? "└─ " : "├─ "}${column.id}/`,
    })
    files.forEach((card, fileIndex) => {
      const branch = fileIndex === files.length - 1 ? "└─ " : "├─ "
      rows.push({
        key: card.id,
        text: `${stem}${branch}${fileName(card.title)}`,
        cardId: card.id,
      })
    })
  })

  return rows
}

function FileTree({ cards, changed }: { cards: Card[]; changed?: string }) {
  return (
    <div className="h-42 overflow-x-auto rounded-2xl border bg-background p-3 font-mono text-sm leading-relaxed whitespace-pre sm:h-40">
      <div className="text-muted-foreground">roadmap/</div>
      {/* popLayout so a leaving row drops out of the flow instead of holding
          its line while the rows below it slide. */}
      <AnimatePresence mode="popLayout" initial={false}>
        {treeRows(cards).map((row) => (
          <motion.div
            key={row.key}
            layout
            {...enter}
            className={cn(
              row.cardId === changed ? "text-terminal-accent" : undefined,
              !row.cardId && "text-muted-foreground"
            )}
          >
            {row.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
