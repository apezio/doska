import { useProjectWrite as useCoreProjectWrite } from "@doska/core/mutations"
import type { ProjectWrite } from "@doska/core/projects"
import { notifyConflict, notifyWriteError } from "./notify"

const OPTIONS = { onConflict: notifyConflict, onError: notifyWriteError }

/** A projects write that tells the reader when it lost a race or failed. */
export function useProjectWrite<K extends ProjectWrite>(
  op: K,
  projectId: string | null
) {
  return useCoreProjectWrite(op, projectId, OPTIONS)
}
