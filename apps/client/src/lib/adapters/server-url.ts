// Where the sync server lives, as the user configured it. Only the desktop
// build has anything to configure — on web the server is the page's own origin

import { webKeyValue } from "./web-kv"

const SERVER_URL_KEY = "deck:server-url"

const listeners = new Set<() => void>()

export function subscribeServerUrl(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getServerUrl(): string {
  return webKeyValue.get(SERVER_URL_KEY) ?? ""
}

export function setServerUrl(url: string): void {
  const trimmed = url.trim().replace(/\/+$/, "")
  if (trimmed) webKeyValue.set(SERVER_URL_KEY, trimmed)
  else webKeyValue.remove(SERVER_URL_KEY)
  for (const listener of listeners) listener()
}
