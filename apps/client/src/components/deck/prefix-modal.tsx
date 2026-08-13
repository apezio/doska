import { useState } from "react"
import {
  Button,
  Modal,
  ModalContent,
  ModalContentCentered,
  ModalDescription,
  ModalTitle,
  cn,
} from "@doska/ui-kit"
import { normalizePrefix, validatePrefix } from "@doska/core/operations"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefix: string
  /** Other live boards' prefixes, for the uniqueness check. */
  taken: string[]
  onCommit: (prefix: string) => void
}

/**
 * Edits the board's card-id prefix (the `ROAD` in `ROAD-12`). A prefix another
 * board uses is rejected: `PREFIX-N` has to be unambiguous.
 */
export function PrefixModal({
  open,
  onOpenChange,
  prefix,
  taken,
  onCommit,
}: IProps) {
  const [draft, setDraft] = useState(prefix)
  const [error, setError] = useState<string | null>(null)
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(prefix)
      setError(null)
    }
  }

  function commit() {
    const { prefix: next, error: invalid } = validatePrefix(draft, prefix, taken)
    if (next === null) {
      setError(invalid)
      return
    }
    if (next !== prefix) onCommit(next)
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm md:p-6">
        <ModalContentCentered>
          <ModalTitle>Card prefix</ModalTitle>
          <ModalDescription>
            Every card on this board is numbered {draft || "PREFIX"}-1,{" "}
            {draft || "PREFIX"}-2, and so on.
          </ModalDescription>
          <input
            value={draft}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={6}
            aria-label="Board prefix"
            aria-invalid={!!error}
            onChange={(e) => {
              setDraft(normalizePrefix(e.target.value))
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit()
            }}
            className={cn(
              "mt-4 w-full rounded-sm bg-secondary px-2 py-1 font-mono text-base uppercase outline-none",
              error && "ring-1 ring-destructive"
            )}
          />
          {error && (
            <span role="alert" className="mt-1 text-sm text-destructive">
              {error}
            </span>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={commit}>Save</Button>
          </div>
        </ModalContentCentered>
      </ModalContent>
    </Modal>
  )
}
