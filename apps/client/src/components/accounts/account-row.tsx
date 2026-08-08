import { Button } from "@doska/ui-kit"
import { useState } from "react"
import { useSetAccountActive } from "@doska/core/mutations"
import type { Account } from "@doska/core/queries"
import { AccountTag } from "./account-tag"
import { ResetPasswordForm } from "./reset-password-form"

interface IProps {
  account: Account
  isSelf: boolean
}

export function AccountRow({ account, isSelf }: IProps) {
  const [resetting, setResetting] = useState(false)
  const setActive = useSetAccountActive()

  return (
    <li className="flex flex-col gap-2 border-b border-muted py-2 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="truncate text-sm">{account.login}</span>
        {account.isAdmin && <AccountTag>Owner</AccountTag>}
        {!account.active && <AccountTag>Inactive</AccountTag>}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setResetting((open) => !open)}
          >
            {resetting ? "Cancel" : "Reset password"}
          </Button>
          {!isSelf && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={setActive.isPending}
              onClick={() =>
                setActive.mutate({ id: account.id, active: !account.active })
              }
            >
              {account.active ? "Deactivate" : "Activate"}
            </Button>
          )}
        </div>
      </div>
      {setActive.error && (
        <p className="text-xs text-destructive">{setActive.error.message}</p>
      )}
      {resetting && (
        <ResetPasswordForm id={account.id} onDone={() => setResetting(false)} />
      )}
    </li>
  )
}
