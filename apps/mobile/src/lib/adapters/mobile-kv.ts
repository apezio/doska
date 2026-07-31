import type { KeyValue } from "@doska/ports"
import { openDatabaseSync } from "expo-sqlite"

/**
 * SQLite's synchronous API, and it has to be synchronous.
 *
 * `hlc.ts` mirrors the clock's high-water mark on every stamp. An asynchronous
 * write can still be in flight when the app is killed, and the clock then comes
 * back regressed — after which edits quietly lose last-writer-wins with nothing
 * raised anywhere. AsyncStorage cannot meet that; `runSync` can.
 *
 * Its own database file rather than a table in `deck.db`: these writes sit on
 * the sync push path and must not queue behind a record transaction.
 */
const db = openDatabaseSync("kv.db")
db.execSync("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)")

export const mobileKeyValue: KeyValue = {
  get: (key) => {
    try {
      const row = db.getFirstSync<{ value: string }>(
        "SELECT value FROM kv WHERE key = ?",
        key
      )
      return row?.value ?? null
    } catch {
      return null
    }
  },
  set: (key, value) => {
    try {
      db.runSync(
        `INSERT INTO kv (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        key,
        value
      )
    } catch {
      // The port promises not to throw: callers sit in render and on the sync
      // push path, where nothing above them catches.
    }
  },
  remove: (key) => {
    try {
      db.runSync("DELETE FROM kv WHERE key = ?", key)
    } catch {
      // As above.
    }
  },
}
