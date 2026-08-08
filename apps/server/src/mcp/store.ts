import type { BoardStore } from "@doska/mcp"
import type { Change, Dashboard, DashboardChange } from "@doska/contract"
import { HybridClock } from "@doska/sync/hlc"
import { boardSync, boardsListSync } from "../db/sync"

const clock = new HybridClock()

/**
 * The MCP tools' store, wired straight onto the sync tables — the same calls the
 * RPC router makes, one function call away instead of one HTTP hop.
 */
export class DbStore implements BoardStore {
  readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  now(): number {
    return clock.now()
  }

  async readDashboards(): Promise<Dashboard[]> {
    const { changes } = await boardsListSync.readSince(0)
    const records = changes.map((change) => change.record)
    for (const record of records) clock.receive(record.updatedAt)
    return records
  }

  async readBoard(boardId: string): Promise<Change[]> {
    const { changes } = await boardSync.readSince(boardId, 0)
    for (const change of changes) clock.receive(change.record.updatedAt)
    return changes
  }

  async pushDashboards(changes: DashboardChange[]): Promise<void> {
    await boardsListSync.applyPush(changes, this.userId)
  }

  async pushBoard(boardId: string, changes: Change[]): Promise<void> {
    await boardSync.applyPush(boardId, changes)
  }
}
