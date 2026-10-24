import type { ProjectDetail, ProjectSummary } from "@doska/contract"
import { ORPCError } from "@orpc/client"
import { orpc } from "./sync/orpc"

type Rpc = typeof orpc.projects

/** Every projects RPC that changes something. */
export type ProjectWrite = Exclude<keyof Rpc, "list" | "get">
export type ProjectWriteInput<K extends ProjectWrite> = Parameters<Rpc[K]>[0]
export type ProjectWriteResult<K extends ProjectWrite> = Awaited<
  ReturnType<Rpc[K]>
>

export function listProjects(): Promise<ProjectSummary[]> {
  return orpc.projects.list()
}

export function getProject(id: string): Promise<ProjectDetail> {
  return orpc.projects.get({ id })
}

export function writeProject<K extends ProjectWrite>(
  op: K,
  input: ProjectWriteInput<K>
): Promise<ProjectWriteResult<K>> {
  const call = orpc.projects[op] as (
    input: ProjectWriteInput<K>
  ) => Promise<ProjectWriteResult<K>>
  return call(input)
}

/** A write refused because the record moved on since it was read. */
export function isConflict(
  err: unknown
): err is ORPCError<"CONFLICT", unknown> {
  return err instanceof ORPCError && err.code === "CONFLICT"
}

/** The version a refused write found, to retry against on purpose. */
export function conflictVersion(err: unknown): number | null {
  if (!isConflict(err)) return null
  const current = (err.data as { current?: { version?: unknown } } | undefined)
    ?.current
  return typeof current?.version === "number" ? current.version : null
}

/** Retrying a project the server will not show only delays the answer. */
export function isGone(err: unknown): boolean {
  return err instanceof ORPCError && (err.status === 403 || err.status === 404)
}
