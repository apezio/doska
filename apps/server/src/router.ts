import { contract } from "@doska/contract"
import { implement, ORPCError } from "@orpc/server"
import { assertBoardOwner, boardAccess } from "./db/access"
import { boardSync, boardsListSync, listMembers, writeMembers } from "./db/sync"
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
      await assertBoardOwner(context.userId, input.boardId)
      return { members: await listMembers(input.boardId) }
    }),
    add: os.members.add.handler(async ({ input, context }) => {
      await assertBoardOwner(context.userId, input.boardId)
      await refuseOwner(input.userId, input.boardId)
      await writeMembers([
        { boardId: input.boardId, userId: input.userId, role: input.role },
      ])
    }),
    remove: os.members.remove.handler(async ({ input, context }) => {
      await assertBoardOwner(context.userId, input.boardId)
      await refuseOwner(input.userId, input.boardId)
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
