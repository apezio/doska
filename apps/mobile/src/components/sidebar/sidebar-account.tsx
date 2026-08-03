import type { Session } from "@doska/core/auth"
import { useSession } from "@doska/core/queries"
import { type Connection, useConnection } from "@doska/core/sync"
import { initials } from "@doska/core/utils"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { router } from "expo-router"
import { ChevronRight, UserRound } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"
import { ROUTES } from "@/lib/routes"

const DROPPED = {
  offline: "Offline",
  auth: "Signed out on the server",
  server: "No server",
} as const

// `session` is undefined until the first check resolves; show a neutral
// placeholder until then so neither the wrong identity nor a control flashes.
function nameFor(session: Session | undefined): string {
  if (!session) return "…"
  if (!session.authed) return "Not signed in"
  return session.login ?? "Signed in"
}

function subtitleFor(connection: Connection): string {
  if (connection.status === "ok") return "Synced"
  if (connection.status === "local") return "Sign in to sync"
  return DROPPED[connection.reason]
}

/** What sync is doing, and a tap to fix it — the sign-in screen handles both
 * signing in and signing out. */
export function SidebarAccount() {
  const { data: session } = useSession()
  const connection = useConnection()
  const tokens = useTokens()

  const name = nameFor(session)
  const subtitle = subtitleFor(connection)

  return (
    <Pressable
      onPress={() => router.push(ROUTES.signIn)}
      className="flex-row items-center gap-2 rounded-lg px-2 py-2 active:bg-muted"
    >
      <View className="size-8 items-center justify-center rounded-full bg-muted">
        {session?.authed && session.login ? (
          <Text className="text-xs font-sans-semibold text-muted-foreground">
            {initials(session.login)}
          </Text>
        ) : (
          <UserRound size={16} color={tokens.mutedForeground} />
        )}
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="text-[13px] font-sans-medium text-sidebar-foreground"
        >
          {name}
        </Text>
        <Text
          numberOfLines={1}
          className={
            connection.status === "dropped"
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={16} color={tokens.mutedForeground} />
    </Pressable>
  )
}
