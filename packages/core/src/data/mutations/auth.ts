import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as authApi from "../../api/auth"
import { reconcileIdentity } from "../../api/identity"
import { sync } from "../../api/sync"
import { keys } from "../keys"

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      login,
      password,
    }: {
      login: string
      password: string
    }) => {
      const session = await authApi.login(login, password)
      const wiped = await reconcileIdentity(session.userId)
      return { session, wiped }
    },
    onSuccess: ({ session, wiped }) => {
      qc.setQueryData(keys.session, session)
      if (wiped)
        void qc.resetQueries({
          predicate: (query) => query.queryKey[0] !== keys.session[0],
        })
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
