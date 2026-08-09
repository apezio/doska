import type { MemberRole } from "../schema"
import { boardMembers } from "../schema"
import { applyChanges } from "./core/apply-changes"
import { boardsListCounter } from "./constants"

/** A grant, a role change or a revocation — all of them rewrite the one row. */
export interface MemberWrite {
  boardId: string
  userId: string
  role?: MemberRole
  /** Epoch ms to revoke, `null` to grant or restore. */
  revokedAt?: number | null
}

/**
 * Writes membership rows, stamping each with the next board-list `seq` so the
 * member's client picks the change up past a cursor that has already passed the
 * board itself.
 *
 * Server-authoritative, so no last-writer-wins: every write lands and takes a
 * `seq`. Counter and rows move in one transaction, as in {@link applyChanges}'s
 * other callers, so they cannot drift.
 */
export function writeMembers(
  writes: MemberWrite[],
  now = Date.now()
): Promise<void> {
  return applyChanges(
    boardsListCounter(),
    writes,
    async (tx, { boardId, userId, role = "editor", revokedAt = null }, seq) => {
      await tx
        .insert(boardMembers)
        .values({ boardId, userId, role, seq, revokedAt, updatedAt: now })
        .onConflictDoUpdate({
          target: [boardMembers.boardId, boardMembers.userId],
          set: { role, seq, revokedAt, updatedAt: now },
        })
      return true
    }
  )
}
