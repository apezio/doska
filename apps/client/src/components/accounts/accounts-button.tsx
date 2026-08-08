import { Button } from "@doska/ui-kit"
import { Users } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/hooks"
import { AccountsModal } from "./accounts-modal"

export function AccountsButton() {
  const { isAdmin } = useAuth()
  const [open, setOpen] = useState(false)

  if (!isAdmin) return null

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start gap-2"
        onClick={() => setOpen(true)}
      >
        <Users className="size-4" />
        <span>Accounts</span>
      </Button>
      <AccountsModal open={open} onOpenChange={setOpen} />
    </>
  )
}
