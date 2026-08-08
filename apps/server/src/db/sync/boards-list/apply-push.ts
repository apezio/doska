import type { DashboardChange } from "@doska/contract"
import { applyChanges } from "../core/apply-changes"
import { applyOne } from "./apply-one"
import { boardsListCounter } from "../constants"

/**
 * Applies a client's pushed dashboard-list changes under last-writer-wins,
 * bumping the account-level dashboards counter once per accepted write.
 *
 * Mirrors {@link applyPush} but for the board-independent list channel: the
 * `seq` it stamps orders dashboards across every board, so any client can pull
 * the whole list past its cursor.
 *
 * `userId` owns any board this push creates.
 */
export function applyPush(
  changes: DashboardChange[],
  userId: string
): Promise<void> {
  return applyChanges(boardsListCounter(), changes, (tx, change, nextSeq) =>
    applyOne(tx, change, nextSeq, userId)
  )
}
