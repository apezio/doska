import type {
  Change,
  contract,
  Dashboard,
  DashboardChange,
  Project,
  ProjectDecision,
  ProjectDetail,
  ProjectEvent,
  ProjectSession,
  ProjectSummary,
  Workstream,
} from "@doska/contract"
import type { z } from "zod"

/**
 * The board, as the MCP tools need it — the sync protocol and nothing else:
 * reads hand back whole records (tombstones included), writes push whole records
 * under last-writer-wins, and a delete is a tombstone.
 *
 * The one implementation today is the server's (`apps/server`), straight onto
 * the sync tables. Whose boards those are belongs to the implementation, not
 * here: the tools never name a user. Making sense of what comes back — dropping
 * tombstones, ordering, splitting columns from cards — is `createBoard`'s job,
 * so no implementation has to do it.
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

type Procedures = typeof contract.projects
/** What a `contract.projects` procedure takes, e.g. `ProjectInput<"update">`. */
export type ProjectInput<K extends Exclude<keyof Procedures, "list">> = z.input<
  NonNullable<Procedures[K]["~orpc"]["inputSchema"]>
>

/**
 * A write refused because the record moved past the `ifVersion` it was given.
 * Carries the record as it stands, so the tool can merge or the agent can.
 */
export class ConflictError extends Error {
  readonly current: { version: number }

  constructor(message: string, current: { version: number }) {
    super(`${message} Current value: ${JSON.stringify(current)}`)
    this.current = current
  }
}

/**
 * Projects, as the MCP tools need them: the `contract.projects` procedures with
 * the user already bound. Access is the implementation's business; a stale
 * `ifVersion` throws `ConflictError`.
 */
export type ProjectStore = {
  listProjects(): Promise<ProjectSummary[]>
  getProject(id: string): Promise<ProjectDetail>
  createProject(input: ProjectInput<"create">): Promise<Project>
  updateProject(input: ProjectInput<"update">): Promise<Project>
  getWorkstream(id: string): Promise<Workstream>
  createWorkstream(input: ProjectInput<"workstreamCreate">): Promise<Workstream>
  updateWorkstream(input: ProjectInput<"workstreamUpdate">): Promise<Workstream>
  createDecision(
    input: ProjectInput<"decisionCreate">
  ): Promise<ProjectDecision>
  updateDecision(
    input: ProjectInput<"decisionUpdate">
  ): Promise<ProjectDecision>
  linkCard(input: ProjectInput<"cardLink">): Promise<unknown>
  unlinkCard(input: ProjectInput<"cardUnlink">): Promise<unknown>
  registerSession(
    input: ProjectInput<"sessionRegister">
  ): Promise<ProjectSession>
  addNote(input: ProjectInput<"noteAdd">): Promise<ProjectEvent>
}
