import { useEffect, useState } from "react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { Card, CardHeader, CardTitle, cn } from "@doska/ui-kit"
import { Column } from "./column"

type ColumnId = "todo" | "doing"
type CardItem = { id: string; title: string; column: ColumnId }
type Scene = { cards: CardItem[]; changed?: string }

const columns: { id: ColumnId; name: string; color: string }[] = [
  { id: "todo", name: "Todo", color: "violet" },
  { id: "doing", name: "Doing", color: "green" },
]

const docs: CardItem = {
  id: "docs",
  title: "Add the docs",
  column: "todo",
}
const sync: CardItem = { id: "sync", title: "Sync on save", column: "doing" }
const banner = { id: "banner", title: "Offline banner" }

/** Played through once, then the board is the visitor's to drag. */
const scenes: Scene[] = [
  {
    cards: [docs, sync],
  },
  {
    cards: [docs, { ...banner, column: "todo" }, sync],
    changed: banner.id,
  },
  {
    cards: [docs, sync, { ...banner, column: "doing" }],
    changed: banner.id,
  },
]

const handOver: Scene = { ...scenes[scenes.length - 1], changed: undefined }

const SCENE_MS = 2800
/** How far a card has to travel sideways before the drop counts as a move. */
const DROP_PX = 60
/** Only the card the script moved is the visitor's to move. */
const draggableId = banner.id

/** No bounce: an overshoot on a card that has just flown looks like a glitch. */
const transition = { type: "spring", duration: 0.5, bounce: 0 } as const

const enter = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
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
 * The pitch as a demo: the same cards shown as a board and as the folder it
 * syncs to. It plays the scripted edit once, then hands the board over — drag
 * a card and the file follows it.
 */
export function FolderSync() {
  const [view, setView] = useState(scenes[0])
  const [live, setLive] = useState(false)

  // Reduced motion skips the script entirely: the board still starts at the
  // baseline scene, and dragging works either way.
  useEffect(() => {
    if (live) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let scene = 0
    const timer = setInterval(() => {
      scene += 1
      if (scene < scenes.length) {
        setView(scenes[scene])
        return
      }
      clearInterval(timer)
      setView(handOver)
      setLive(true)
    }, SCENE_MS)

    return () => clearInterval(timer)
  }, [live])

  function move(id: string, columnId: ColumnId) {
    setLive(true)
    setView((current) => {
      const card = current.cards.find((one) => one.id === id)
      const target = columns.find((column) => column.id === columnId)
      if (!card || !target || card.column === columnId) return current

      return {
        cards: current.cards.map((one) =>
          one.id === id ? { ...one, column: columnId } : one
        ),
        changed: id,
      }
    })
  }

  return (
    <MotionConfig reducedMotion="user" transition={transition}>
      <div className="mt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <MiniBoard cards={view.cards} changed={view.changed} onMove={move} />
          <FileTree cards={view.cards} changed={view.changed} />
        </div>
      </div>
    </MotionConfig>
  )
}

function MiniBoard({
  cards,
  changed,
  onMove,
}: {
  cards: CardItem[]
  changed?: string
  onMove: (id: string, columnId: ColumnId) => void
}) {
  return (
    // Fixed height on both panes: adding a card must not reflow the page.
    <div className="flex h-44 gap-3">
      {columns.map((column) => {
        const inColumn = cards.filter((card) => card.column === column.id)

        return (
          <Column
            key={column.id}
            title={column.name}
            color={column.color}
            count={inColumn.length}
            className="w-auto max-w-none flex-1"
          >
            {inColumn.map((card) => (
              <motion.div
                key={card.id}
                // Shared id across the two columns: the card flies over rather
                // than vanishing here and appearing there.
                layoutId={card.id}
                drag={card.id === draggableId}
                dragSnapToOrigin
                dragElastic={0.15}
                whileDrag={{ zIndex: 10, cursor: "grabbing" }}
                // Which column it landed in comes from how far it went, not
                // from hit-testing: two columns, one axis that matters.
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) < DROP_PX) return
                  const next = columns[info.offset.x > 0 ? 1 : 0]
                  onMove(card.id, next.id)
                }}
                className={cn(card.id === draggableId && "cursor-grab")}
              >
                <Card
                  className={cn(
                    "mb-3",
                    card.id === changed && "ring-2 ring-primary/60"
                  )}
                >
                  <CardHeader>
                    <CardTitle className="text-balance">
                      <div className="line-clamp-1 text-sm lg:text-base">
                        {card.title}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </Column>
        )
      })}
    </div>
  )
}

/**
 * The same cards as one flat list of tree rows. Flat because a file that moves
 * folder is then a reorder inside a single list — the row keeps its identity
 * and slides, instead of unmounting in one group and remounting in another.
 */
function treeRows(cards: CardItem[]) {
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

function FileTree({ cards, changed }: { cards: CardItem[]; changed?: string }) {
  return (
    <div className="h-44 overflow-x-auto rounded-3xl border bg-background p-4 font-mono text-sm leading-relaxed whitespace-pre">
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
