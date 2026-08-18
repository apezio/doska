import { useLocalSearchParams } from "expo-router"
import { AttachmentViewer } from "@/components/card/attachments/attachment-viewer"

export default function AttachmentScreen() {
  const { id, attachmentId } = useLocalSearchParams<{
    id: string
    attachmentId: string
  }>()
  if (!id || !attachmentId) return null

  return <AttachmentViewer cardId={id} attachmentId={attachmentId} />
}
