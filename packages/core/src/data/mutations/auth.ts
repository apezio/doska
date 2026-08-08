import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as authApi from "../../api/auth"
import { sync } from "../../api/sync"
import { keys } from "../keys"

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ login, password }: { login: string; password: string }) =>
      authApi.login(login, password),
    onSuccess: (session) => {
      qc.setQueryData(keys.session, session)
      void sync.reconcile()
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.setQueryData(keys.session, authApi.SIGNED_OUT)
      qc.removeQueries({ queryKey: keys.accounts })
    },
  })
}
