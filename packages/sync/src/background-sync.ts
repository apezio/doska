import type { Foreground, Net } from "@doska/ports"

/**
 * Starts a periodic background sync, polling only while the app is in front of
 * the user.
 *
 * {@link Foreground.subscribe} is expected to fire on more than the strict
 * transitions — the web adapter reports both `visibilitychange` and window
 * `focus`, because alt-tabbing back from another app leaves the tab "visible"
 * throughout and would otherwise not reconcile until the next poll. `reconcile`
 * is idempotent (the engine guards overlapping runs), so the double-fire that
 * costs is harmless.
 */
export function startBackgroundSync(
  reconcile: () => void,
  intervalMs: number,
  { foreground, net }: { foreground: Foreground; net: Net }
): () => void {
  let id: ReturnType<typeof setInterval> | undefined

  const start = () => {
    if (id === undefined) id = setInterval(reconcile, intervalMs)
  }

  const stop = () => {
    if (id !== undefined) {
      clearInterval(id)
      id = undefined
    }
  }

  const onForeground = () => {
    if (foreground.active()) {
      reconcile()
      start()
    } else {
      stop()
    }
  }

  // Coming back online: flush the queue now rather than making the user watch a
  // stale "offline" notice until the next tick. Worth doing while backgrounded
  // too, where the poll is stopped and nothing else would.
  const onNet = () => {
    if (net.online()) reconcile()
  }

  const unsubscribeForeground = foreground.subscribe(onForeground)
  const unsubscribeNet = net.subscribe(onNet)
  onForeground()

  return () => {
    unsubscribeForeground()
    unsubscribeNet()
    stop()
  }
}
