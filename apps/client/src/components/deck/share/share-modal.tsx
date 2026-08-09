import { CardContent, Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import { ShareRoster } from "./share-roster"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
  title: string
}

/**
 * Who a board is shared with, and — for its owner — the controls to change
 * that.
 */
export function ShareModal({ open, onOpenChange, boardId, title }: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-lg">
        <ModalHeader onClose={() => onOpenChange(false)}>Share</ModalHeader>
        <CardContent className="overflow-y-auto py-4">
          <ShareRoster boardId={boardId} title={title} />
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
