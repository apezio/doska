import { useSyncExternalStore } from "react"
import { isDesktop } from "./platform"
import { checkServiceWorkerUpdate, registerServiceWorker } from "./pwa"
import { checkForUpdates, type UpdateState } from "./updates"

// Shared result of the startup update check, so multiple parts of the UI (the
// install banner, the sidebar version label) react to the same state without
// each running its own check.

let state: UpdateState = { status: "none" }
let started = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function set(next: UpdateState) {
  state = next
  emit()
}

/**
 * Runs the update check once per session and publishes the result. Exactly one
 * of the two sources can fire: the Tauri updater on desktop, the service worker
 * on web.
 */
export function startUpdateCheck(): void {
  if (started) return
  started = true
  void checkForUpdates().then(set)
  registerServiceWorker((install) =>
    set({ status: "available", kind: "web", install })
  )
}

/**
 * Re-runs the platform's update check on demand and publishes the result, so
 * the settings action and the startup check share one state.
 */
export async function runUpdateCheck(): Promise<void> {
  if (isDesktop()) {
    set(await checkForUpdates())
    return
  }
  // A waiting worker announces itself through the registerServiceWorker
  // callback above, which publishes the state — nothing to set here.
  await checkServiceWorkerUpdate()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Subscribe to the shared update state (kicks off the check on first use). */
export function useUpdateState(): UpdateState {
  startUpdateCheck()
  return useSyncExternalStore(subscribe, () => state)
}
