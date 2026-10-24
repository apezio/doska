import { useMemo, useState } from "react"
import { cardDisplayId } from "@doska/contract"
import { Check, CircleCheck, Search } from "lucide-react"
import {
  Button,
  cn,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
} from "@doska/ui-kit"
import { useBoard, useDashboards } from "@doska/core/queries"
import { NativeSelect } from "../shared/native-select"
import { useProjectWrite } from "../shared/use-project-write"
import { useProjectCtx } from "./project-context"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Board, then card: reads the boards on this device, so it is instant. */
export function CardPickerModal({ open, onOpenChange }: IProps) {
  const { projectId, workstreams, detail } = useProjectCtx()
  const { data: dashboards = [] } = useDashboards()
  const [boardId, setBoardId] = useState("")
  const [workstreamId, setWorkstreamId] = useState("")
  const [query, setQuery] = useState("")
  const {
    mutate: link,
    variables,
    isPending,
  } = useProjectWrite("cardLink", projectId)

  // Default to where this project's cards already live.
  const board =
    boardId || detail.cards.at(-1)?.boardId || dashboards[0]?.id || ""
  const linked = useMemo(
    () => new Set(detail.cards.map((c) => c.cardId)),
    [detail.cards]
  )

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:h-[min(36rem,85svh)] md:max-w-lg">
        <ModalHeader onClose={() => onOpenChange(false)}>
          Link a card
        </ModalHeader>
        <div className="flex flex-col gap-2 px-3 pb-2">
          <div className="flex flex-wrap gap-1.5">
            <NativeSelect
              aria-label="Board"
              value={board}
              onChange={(e) => setBoardId(e.target.value)}
              className="min-w-40 flex-1"
            >
              {dashboards.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title || "Untitled board"}
                </option>
              ))}
            </NativeSelect>
            {workstreams.length > 0 && (
              <NativeSelect
                aria-label="Workstream"
                value={workstreamId}
                onChange={(e) => setWorkstreamId(e.target.value)}
                className="min-w-40 flex-1"
              >
                <option value="">No workstream</option>
                {workstreams.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </NativeSelect>
            )}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search cards"
              placeholder="Search by title or number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto border-t px-1.5 py-1.5">
          {board ? (
            <BoardCards
              boardId={board}
              query={query}
              linked={linked}
              pendingId={
                isPending && typeof variables === "object"
                  ? variables.cardId
                  : null
              }
              onPick={(cardId) =>
                link({
                  projectId,
                  boardId: board,
                  cardId,
                  workstreamId: workstreamId || undefined,
                })
              }
            />
          ) : (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              There are no boards on this device yet.
            </p>
          )}
        </div>
        <div className="flex justify-end border-t px-3 py-2">
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </ModalContent>
    </Modal>
  )
}

function BoardCards({
  boardId,
  query,
  linked,
  pendingId,
  onPick,
}: {
  boardId: string
  query: string
  linked: ReadonlySet<string>
  pendingId: string | null
  onPick: (cardId: string) => void
}) {
  const { data } = useBoard(boardId)

  const rows = useMemo(() => {
    if (!data) return []
    const doneCols = new Set(
      data.columns.filter((c) => c.done).map((c) => c.id)
    )
    const colOrder = new Map(data.columns.map((c, i) => [c.id, i]))
    const q = query.trim().toLowerCase().replace(/^#/, "")
    return data.cards
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          String(c.number ?? "") === q
      )
      .map((c) => ({ card: c, done: doneCols.has(c.columnId) }))
      .sort(
        (a, b) =>
          Number(a.done) - Number(b.done) ||
          (colOrder.get(a.card.columnId) ?? 0) -
            (colOrder.get(b.card.columnId) ?? 0) ||
          a.card.position.localeCompare(b.card.position)
      )
  }, [data, query])

  if (!data) return null
  if (rows.length === 0)
    return (
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
        {query.trim() ? "No card matches." : "This board has no cards."}
      </p>
    )

  return (
    <ul className="flex flex-col">
      {rows.map(({ card, done }) => {
        const isLinked = linked.has(card.id)
        const id = cardDisplayId(card.number)
        return (
          <li key={card.id}>
            <button
              type="button"
              disabled={isLinked || pendingId === card.id}
              onClick={() => onPick(card.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                "transition-colors outline-none hover:bg-muted focus-visible:bg-muted",
                "disabled:cursor-default disabled:hover:bg-transparent"
              )}
            >
              {id && (
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  #{id}
                </span>
              )}
              <span className={cn("truncate", done && "text-muted-foreground")}>
                {card.title || "Untitled card"}
              </span>
              {done && (
                <CircleCheck className="size-3.5 shrink-0 text-primary" />
              )}
              {isLinked && (
                <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs text-primary">
                  <Check className="size-3.5" />
                  Linked
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
