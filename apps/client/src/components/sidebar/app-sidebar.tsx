import { useState } from "react"
import { useLocation, useParams, useRouter } from "wouter"
import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@doska/ui-kit"
import {
  useDashboards,
  usePublishedBoards,
  useSharedBoards,
} from "@doska/core/queries"
import { useMoveDashboard } from "@doska/core/mutations"
import { useAuth, useDashboardNav } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { AppSidebarHeader } from "./app-sidebar-header"
import { DashboardsList, type SidebarView } from "./dashboards-list"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarAccount } from "./sidebar-account"
import { SettingsButton } from "@/components/settings/settings-button"

export function AppSidebar() {
  const [location, navigate] = useLocation()
  const { data: dashboards = [] } = useDashboards()
  const { selectDashboard, createAndOpenDashboard } = useDashboardNav()
  const { mutate: moveDashboard } = useMoveDashboard()
  const { authed } = useAuth()
  const [view, setView] = useState<SidebarView>("dashboards")
  const { data: sharedIds = [] } = useSharedBoards(authed === true)
  const { data: publishedIds = [] } = usePublishedBoards(authed === true)

  const { base } = useRouter()
  const activeDashboardId = useParams().id ?? ""
  const isDigestActive = base === routes.digest()
  const isTrashActive = location === routes.trash()

  return (
    <Sidebar>
      <AppSidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <Button variant="secondary" onClick={createAndOpenDashboard}>
            Add a dashboard
          </Button>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isDigestActive}
                tooltip="Upcoming"
                onClick={() => navigate(`~${routes.digest()}`)}
              >
                <span>Upcoming</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isTrashActive}
                tooltip="Trash"
                onClick={() => navigate(`~${routes.trash()}`)}
              >
                <span>Trash</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <DashboardsList
          dashboards={dashboards}
          activeDashboardId={activeDashboardId}
          sharedIds={sharedIds}
          publishedIds={publishedIds}
          onSelectDashboard={(d) => selectDashboard(d.id)}
          onMoveDashboard={moveDashboard}
          view={view}
          onChangeView={setView}
        />
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
        <SettingsButton />
        <SidebarAccount />
      </SidebarFooter>
    </Sidebar>
  )
}
