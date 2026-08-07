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
import { useDashboards } from "@doska/core/queries"
import { useDashboardNav } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { AppSidebarHeader } from "./app-sidebar-header"
import { DashboardsList } from "./dashboards-list"
import { ThemeToggle } from "./theme-toggle"
import { SidebarAccount } from "./sidebar-account"
import { GitHubButton } from "./github-button"
import { DocsButton } from "./docs-button"
import { SettingsButton } from "@/components/settings/settings-button"

export function AppSidebar() {
  const [location, navigate] = useLocation()
  const { data: dashboards = [] } = useDashboards()
  const { selectDashboard, createAndOpenDashboard } = useDashboardNav()

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
          onSelectDashboard={(d) => selectDashboard(d.id)}
        />
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
        <SettingsButton />
        <DocsButton />
        <GitHubButton />
        <SidebarAccount />
      </SidebarFooter>
    </Sidebar>
  )
}
