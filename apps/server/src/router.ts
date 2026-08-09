import { contract, type MemberRole } from "@doska/contract"
import { implement, ORPCError } from "@orpc/server"
import { assertBoardOwner, boardAccess } from "./db/access"
import {
  boardSync,
  boardsListSync,
  listRoster,
  listSharedBoards,
  writeMembers,
} from "./db/sync"
import { listUsers } from "./db/users"

const os = implement(contract).$context<{ userId: string }>()

/**
 * The board's own owner never gets a membership row
 */
async function refuseOwner(userId: string, boardId: string): Promise<void> {
  if ((await boardAccess(userId, boardId)) === "owner")
    throw new ORPCError("BAD_REQUEST", {
      message: "The board's owner already has access.",
    })
}

/**
 * What `userId` may do with the roster of `boardId`. A board this server has
 * never seen is the caller's own — they are about to push it — so it reads as
 * owner rather than as a board someone is prying at.
 */
async function rosterRole(
  userId: string,
  boardId: string
): Promise<MemberRole> {
  const access = await boardAccess(userId, boardId)
  if (access === "denied") throw new ORPCError("FORBIDDEN")
  return access === "member" ? "editor" : "owner"
}

export const router = os.router({
  board: {
    sync: os.board.sync.handler(async ({ input, context }) => {
      await boardSync.applyPush(input.boardId, input.changes, context.userId)
      return boardSync.readSince(input.boardId, input.since, context.userId)
    }),
  },
  dashboards: {
    sync: os.dashboards.sync.handler(async ({ input, context }) => {
      await boardsListSync.applyPush(input.changes, context.userId)
      return boardsListSync.readSince(input.since, context.userId)
    }),
  },
  members: {
    list: os.members.list.handler(async ({ input, context }) => {
      const viewerRole = await rosterRole(context.userId, input.boardId)
      return { members: await listRoster(input.boardId), viewerRole }
    }),
    sharedBoards: os.members.sharedBoards.handler(async ({ context }) => ({
      boardIds: await listSharedBoards(context.userId),
    })),
    add: os.members.add.handler(async ({ input, context }) => {
      await assertBoardOwner(context.userId, input.boardId)
      await refuseOwner(input.userId, input.boardId)
      await writeMembers([
        { boardId: input.boardId, userId: input.userId, role: input.role },
      ])
    }),
    remove: os.members.remove.handler(async ({ input, context }) => {
      if (input.userId === context.userId) {
        // Leaving. Only a member has access to give up: an owner doing this
        // would be abandoning their own board, which is a delete.
        const access = await boardAccess(context.userId, input.boardId)
        if (access === "denied") throw new ORPCError("FORBIDDEN")
        if (access !== "member")
          throw new ORPCError("BAD_REQUEST", {
            message: "A board's owner cannot leave it.",
          })
      } else {
        await assertBoardOwner(context.userId, input.boardId)
        await refuseOwner(input.userId, input.boardId)
      }
      const now = Date.now()
      await writeMembers(
        [{ boardId: input.boardId, userId: input.userId, revokedAt: now }],
        now
      )
    }),
  },
  users: {
    list: os.users.list.handler(async () => ({ users: await listUsers() })),
  },
})
