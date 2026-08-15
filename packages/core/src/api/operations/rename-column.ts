import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

/** Renames a column. */
export async function renameColumn(id: string, title: string): Promise<void> {
  const column = await db.getColumn(id)
  if (!column) return
  await db.setColumn({ ...column, title, updatedAt: stamp() })
  sync.markDirty("columns", id)
}
