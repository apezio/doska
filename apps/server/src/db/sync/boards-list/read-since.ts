import type { DashboardChange } from "@doska/contract"
import { and, eq, gt } from "drizzle-orm"
import { db } from "../../client"
import { dashboards } from "../../schema"
import { boardsListCounter } from "../constants"

/**
 * Returns every dashboard `userId` owns that changed past `since`, plus the
 * dashboards counter's high-water mark to hand back as the next cursor.
 * Board-independent: a client gets the metadata of every board it owns,
 * regardless of which one it has open.
 */
export async function readSince(
  since: number,
  userId: string
): Promise<{
  cursor: number
  changes: DashboardChange[]
}> {
  const cursor = await boardsListCounter().read(db)

  const changes: DashboardChange[] = []
  for (const r of await db
    .select()
    .from(dashboards)
    .where(and(eq(dashboards.ownerId, userId), gt(dashboards.seq, since)))) {
    changes.push({
      store: "dashboards",
      record: {
        id: r.id,
        title: r.title,
        position: r.position,
        prefix: r.prefix,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      },
    })
  }

  return { cursor, changes }
}
