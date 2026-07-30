import type { Change, Dashboard, DashboardChange } from "@doska/contract"

/**
 * The board, as the MCP tools need it — the sync protocol and nothing else:
 * reads hand back whole records (tombstones included), writes push whole records
 * under last-writer-wins, and a delete is a tombstone.
 *
 * Two implementations exist and the tools cannot tell them apart: the server
 * (`apps/server`) goes straight onto the sync tables, the stdio client
 * (`apps/mcp`) goes over the sync API of a remote server. Making sense of what
 * comes back — dropping tombstones, ordering, splitting columns from cards — is
 * `createBoard`'s job, so neither implementation has to do it.
 */
export type BoardStore = {
  readDashboards(): Promise<Dashboard[]>
  readBoard(boardId: string): Promise<Change[]>
  pushDashboards(changes: DashboardChange[]): Promise<void>
  pushBoard(boardId: string, changes: Change[]): Promise<void>
  /**
   * The timestamp to stamp a write with. A peer's own clock, not wall time:
   * `updatedAt` settles last-writer-wins, and a plain `Date.now()` here loses
   * every conflict against a record written by a device whose clock runs ahead
   * — silently, since a rejected write never reaches the tool that made it.
   */
  now(): number
}
