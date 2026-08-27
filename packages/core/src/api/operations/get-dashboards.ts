import type { Dashboard } from "../../types"
import { byPosition } from "../../utils"
import { db } from "../db/db"
import { live } from "./live"

/** Every board's metadata, in sidebar order. */
export async function getDashboards(): Promise<Dashboard[]> {
  const list = await db.getDashboards()
  return list
    .filter(live)
    // Boards stored before nesting existed carry no parentId at all.
    .map((d) => (d.parentId === undefined ? { ...d, parentId: null } : d))
    .sort(byPosition)
}
