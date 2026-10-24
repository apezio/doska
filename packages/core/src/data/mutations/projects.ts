import type { ProjectDetail, Workstream } from "@doska/contract"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  isConflict,
  writeProject,
  type ProjectWrite,
  type ProjectWriteInput,
  type ProjectWriteResult,
} from "../../api/projects"
import { keys } from "../keys"

interface Options {
  /** The write lost a race; the project has already been refetched. */
  onConflict?: () => void
  onError?: (err: Error) => void
}

/** Built when the write runs, from the detail as it then stands. */
type BuildInput<K extends ProjectWrite> = (
  detail: ProjectDetail | undefined
) => ProjectWriteInput<K>
type Input<K extends ProjectWrite> = ProjectWriteInput<K> | BuildInput<K>

/**
 * One projects RPC as a mutation. Writes to one project run one at a time and
 * each result goes into the cached detail before the next starts, so a quick
 * second edit — built from a function input — sees the first one's list and
 * `version` instead of tripping a conflict with it.
 */
export function useProjectWrite<K extends ProjectWrite>(
  op: K,
  projectId: string | null,
  { onConflict, onError }: Options = {}
) {
  const qc = useQueryClient()

  const refetch = () => {
    qc.invalidateQueries({ queryKey: keys.projects, exact: true })
    if (projectId) qc.invalidateQueries({ queryKey: keys.project(projectId) })
  }

  const build = (input: BuildInput<K>) =>
    input(
      projectId
        ? qc.getQueryData<ProjectDetail>(keys.project(projectId))
        : undefined
    )

  return useMutation({
    scope: projectId ? { id: `project:${projectId}` } : undefined,
    mutationFn: (input: Input<K>) =>
      writeProject(
        op,
        typeof input === "function"
          ? build(input as BuildInput<K>)
          : (input as ProjectWriteInput<K>)
      ),
    onSuccess: (result: ProjectWriteResult<K>) => {
      if (projectId && op === "remove")
        qc.removeQueries({ queryKey: keys.project(projectId) })
      else if (projectId) {
        qc.setQueryData<ProjectDetail>(keys.project(projectId), (detail) =>
          detail ? merge(detail, op, result) : detail
        )
      }
      refetch()
    },
    onError: (err) => {
      if (!isConflict(err)) return onError?.(err)
      refetch()
      onConflict?.()
    },
  })
}

function merge(
  detail: ProjectDetail,
  op: ProjectWrite,
  result: unknown
): ProjectDetail {
  if (op === "update")
    return { ...detail, project: result as ProjectDetail["project"] }
  if (op === "workstreamUpdate") {
    const next = result as Workstream
    return {
      ...detail,
      workstreams: detail.workstreams.map((w) => (w.id === next.id ? next : w)),
    }
  }
  return detail
}
