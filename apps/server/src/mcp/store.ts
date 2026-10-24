import {
  ConflictError,
  type BoardStore,
  type ProjectInput,
  type ProjectStore,
} from "@doska/mcp"
import type { Change, Dashboard, DashboardChange } from "@doska/contract"
import { ORPCError } from "@orpc/server"
import { HybridClock } from "@doska/sync/hlc"
import * as projects from "../db/projects"
import { boardSync, boardsListSync } from "../db/sync"

const clock = new HybridClock()

/**
 * A board owned by someone else reads to an agent as a board that isn't there
 */
async function checkMissing<T>(boardId: string, run: Promise<T>): Promise<T> {
  try {
    return await run
  } catch (err) {
    if (err instanceof ORPCError && err.code === "FORBIDDEN")
      throw new Error(`No board ${boardId}`)
    throw err
  }
}

/**
 * oRPC errors as an agent should read them: a stale write carries the record as
 * it stands, and someone else's project reads as one that isn't there.
 */
async function toolErrors<T>(what: string, run: Promise<T>): Promise<T> {
  try {
    return await run
  } catch (err) {
    if (!(err instanceof ORPCError)) throw err
    if (err.code === "CONFLICT")
      throw new ConflictError(err.message, err.data.current)
    if (err.code === "FORBIDDEN") throw new Error(`No ${what}`)
    throw new Error(err.message)
  }
}

/**
 * The MCP tools' store, wired straight onto the sync tables — the same calls the
 * RPC router makes, one function call away instead of one HTTP hop.
 */
export class DbStore implements BoardStore, ProjectStore {
  readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  now(): number {
    return clock.now()
  }

  async readDashboards(): Promise<Dashboard[]> {
    const { changes } = await boardsListSync.readSince(0, this.userId)
    const records = changes.map((change) => change.record)
    for (const record of records) clock.receive(record.updatedAt)
    return records
  }

  async readBoard(boardId: string): Promise<Change[]> {
    const { changes } = await checkMissing(
      boardId,
      boardSync.readSince(boardId, 0, this.userId)
    )
    for (const change of changes) clock.receive(change.record.updatedAt)
    return changes
  }

  async pushDashboards(changes: DashboardChange[]): Promise<void> {
    await boardsListSync.applyPush(changes, this.userId)
  }

  async pushBoard(boardId: string, changes: Change[]): Promise<void> {
    await checkMissing(
      boardId,
      boardSync.applyPush(boardId, changes, this.userId)
    )
  }

  listProjects() {
    return projects.listProjects(this.userId)
  }

  getProject(id: string) {
    return toolErrors(`project ${id}`, projects.getProject(this.userId, { id }))
  }

  createProject(input: ProjectInput<"create">) {
    return projects.createProject(this.userId, input, "mcp")
  }

  updateProject(input: ProjectInput<"update">) {
    return toolErrors(
      `project ${input.id}`,
      projects.updateProject(this.userId, input, "mcp")
    )
  }

  getWorkstream(id: string) {
    return toolErrors(
      `workstream ${id}`,
      projects.getWorkstream(this.userId, id)
    )
  }

  createWorkstream(input: ProjectInput<"workstreamCreate">) {
    return toolErrors(
      `project ${input.projectId}`,
      projects.createWorkstream(this.userId, input, "mcp")
    )
  }

  updateWorkstream(input: ProjectInput<"workstreamUpdate">) {
    return toolErrors(
      `workstream ${input.id}`,
      projects.updateWorkstream(this.userId, input, "mcp")
    )
  }

  createDecision(input: ProjectInput<"decisionCreate">) {
    return toolErrors(
      `project ${input.projectId}`,
      projects.createDecision(this.userId, input, "mcp")
    )
  }

  updateDecision(input: ProjectInput<"decisionUpdate">) {
    return toolErrors(
      `decision ${input.id}`,
      projects.updateDecision(this.userId, input, "mcp")
    )
  }

  linkCard(input: ProjectInput<"cardLink">) {
    return toolErrors(
      `project ${input.projectId} or board ${input.boardId}`,
      projects.linkCard(this.userId, input, "mcp")
    )
  }

  unlinkCard(input: ProjectInput<"cardUnlink">) {
    return toolErrors(
      `project ${input.projectId}`,
      projects.unlinkCard(this.userId, input, "mcp")
    )
  }

  registerSession(input: ProjectInput<"sessionRegister">) {
    return toolErrors(
      `project ${input.projectId}`,
      projects.registerSession(this.userId, input, "mcp")
    )
  }

  addNote(input: ProjectInput<"noteAdd">) {
    return toolErrors(
      `project ${input.projectId}`,
      projects.addNote(this.userId, input, "mcp")
    )
  }
}
