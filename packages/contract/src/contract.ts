import { oc } from "@orpc/contract"
import { z } from "zod"
import {
  ChangeSchema,
  DashboardChangeSchema,
  DirectoryUserSchema,
  MemberRoleSchema,
  MemberSchema,
} from "./schemas"

/**
 * The sync contract. Two channels, each push-then-pull with a `since` cursor:
 *
 *  - `board.sync`: a single board's columns and cards, scoped by `boardId`.
 *  - `dashboards.sync`: the dashboard list, account-level and board-independent,
 *    so other boards' create/rename/delete reach a client whatever board is open.
 *
 * In both: push the client's locally-changed records in `changes`; pull every
 * record changed past the client's `since` cursor, plus the new high-water `cursor`.
 *
 * `members` and `users` are not channels. They are ordinary request/response
 * RPCs with no cursor: a membership write shows up on a client through the
 * `dashboards.sync` channel, which is why the row carries a board-list `seq`.
 */
export const contract = {
  board: {
    sync: oc
      .input(
        z.object({
          boardId: z.string(),
          since: z.number(),
          changes: z.array(ChangeSchema),
        })
      )
      .output(
        z.object({
          cursor: z.number(),
          changes: z.array(ChangeSchema),
        })
      ),
  },
  dashboards: {
    sync: oc
      .input(
        z.object({
          since: z.number(),
          changes: z.array(DashboardChangeSchema),
        })
      )
      .output(
        z.object({
          cursor: z.number(),
          changes: z.array(DashboardChangeSchema),
          // Boards this account has lost access to
          removed: z.array(z.string()).optional(),
        })
      ),
  },
  members: {
    list: oc
      .input(z.object({ boardId: z.string() }))
      .output(z.object({ members: z.array(MemberSchema) })),
    add: oc
      .input(
        z.object({
          boardId: z.string(),
          userId: z.string(),
          role: MemberRoleSchema.default("editor"),
        })
      )
      .output(z.void()),
    remove: oc
      .input(z.object({ boardId: z.string(), userId: z.string() }))
      .output(z.void()),
  },
  users: {
    list: oc.output(z.object({ users: z.array(DirectoryUserSchema) })),
  },
}
