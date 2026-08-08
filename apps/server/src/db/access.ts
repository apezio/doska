import { ORPCError } from "@orpc/server"
import { eq } from "drizzle-orm"
import { db } from "./client"
import { dashboards } from "./schema"

/** Stage 2 adds `"member"` for boards shared with the user. */
export type BoardAccess = "owner" | "unknown" | "denied"

/** What `userId` may do with `boardId` */
export async function boardAccess(
  userId: string,
  boardId: string
): Promise<BoardAccess> {
  const [row] = await db
    .select({ ownerId: dashboards.ownerId })
    .from(dashboards)
    .where(eq(dashboards.id, boardId))
    .limit(1)

  if (!row) return "unknown"
  if (row.ownerId === null || row.ownerId === userId) return "owner"
  return "denied"
}

/**
 * The 403 the client reads as "this board, not this session" — it drops the
 * board locally rather than reporting a lost sign-in.
 */
export async function assertBoardAccess(
  userId: string,
  boardId: string
): Promise<void> {
  if ((await boardAccess(userId, boardId)) === "denied")
    throw new ORPCError("FORBIDDEN")
}
