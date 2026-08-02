import { DEFAULT_SLASH_COMMANDS, toAttachmentSrc, cut } from "@doska/markdown"
import { useMemo } from "react"
import { useCard } from "@doska/core/queries"
import { imageSlashCommands } from "../card/attachments/image-slash-commands"
import { isRenderableImage } from "../card/attachments/renderable-image"
import { useUploads } from "../card/attachments/context/attachment-upload-context"
import { CardMarkdown } from "../card/card-markdown"
import { Markdown, MarkdownTextarea } from "../markdown"
import { useCardRefOptions } from "../card/refs/use-card-refs"

const PREVIEW_MARKERS = [cut]

interface IProps {
  cardId: string
  body: string
  isPreview: boolean
  onChangeBody: (value: string) => void
  /** Non-scrolling pane element the mobile slash button anchors to. */
  overlayContainer?: HTMLElement | null
}

/** Card body textarea wired to attachments. Must render inside `AttachmentUploadProvider`. */
export function CardBodyEditor({
  cardId,
  body,
  isPreview,
  onChangeBody,
  overlayContainer,
}: IProps) {
  const { data: card } = useCard(cardId)
  const { addFiles } = useUploads()
  const cardRefs = useCardRefOptions(cardId)
  const attachments = card?.attachments

  const slashCommands = useMemo(
    () => [...DEFAULT_SLASH_COMMANDS, ...imageSlashCommands(attachments ?? [])],
    [attachments]
  )

  async function handlePasteFiles(files: File[]): Promise<string | null> {
    const added = await addFiles(files)
    const refs = added
      .filter((a) => isRenderableImage(a.mime))
      .map((a) => `![${a.name}](${toAttachmentSrc(a.key)})`)
    return refs.length ? refs.join("\n") : null
  }

  return (
    <CardMarkdown cardId={cardId}>
      <MarkdownTextarea
        renderPreview={Markdown}
        value={body}
        onChange={(e) => onChangeBody(e.target.value)}
        onChangeValue={onChangeBody}
        onToggleTask={onChangeBody}
        slashMenu
        slashCommands={slashCommands}
        overlayContainer={overlayContainer}
        wikilinks={cardRefs}
        onPasteFiles={handlePasteFiles}
        placeholder="Notes"
        isPreview={isPreview}
        markers={PREVIEW_MARKERS}
        className="min-h-[50vh] shrink-0 resize-none"
        containerClassName="flex-1"
      />
    </CardMarkdown>
  )
}
