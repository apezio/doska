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
import { SidebarCardsList } from "./sidebar-cards-list"

/** What the sidebar's list shows: the boards, or the open cards across them. */
export type SidebarView = "dashboards" | "cards"

const VIEWS: { id: SidebarView; label: string }[] = [
  { id: "dashboards", label: "Dashboards" },
  { id: "cards", label: "Cards" },
]

interface IProps {
  dashboards: Dashboard[]
  activeDashboardId: string
  sharedIds: string[]
  publishedIds: string[]
  onSelectDashboard: (dashboard: Dashboard) => void
  view: SidebarView
  onChangeView: (view: SidebarView) => void
}

export function DashboardsList({
  dashboards,
  activeDashboardId,
  sharedIds,
  publishedIds,
  onSelectDashboard,
  view,
  onChangeView,
}: IProps) {
  if (!dashboards.length) return null
  const shared = new Set(sharedIds)
  const published = new Set(publishedIds)
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
          <SidebarMenu>
            {dashboards.map((dashboard) => (
              <SidebarMenuItem key={dashboard.id}>
                <SidebarMenuButton
                  isActive={dashboard.id === activeDashboardId}
                  tooltip={dashboard.title}
                  onClick={() => onSelectDashboard(dashboard)}
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
            ))}
          </SidebarMenu>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
