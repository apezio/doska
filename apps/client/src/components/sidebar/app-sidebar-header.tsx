import { cn, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@doska/ui-kit"
import { Anchor } from "lucide-react"
import { Link } from "wouter"
import { useAppVersion } from "@/lib/version"
import { isDesktop } from "@/lib/platform"

export function AppSidebarHeader() {
  const version = useAppVersion()

  const versionBadge = (
    <span className="line-clamp-1 text-sm font-normal text-muted-foreground/50">
      {version}
    </span>
  )

  return (
    <SidebarHeader
      className={cn(
        "relative pt-[calc(--spacing(2)+env(safe-area-inset-top))]",
        isDesktop() && "pt-10"
      )}
    >
      {isDesktop() && (
        <div className="absolute top-0 right-4 text-xs">{versionBadge}</div>
      )}
      <SidebarMenu>
        <SidebarMenuItem>
          <Link to="~/">
            <div className="flex items-center space-x-1">
              <Anchor className="size-4 shrink-0" />
              <span className="cn-font-heading pr-2 text-base font-semibold">
                Doska
              </span>
              {!isDesktop() && versionBadge}
            </div>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
