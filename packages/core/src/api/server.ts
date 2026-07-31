// Remote-sync config. The app is local-first (IndexedDB, no server); remote
// sync is opt-in.

import { runtime } from "../runtime"
import { appFetch } from "./fetch"

export function subscribeServerUrl(listener: () => void): () => void {
  return runtime().http.subscribe(listener)
}

// Alias: the sync-config setter emits on this same signal, and the sync facade
// rebuilds its engines when it fires.
export const subscribeSyncConfig = subscribeServerUrl

export function isSyncConfigured(): boolean {
  return runtime().http.isConfigured()
}

export function apiUrl(path: string): string {
  return runtime().http.url(path)
}

// Pins desktop updates to the server's release line; null if unreachable.
export async function getServerVersion(): Promise<string | null> {
  try {
    const res = await appFetch(apiUrl("/api/version"))
    if (!res.ok) return null
    const body = (await res.json()) as { version?: unknown }
    return typeof body.version === "string" ? body.version : null
  } catch {
    return null
  }
}
