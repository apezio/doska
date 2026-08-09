import { ORPCError } from "@orpc/server"
import { and, eq, isNull } from "drizzle-orm"
import { db } from "./client"
import { boardMembers, dashboards } from "./schema"

/** `"member"` is a board shared with the user; it currently implies editing. */
export type BoardAccess = "owner" | "member" | "unknown" | "denied"

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

  const [membership] = await db
    .select({ role: boardMembers.role })
    .from(boardMembers)
    .where(
      and(
        eq(boardMembers.boardId, boardId),
        eq(boardMembers.userId, userId),
        isNull(boardMembers.revokedAt)
      )
    )
    .limit(1)

  return membership ? "member" : "denied"
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

/** Sharing is the owner's alone — a member cannot pass their access on. */
export async function assertBoardOwner(
  userId: string,
  boardId: string
): Promise<void> {
  if ((await boardAccess(userId, boardId)) !== "owner")
    throw new ORPCError("FORBIDDEN")
}
