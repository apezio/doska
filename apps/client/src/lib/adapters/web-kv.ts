import type { KeyValue } from "@doska/ports"

/**
 * `localStorage` throws rather than no-ops when it is unavailable — Safari's
 * private mode, a full quota, a blocked third-party context — and every caller
 * here has a fallback for a missing value but none for an exception, so the
 * failure is swallowed at the boundary.
 */
export const webKeyValue: KeyValue = {
  get: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Nothing to do: the caller's durable copy is elsewhere.
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // As above.
    }
  },
}
