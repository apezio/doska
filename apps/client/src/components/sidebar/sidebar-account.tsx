import { useAccount } from "@doska/core/account"
import { initials } from "@doska/core/utils"
import {
  Avatar,
  AvatarFallback,
  Button,
  cn,
  SidebarMenu,
  SidebarMenuItem,
} from "@doska/ui-kit"
import { LogIn, LogOut, UserRound } from "lucide-react"
import { useLoginPrompt } from "@/components/login/login-prompt-context"
import { useLogout } from "@doska/core/mutations"

export function SidebarAccount() {
  const { session, name, subtitle, dropped } = useAccount()
  const openLogin = useLoginPrompt()
  const { mutate: logout } = useLogout()

  const authed = session?.authed ?? null
  const login = session?.login ?? null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm [&>svg]:size-4 [&>svg]:shrink-0">
          <Avatar className="size-8 rounded-full">
            <AvatarFallback className="rounded-full text-xs">
              {authed && login ? (
                initials(login)
              ) : (
                <UserRound className="size-4" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden text-left leading-tight">
            <span className="truncate text-sm font-medium">{name}</span>
            <span
              className={cn(
                "truncate text-xs",
                dropped ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {subtitle}
            </span>
          </div>
          {authed === true && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Sign out"
              title="Sign out"
              className="ml-auto text-muted-foreground"
              onClick={() => logout()}
            >
              <LogOut />
            </Button>
          )}
          {authed === false && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Sign in to sync"
              title="Sign in to sync"
              className="ml-auto text-muted-foreground"
              onClick={openLogin}
            >
              <LogIn />
            </Button>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
