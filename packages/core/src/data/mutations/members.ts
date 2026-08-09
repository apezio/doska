import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as membersApi from "../../api/members"
import { keys } from "../keys"

function useRefetchMembers(boardId: string) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: keys.members(boardId) })
}

export function useAddMember(boardId: string) {
  const refetch = useRefetchMembers(boardId)
  return useMutation({
    mutationFn: (userId: string) => membersApi.addMember(boardId, userId),
    onSuccess: refetch,
  })
}

export function useRemoveMember(boardId: string) {
  const refetch = useRefetchMembers(boardId)
  return useMutation({
    mutationFn: (userId: string) => membersApi.removeMember(boardId, userId),
    onSuccess: refetch,
  })
}
