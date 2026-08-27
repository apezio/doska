import type { DashboardMove } from "../../utils/dashboard-tree"
import { isSelfOrDescendant, parentOf } from "../../utils/dashboard-tree"
import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"
import { live } from "./live"

/**
 * Puts a board somewhere else in the sidebar: under `parentId` (null for the
 * top level) at `position` among its siblings. Only the moved board changes —
 * its children follow it by reference. A move under itself or one of its own
 * descendants would orphan the whole subtree, so it is ignored.
 */
export async function moveDashboard({
  id,
  parentId,
  position,
}: DashboardMove): Promise<void> {
  const dashboard = await db.getDashboard(id)
  if (!dashboard) return
  if (parentOf(dashboard) === parentId && dashboard.position === position) return
  if (parentId !== null) {
    const all = (await db.getDashboards()).filter(live)
    if (!all.some((d) => d.id === parentId)) return
    if (isSelfOrDescendant(all, id, parentId)) return
  }
  await db.setDashboard({ ...dashboard, parentId, position, updatedAt: stamp() })
  sync.markDirty("dashboards", id)
}
