import type { Net } from "@doska/ports"
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo"

/**
 * NetInfo only pushes state, so the last event is held here and {@link Net.online}
 * reads it. Optimistic until the first one lands: the port is explicit that this
 * never gates an attempt, only names a failure, and guessing offline early would
 * mislabel a real server error.
 */
let online = true

const listeners = new Set<() => void>()

// `isInternetReachable` is null while it is still being probed — only an
// explicit false means attached to a network that goes nowhere.
function derive(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false
}

NetInfo.addEventListener((state) => {
  const next = derive(state)
  if (next === online) return
  online = next
  for (const listener of listeners) listener()
})

export const mobileNet: Net = {
  online: () => online,
  subscribe: (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
