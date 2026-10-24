import { useState } from "react"
import type { ProjectDecision } from "@doska/contract"
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
  const { projectId } = useProjectCtx()
  const [resolution, setResolution] = useState("")
  const { mutate: update, isPending } = useProjectWrite(
    "decisionUpdate",
    projectId
  )
  const isDecision = item?.kind === "decision"

  const close = () => {
    setResolution("")
    onClose()
  }

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
                  update(
                    {
                      id: item.id,
                      status: "resolved",
                      resolution: resolution.trim(),
                    },
                    { onSuccess: close }
                  )
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
                <Textarea
                  autoFocus
                  aria-label={isDecision ? "Decision" : "Resolution"}
                  placeholder={
                    isDecision
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
