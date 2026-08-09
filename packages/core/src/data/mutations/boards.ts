import { useMutation, useQueryClient } from "@tanstack/react-query"
import { publishBoard, unpublishBoard } from "../../api/boards"
import { keys } from "../keys"

/** Both writes change what `usePublicBoardStatus` would answer, and nothing
 * else — the board record itself does not carry the token. */
function useRefetchStatus(boardId: string) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: keys.publicStatus(boardId) })
}

export function usePublishBoard(boardId: string) {
  const refetch = useRefetchStatus(boardId)
  return useMutation({
    mutationFn: () => publishBoard(boardId),
    onSuccess: refetch,
  })
}

export function useUnpublishBoard(boardId: string) {
  const refetch = useRefetchStatus(boardId)
  return useMutation({
    mutationFn: () => unpublishBoard(boardId),
    onSuccess: refetch,
  })
}
