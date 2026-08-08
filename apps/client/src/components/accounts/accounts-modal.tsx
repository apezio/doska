import { CardContent, Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import { AccountList } from "./account-list"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountsModal({ open, onOpenChange }: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-lg">
        <ModalHeader onClose={() => onOpenChange(false)}>Accounts</ModalHeader>
        <CardContent className="overflow-y-auto py-4">
          <AccountList />
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
