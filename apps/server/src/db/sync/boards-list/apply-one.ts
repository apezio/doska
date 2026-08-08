import type { DashboardChange } from "@doska/contract"
import { type Tx } from "../core/counter"
import { dashboards } from "../../schema"
import { upsertLWW } from "../core/upsert-lww"

/**
 * Upserts one dashboard-list change under last-writer-wins, stamping `nextSeq`
 * and, for a board this user is creating, `ownerId`. The board-list counterpart
 * to {@link applyOneBoard}.
 */
export function applyOne(
  tx: Tx,
  { record }: DashboardChange,
  nextSeq: number,
  userId: string
): Promise<boolean> {
  return upsertLWW(
    tx,
    dashboards,
    dashboards.id,
    dashboards.updatedAt,
    {
      id: record.id,
      title: record.title,
      position: record.position,
      prefix: record.prefix,
      ownerId: userId,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      seq: nextSeq,
    },
    // Ownership is decided by whoever inserted the row
    ["ownerId"]
  )
}
