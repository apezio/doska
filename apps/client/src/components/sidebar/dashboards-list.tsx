import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd"
import {
  Button,
  cn,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@doska/ui-kit"
import { Globe, Users } from "lucide-react"
import { type Dashboard } from "@doska/core/types"
import {
  flattenDashboards,
  moveToIndex,
  moveToParent,
  type DashboardMove,
} from "@doska/core/utils"
import {
  BOARD_DROP_ATTR,
  useBoardUnderPointer,
} from "@/providers/board-dnd/board-dnd-context"
import { SidebarCardsList } from "./sidebar-cards-list"

/** What the sidebar's list shows: the boards, or the open cards across them. */
export type SidebarView = "dashboards" | "cards"

const VIEWS: { id: SidebarView; label: string }[] = [
  { id: "dashboards", label: "Dashboards" },
  { id: "cards", label: "Cards" },
]

/** How far each nesting level pushes a row to the right, in px. */
const INDENT_PX = 14

interface IProps {
  dashboards: Dashboard[]
  activeDashboardId: string
  sharedIds: string[]
  publishedIds: string[]
  onSelectDashboard: (dashboard: Dashboard) => void
  onMoveDashboard: (move: DashboardMove) => void
  view: SidebarView
  onChangeView: (view: SidebarView) => void
}

export function DashboardsList({
  dashboards,
  activeDashboardId,
  sharedIds,
  publishedIds,
  onSelectDashboard,
  onMoveDashboard,
  view,
  onChangeView,
}: IProps) {
  const overBoard = useBoardUnderPointer()
  if (!dashboards.length) return null
  const shared = new Set(sharedIds)
  const published = new Set(publishedIds)
  const rows = flattenDashboards(dashboards)

  // One flat list: a drop between rows reorders (and picks the parent from the
  // neighbouring row), a drop *onto* a row — dnd's "combine" — nests under it.
  function handleDragEnd({
    combine,
    destination,
    source,
    draggableId,
  }: DropResult) {
    let move: DashboardMove | null = null
    if (combine) {
      move = moveToParent(dashboards, draggableId, combine.draggableId)
    } else if (destination && destination.index !== source.index) {
      move = moveToIndex(dashboards, draggableId, destination.index)
    }
    if (move) onMoveDashboard(move)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="gap-1 px-0">
        {VIEWS.map(({ id, label }) => (
          <Button
            key={id}
            size="sm"
            variant={id === view ? "secondary" : "ghost"}
            aria-pressed={id === view}
            className={cn("h-7 px-2", id !== view && "text-muted-foreground")}
            onClick={() => onChangeView(id)}
          >
            {label}
          </Button>
        ))}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        {view === "cards" ? (
          <SidebarCardsList />
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sidebar-dashboards" isCombineEnabled>
              {(provided) => (
                <SidebarMenu
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {rows.map(({ dashboard, depth }, index) => (
                    <Draggable
                      key={dashboard.id}
                      draggableId={dashboard.id}
                      index={index}
                      disableInteractiveElementBlocking
                    >
                      {(dragProvided, snapshot) => (
                        <SidebarMenuItem
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          data-depth={depth}
                          style={{
                            ...dragProvided.draggableProps.style,
                            paddingLeft: depth * INDENT_PX,
                          }}
                          className={cn(
                            "rounded-md",
                            snapshot.isDragging && "opacity-80",
                            // The row a drag is hovering over: dropping here
                            // nests the dragged board underneath it.
                            snapshot.combineTargetFor &&
                              "ring-2 ring-sidebar-ring ring-inset"
                          )}
                        >
                          <SidebarMenuButton
                            // A card dropped on this row moves to that board.
                            // The board drag context reads the row under the
                            // pointer; the board you are already on is not a
                            // target. Separate from the row's own drag above.
                            {...(dashboard.id !== activeDashboardId && {
                              [BOARD_DROP_ATTR]: dashboard.id,
                            })}
                            className={cn(
                              overBoard === dashboard.id && "ring-2 ring-ring"
                            )}
                            isActive={dashboard.id === activeDashboardId}
                            tooltip={dashboard.title}
                            onClick={() => {
                              if (snapshot.isDragging) return
                              onSelectDashboard(dashboard)
                            }}
                          >
                            <span className="truncate">{dashboard.title}</span>
                            <span className="ml-auto flex items-center gap-1">
                              {published.has(dashboard.id) && (
                                <Globe
                                  role="img"
                                  aria-label="Public"
                                  className="size-3.5 text-muted-foreground"
                                />
                              )}
                              {shared.has(dashboard.id) && (
                                <Users
                                  role="img"
                                  aria-label="Shared"
                                  className="size-3.5 text-muted-foreground"
                                />
                              )}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </SidebarMenu>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
