import type { Session } from "@doska/core/auth"
import { useSession } from "@doska/core/queries"

export function useAuth(): Omit<Session, "authed"> & {
  authed: boolean | null
} {
  const { data } = useSession()
  return {
    authed: data === undefined ? null : data.authed,
    login: data?.login ?? null,
    userId: data?.userId ?? null,
    isAdmin: data?.isAdmin ?? false,
  }
}
