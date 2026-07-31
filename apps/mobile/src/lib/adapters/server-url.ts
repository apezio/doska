// Where the sync server lives, as the user configured it. There is no origin to
// fall back on in a native app, so until this is set the app runs purely local.
// The sign-in screen is what sets it.

import { mobileKeyValue } from "./mobile-kv"

const SERVER_URL_KEY = "deck:server-url"

const listeners = new Set<() => void>()

export function subscribeServerUrl(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getServerUrl(): string {
  return mobileKeyValue.get(SERVER_URL_KEY) ?? ""
}

export function setServerUrl(url: string): void {
  const trimmed = url.trim().replace(/\/+$/, "")
  if (trimmed) mobileKeyValue.set(SERVER_URL_KEY, trimmed)
  else mobileKeyValue.remove(SERVER_URL_KEY)
  for (const listener of listeners) listener()
}
