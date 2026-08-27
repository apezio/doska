import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "../../api/operations"
import type { Dashboard } from "../../types"
import type { DashboardMove } from "../../utils/dashboard-tree"
import { applyMove } from "../../utils/dashboard-tree"
import { pushUndo } from "../../undo"
import { keys } from "../keys"
import { flushSyncUpdate } from "./flush-sync"

export function useCreateDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.createDashboard(name),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

export function useRenameDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.renameDashboard(id, name),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

export function useSetDashboardSort() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, sort }: { id: string; sort: string[] }) =>
      api.setDashboardSort(id, sort),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

export function useMoveDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (move: DashboardMove) => api.moveDashboard(move),
    // Synchronous and flushed, like the board drag handlers: @hello-pangea/dnd
    // has to see the reordered sidebar before the drop event returns, or the
    // row animates back to its old slot and only jumps once the write settles.
    onMutate: (move: DashboardMove) => {
      const previous = qc.getQueryData<Dashboard[]>(keys.dashboards)
      if (previous) {
        const next = applyMove(previous, move)
        flushSyncUpdate(() => qc.setQueryData(keys.dashboards, next))
      }
      return { previous }
    },
    onError: (_err, _move, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.dashboards, ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

export function useDeleteDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteDashboard(id),
    onSuccess: (_data, id) => pushUndo("dashboards", id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.dashboards })
      qc.invalidateQueries({ queryKey: keys.digest })
      qc.invalidateQueries({ queryKey: keys.trash })
    },
  })
}
