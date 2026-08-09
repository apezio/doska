import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@doska/ui-kit"
import { Globe, Users } from "lucide-react"
import { type Dashboard } from "@doska/core/types"

interface IProps {
  dashboards: Dashboard[]
  activeDashboardId: string
  sharedIds: string[]
  publishedIds: string[]
  onSelectDashboard: (dashboard: Dashboard) => void
}

export function DashboardsList({
  dashboards,
  activeDashboardId,
  sharedIds,
  publishedIds,
  onSelectDashboard,
}: IProps) {
  if (!dashboards.length) return null
  const shared = new Set(sharedIds)
  const published = new Set(publishedIds)
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
      <SidebarGroupContent>
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
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
