import type { Foreground, Net } from "@doska/ports"

/**
 * Starts a periodic background sync, polling only while the app is in front of
 * the user.
 *
 * {@link Foreground.subscribe} may fire without a transition; `reconcile` is
 * idempotent (the engine guards overlapping runs), so adapters are free to be
 * generous about what counts as coming back.
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
