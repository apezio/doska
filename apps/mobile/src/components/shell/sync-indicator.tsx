import { useAccount } from "@doska/core/account"
import {
  sync,
  useConnection,
  type Connection,
  type SyncState,
} from "@doska/core/sync"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { router } from "expo-router"
import type { LucideIcon } from "lucide-react-native"
import Check from "lucide-react-native/icons/check"
import CloudOff from "lucide-react-native/icons/cloud-off"
import LogIn from "lucide-react-native/icons/log-in"
import PencilLine from "lucide-react-native/icons/pencil-line"
import TriangleAlert from "lucide-react-native/icons/triangle-alert"
import { useSyncExternalStore } from "react"
import { ActivityIndicator, Pressable, Text, View } from "react-native"
import { ROUTES } from "@/lib/routes"

interface Look {
  /** `null` while syncing: that state draws the platform spinner instead. */
  Icon: LucideIcon | null
  label: string
  danger: boolean
}

/** Resolves the live sync state into the icon, label, and tint to render. */
function view({ status, pending }: SyncState, connection: Connection): Look {
  if (connection.status === "dropped")
    return connection.reason === "offline"
      ? { Icon: CloudOff, label: "Offline", danger: true }
      : { Icon: TriangleAlert, label: "Sync failed", danger: true }

  if (status === "syncing")
    return { Icon: null, label: "Syncing", danger: false }
  if (status === "error")
    return { Icon: TriangleAlert, label: "Sync failed", danger: true }
  if (pending > 0)
    return {
      Icon: PencilLine,
      label: `${pending} ${pending === 1 ? "change" : "changes"}`,
      danger: false,
    }
  return { Icon: Check, label: "Synced", danger: false }
}

/**
 * What sync is doing, in the screen header: a spinner while reconciling, an
 * unsaved-changes count, a saved check, or an offline notice. Tapping flushes a
 * sync now — the web's `SyncIndicator`, minus its label, which the header has
 * no room for. {@link OfflineBanner} carries the wording instead.
 */
export function SyncIndicator() {
  const state = useSyncExternalStore(sync.subscribe, sync.getState)
  const connection = useConnection()
  const { authed, pending: sessionPending } = useAccount()
  const tokens = useTokens()

  // Signed out, sync can't run — point at the sign-in screen rather than show a
  // misleading "sync failed". The pre-check state counts as signed in, to avoid
  // a flash on every launch.
  if (!authed && !sessionPending) {
    return (
      <Pressable
        onPress={() => router.push(ROUTES.signIn)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Sign in to sync"
        className="rounded-lg p-1.5 active:bg-muted"
      >
        <LogIn size={18} color={tokens.mutedForeground} />
      </Pressable>
    )
  }

  const { Icon, label, danger } = view(state, connection)
  const color = danger ? tokens.destructive : tokens.mutedForeground

  return (
    <Pressable
      onPress={() => void sync.reconcile()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center gap-1 rounded-lg p-1.5 active:bg-muted"
    >
      {Icon ? (
        <Icon size={18} color={color} />
      ) : (
        <View className="size-[18px] items-center justify-center">
          <ActivityIndicator size="small" color={color} />
        </View>
      )}
      {state.pending > 0 && connection.status !== "dropped" ? (
        <Text className="text-xs font-sans-medium text-muted-foreground">
          {state.pending}
        </Text>
      ) : null}
    </Pressable>
  )
}
