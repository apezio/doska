import { runtime } from "../runtime"
import { authClient } from "./auth-client"
import { isSyncConfigured } from "./server"

export type Session = { authed: boolean; login: string | null }

const expiryListeners = new Set<() => void>()

/** Fires when the server rejects a request as unauthenticated, so the app can
 * flip to signed-out from one place rather than at every call site. */
export function onSessionExpired(listener: () => void): () => void {
  expiryListeners.add(listener)
  return () => {
    expiryListeners.delete(listener)
  }
}

export function sessionExpired(): void {
  for (const listener of expiryListeners) listener()
}

const SIGNED_OUT: Session = { authed: false, login: null }

export async function fetchSession(): Promise<Session> {
  if (!isSyncConfigured()) return SIGNED_OUT

  const { data, error } = await authClient().getSession()
  if (error) {
    if (error.status === 401 || error.status === 403) return SIGNED_OUT
    throw new Error(error.message ?? "Could not reach the server")
  }
  if (!data) return SIGNED_OUT
  return { authed: true, login: data.user.username ?? null }
}

/** The one account is seeded with a login, not an email — hence `username`. */
export async function login(login: string, password: string): Promise<void> {
  const { error } = await authClient().signIn.username({
    username: login,
    password,
  })
  if (error) throw new Error(error.message ?? "Invalid credentials")
}

/** Drops this client's session: the cookie, and any token that was stored. */
export async function logout(): Promise<void> {
  await authClient().signOut()
  runtime().auth.clear()
}
