import { useState } from "react"
import type { ProjectDecision } from "@doska/contract"
import { decisionOptions, isLive } from "@doska/core/projects"
import {
  Button,
  Markdown,
  Modal,
  ModalContent,
  ModalContentCentered,
  ModalHeader,
  Textarea,
} from "@doska/ui-kit"
import { useProjectWrite } from "../shared/use-project-write"
import { useProjectCtx } from "./project-context"

interface IProps {
  item: ProjectDecision | null
  onClose: () => void
}

/** Closes a decision or blocker with the answer, which the log keeps. */
export function ResolveModal({ item, onClose }: IProps) {
  const { projectId, sessionById, openChat } = useProjectCtx()
  const [resolution, setResolution] = useState("")
  const { mutate: update, isPending } = useProjectWrite(
    "decisionUpdate",
    projectId
  )
  const isDecision = item?.kind === "decision"
  const options = item && isDecision ? decisionOptions(item.body) : []

  const close = () => {
    setResolution("")
    onClose()
  }

  // The session that asked hears on its next Doska call; a live one may be
  // waiting on the answer, so its chat opens and is told now.
  const resolve = (decision: ProjectDecision, text: string) =>
    update(
      { id: decision.id, status: "resolved", resolution: text.trim() },
      {
        onSuccess: () => {
          close()
          const asker = decision.sessionId
            ? sessionById.get(decision.sessionId)
            : undefined
          if (asker?.chatUrl && isLive(asker.lastActivityAt))
            openChat(
              asker.id,
              `[Doska] ${decision.kind === "blocker" ? "Blocker" : "Decision"} ` +
                `resolved: ${decision.title} → ${text.trim()}`
            )
        },
      }
    )

  return (
    <Modal open={item !== null} onOpenChange={(open) => !open && close()}>
      <ModalContent className="md:max-w-lg">
        {item && (
          <>
            <ModalHeader onClose={close}>
              {isDecision ? "Record the decision" : "Resolve the blocker"}
            </ModalHeader>
            <ModalContentCentered className="md:px-3 md:pb-3">
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  resolve(item, resolution)
                }}
              >
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">{item.title}</p>
                  {item.body.trim() && (
                    <Markdown className="max-h-48 overflow-y-auto text-sm text-muted-foreground">
                      {item.body}
                    </Markdown>
                  )}
                </div>
                {options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {options.map((option, i) => (
                      <Button
                        key={i}
                        type="button"
                        variant="secondary"
                        disabled={isPending}
                        onClick={() => resolve(item, `${i + 1}. ${option}`)}
                      >
                        <span className="text-muted-foreground">{i + 1}</span>
                        {option}
                      </Button>
                    ))}
                  </div>
                )}
                <Textarea
                  autoFocus={options.length === 0}
                  aria-label={isDecision ? "Decision" : "Resolution"}
                  placeholder={
                    options.length
                      ? "Or answer in words"
                      : isDecision
                        ? "What you decided, and why"
                        : "What unblocked it"
                  }
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
                <div className="flex justify-end gap-1.5">
                  <Button type="button" variant="ghost" onClick={close}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isDecision ? "Record decision" : "Mark resolved"}
                  </Button>
                </div>
              </form>
            </ModalContentCentered>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
