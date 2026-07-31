/**
 * Small synchronous string store for settings and session bookkeeping — the
 * server URL, the session token, one-shot "already asked" flags. Synchronous
 * because the callers read it inside `fetch` wrappers and render paths that
 * have nowhere to await; both backings (`localStorage`, expo-sqlite's sync API)
 * can answer that way.
 *
 * Not for records: boards, columns and cards live in {@link ClientDB}.
 */
export interface KeyValue {
  /** The stored string, or null when the key was never set. */
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
}
