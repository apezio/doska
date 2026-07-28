import { CardContent, Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import { UpdatesSection } from "./sections/updates"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm">
        <ModalHeader onClose={() => onOpenChange(false)}>Settings</ModalHeader>
        <CardContent className="py-4">
          <UpdatesSection />
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
