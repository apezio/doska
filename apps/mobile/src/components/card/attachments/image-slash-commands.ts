import { isRenderableImage } from "@doska/core/attachment-mime"
import type { Attachment } from "@doska/core/types"
import { toAttachmentSrc, type SlashCommand } from "@doska/markdown"

/** Slash commands inserting the card's renderable image attachments as Markdown refs. */
export function imageSlashCommands(attachments: Attachment[]): SlashCommand[] {
  return attachments
    .filter((a) => isRenderableImage(a.mime))
    .map((a) => ({
      id: `attachment-${a.key}`,
      title: a.name,
      hint: "Insert image",
      keywords: ["image", "img", "gif", "photo", "attachment"],
      scope: "inline",
      insert: `![${a.name}](${toAttachmentSrc(a.key)})`,
    }))
}
