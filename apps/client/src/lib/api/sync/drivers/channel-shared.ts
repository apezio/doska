import { RETENTION_MS, type Change, type DashboardChange } from "@doska/contract"
import type { DirtyStore } from "@doska/sync"
import { idb, META_STORE } from "../../db/idb"

/** Cursor IO, ref identity, and compaction — shared by every driver. */

/** 0 (pull everything) when unset. */
export async function loadCursor(key: string): Promise<number> {
  const raw = await idb.get<number>(META_STORE, key)
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0
}

export async function saveCursor(key: string, value: number): Promise<void> {
  try {
    await idb.set(META_STORE, key, value)
  } catch {
    // Storage unavailable; the next sync re-pulls from the in-memory cursor.
  }
}

export function refOf(change: Change | DashboardChange): string {
  return `${change.store}/${change.record.id}`
}

/**
 * Hard-deletes tombstones the backend has acked *and* that have aged out of the
 * trash; keeps still-dirty refs. A fresh tombstone is what the trash view reads,
 * so it survives the sync that acked it — see `purgeExpired`, which sweeps the
 * ones no pull happens to touch.
 */
export async function compact(
  dirty: DirtyStore,
  refs: string[]
): Promise<void> {
  const cutoff = Date.now() - RETENTION_MS
  for (const ref of refs) {
    if (dirty.has(ref)) continue
    const [store, id] = ref.split("/")
    try {
      const record = await idb.get<{ deletedAt: number | null }>(store, id)
      if (record?.deletedAt != null && record.deletedAt < cutoff)
        await idb.delete(store, id)
    } catch (err) {
      console.warn("[sync] compaction failed for", store, id, err)
    }
  }
}
