import { useLocation } from "wouter"
import {
  PriorityDot,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@doska/ui-kit"
import { useOpenCards } from "@doska/core/queries"
import type { OpenCard } from "@doska/core/operations"
import { routes } from "@/lib/routes"

const STAGE_LABELS: { key: "todo" | "doing"; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "doing", label: "In Progress" },
]

/** The sidebar's Cards tab: To Do and In Progress cards from every board. */
export function SidebarCardsList() {
  const [, navigate] = useLocation()
  const { data } = useOpenCards()
  if (!data) return null

  const shown = data.todo.length + data.doing.length
  const more = data.total - shown

  const openCard = ({ card, boardId }: OpenCard) =>
    navigate(`~${routes.deck.to(boardId)}${routes.card.to(card.id)}`)

  if (shown === 0)
    return (
      <p className="px-2 py-1 text-xs text-muted-foreground">No open cards</p>
    )

  return (
    <div className="max-h-[50vh] overflow-y-auto">
      {STAGE_LABELS.map(({ key, label }) =>
        data[key].length ? (
          <div key={key}>
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
              {data[key].map((entry) => (
                <SidebarMenuItem key={entry.card.id}>
                  <SidebarMenuButton
                    tooltip={entry.card.title}
                    onClick={() => openCard(entry)}
                  >
                    <PriorityDot value={entry.card.priority} />
                    <span className="truncate">
                      {entry.card.title || "Untitled card"}
                    </span>
                    <span className="ml-auto truncate text-xs text-muted-foreground">
                      {entry.boardTitle || "Untitled board"}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        ) : null
      )}
      {more > 0 && (
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Placeholder: a fuller view of every open card is still to come. */}
            <SidebarMenuButton disabled className="text-muted-foreground">
              <span>…and {more} more</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      )}
    </div>
  )
}
