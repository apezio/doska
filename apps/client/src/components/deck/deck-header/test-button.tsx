import { db } from "@doska/core/db"
import { keys } from "@doska/core/keys"
import { getBoard, getCard, updateCard } from "@doska/core/operations"
import { Button } from "@doska/ui-kit"
import { useQueryClient } from "@tanstack/react-query"
import type { UnwatchFn } from "@tauri-apps/plugin-fs"
import { Bug, Trash } from "lucide-react"
import { useRef } from "react"

interface IProps {
  boardId: string
}

const base = "/Users/romenkova/test-deck"

export function TestButton({ boardId }: IProps) {
  const unwatch = useRef<UnwatchFn>(null)
  const qc = useQueryClient()
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
        onClick={async () => {
          const board = await getBoard(boardId)
          console.log({ board })

          await Promise.all(
            board.columns.map(async (col) => {
              await mkColDir(col.title)
              const cards = await db.getCards(col.id)
              await Promise.all(
                cards.map(async (card) => {
                  const body = card.body.trim()
                  await writeCard(
                    `${col.title}/${card.title.toLowerCase().split(" ").join("-")}-${card.id}`,
                    body
                  )
                })
              )
            })
          )

          const { watch } = await import("@tauri-apps/plugin-fs")

          unwatch.current = await watch(
            base,
            async (event) => {
              const fileName = event.paths
                .filter((path) => path.endsWith(".md"))
                .pop()
              if (!fileName) return

              const cardId = `card-${fileName?.split("-").pop()?.replace(".md", "")}`
              console.log("evt:", event)
              console.log("watch:", fileName, cardId)

              if (cardId) {
                const { readTextFile } = await import("@tauri-apps/plugin-fs")
                const contents = await readTextFile(fileName)
                console.log(contents)

                const dbCard = await getCard(cardId)
                if (dbCard.body === contents.trim()) return

                await updateCard(cardId, { body: contents })

                qc.invalidateQueries({ queryKey: keys.card(cardId) })
                qc.invalidateQueries({ queryKey: keys.digest })
                qc.invalidateQueries({
                  queryKey: keys.cardCol(dbCard.columnId),
                })
                qc.invalidateQueries({ queryKey: keys.trash })
                console.log("updated")
              }
            },
            {
              delayMs: 500,
              recursive: true,
            }
          )
        }}
      >
        <Bug />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
        onClick={() => {
          if (unwatch.current) console.log("unwatched")
          unwatch.current?.()
        }}
      >
        <Trash />
      </Button>
    </>
  )
}

// const { open } = await import("@tauri-apps/plugin-dialog")
// const root = await open({ directory: true, recursive: true })

async function mkColDir(name: string) {
  const { mkdir } = await import("@tauri-apps/plugin-fs")
  await mkdir(`${base}/${name}`, { recursive: true })
}

async function writeCard(name: string, contents: string) {
  const { writeTextFile } = await import("@tauri-apps/plugin-fs")
  writeTextFile(`${base}/${name}.md`, contents)
}
