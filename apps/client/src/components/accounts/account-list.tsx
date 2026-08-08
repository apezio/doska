import { useAccounts } from "@doska/core/queries"
import { useAuth } from "@/lib/hooks"
import { AccountRow } from "./account-row"
import { CreateAccountForm } from "./create-account-form"

/**
 * Who can sign in to this server.
 */
export function AccountList() {
  const { userId, isAdmin } = useAuth()
  const { data: accounts, isPending, error } = useAccounts(isAdmin)

  return (
    <div className="flex flex-col gap-3">
      {isPending && (
        <p className="text-xs text-muted-foreground">Loading accounts…</p>
      )}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
      {accounts && (
        <ul className="flex flex-col">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              isSelf={account.id === userId}
            />
          ))}
        </ul>
      )}
      <CreateAccountForm />
    </div>
  )
}
