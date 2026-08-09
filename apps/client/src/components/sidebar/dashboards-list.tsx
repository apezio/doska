import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@doska/ui-kit"
import { Users } from "lucide-react"
import { type Dashboard } from "@doska/core/types"

interface IProps {
  dashboards: Dashboard[]
  activeDashboardId: string
  sharedIds: string[]
  onSelectDashboard: (dashboard: Dashboard) => void
}

export function DashboardsList({
  dashboards,
  activeDashboardId,
  sharedIds,
  onSelectDashboard,
}: IProps) {
  if (!dashboards.length) return null
  const shared = new Set(sharedIds)
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
                {shared.has(dashboard.id) && (
                  <Users
                    role="img"
                    aria-label="Shared"
                    className="ml-auto text-muted-foreground"
                  />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
