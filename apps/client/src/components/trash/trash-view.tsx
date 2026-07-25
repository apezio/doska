import { useEffect } from "react"
import { purgeExpired } from "@/lib/api/operations"
import { sync } from "@/lib/api/sync"
import { useRestore } from "@/lib/data/mutations"
import { useDashboards, useTrash } from "@/lib/data/queries"
import { Trash } from "./trash"

/**
 * Connects the trash to its data. Like the digest it pulls every board, not
 * just the open one — a tombstone the client never pulled isn't in the trash.
 */
export function TrashView() {
  const { data: dashboards = [] } = useDashboards()
  const { data: entries = [], isPending, error, refetch } = useTrash()
  const { mutate: restore, variables, isPending: isRestoring } = useRestore()

  const boardIds = dashboards.map((d) => d.id).join(",")
  useEffect(() => {
    if (!boardIds) return
    void sync.reconcileBoards(boardIds.split(","))
  }, [boardIds])

  // Opening the trash is the moment stale entries would be visible, so sweep
  // first and re-read whatever the sweep removed.
  useEffect(() => {
    void purgeExpired().then((purged) => {
      if (purged > 0) void refetch()
    })
  }, [refetch])

  return (
    <Trash
      entries={entries}
      isLoading={isPending}
      error={error}
      restoringId={isRestoring ? (variables?.id ?? null) : null}
      onRestore={(entry) => restore({ kind: entry.kind, id: entry.id })}
    />
  )
}
