import { Button, Hint } from "@doska/ui-kit"
import { LoaderCircle, Paperclip } from "lucide-react"
import { useRef } from "react"
import { useUploads } from "@/providers/attachment-upload/attachment-upload-context"

/**
 * Header control that uploads files to the card via the shared upload context.
 * Disabled with a hint when no sync backend is configured.
 */
export function AddAttachmentButton() {
  const { addFiles, busy, error, enabled, disabledReason } = useUploads()
  const inputRef = useRef<HTMLInputElement>(null)

  async function onFiles(files: FileList | null) {
    await addFiles(files)
    if (inputRef.current) inputRef.current.value = ""
  }

  const button = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Attach"
      disabled={!enabled || busy}
      onClick={() => inputRef.current?.click()}
    >
      {busy ? <LoaderCircle className="animate-spin" /> : <Paperclip />}
    </Button>
  )

  // Why the upload cannot happen beats naming a control the icon already
  // hints at.
  const hint = !enabled ? disabledReason : (error ?? null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => void onFiles(e.target.files)}
      />
      <Hint label={hint || "Attach"}>{button}</Hint>
    </>
  )
}
