import {
  Button,
  Modal,
  ModalContent,
  ModalContentCentered,
  ModalDescription,
  ModalTitle,
} from "@doska/ui-kit"
import { DoneColumnDemo } from "./done-column-demo"
import { DoneColumnPicker } from "./done-column-picker"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
  onOpenBoard: () => void
}

export function DoneColumnHelp({
  open,
  onOpenChange,
  boardId,
  onOpenBoard,
}: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md md:p-6">
        <ModalContentCentered className="gap-4">
          <div className="flex flex-col gap-2">
            <ModalTitle>Ticking cards off needs a done column</ModalTitle>
            <ModalDescription>
              Marking a card done moves it to its board's done column, so a
              board without one has nowhere to put it.
            </ModalDescription>
          </div>

          <DoneColumnDemo />

          <DoneColumnPicker
            boardId={boardId}
            onPicked={() => onOpenChange(false)}
          />

          <p className="text-sm text-muted-foreground">
            You can change this later from the column's ⋯ menu on the board.
          </p>

          <div className="mt-1 flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={onOpenBoard}>
              Open board
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Not now
            </Button>
          </div>
        </ModalContentCentered>
      </ModalContent>
    </Modal>
  )
}
