import { CardContent, cn, InvisibleInput } from "@doska/ui-kit"
import { Loader2, X } from "lucide-react"
import type { Attachment } from "@doska/core/types"
import { AttachmentTile } from "./attachment-tile"

function splitName(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf(".")
  return dot >= 0
    ? { base: name.slice(0, dot), ext: name.slice(dot) }
    : { base: name, ext: "" }
}

interface IProps {
  attachments: Attachment[]
  /** Resolved URLs by attachment key; a missing entry just shows the file icon. */
  urls: Record<string, string>
  onOpen: (attachment: Attachment) => void
  /** Omit to make the list read-only — the name stops being editable. */
  onRename?: (id: string, name: string) => void
  /** Omit to drop the remove button. */
  onRemove?: (attachment: Attachment) => void
  /** Uploads still in flight, shown greyed at the end. */
  pending?: { id: string; name: string }[]
  error?: string
  className?: string
}

const NO_PENDING: { id: string; name: string }[] = []

/** A card's attachments as a list of named tiles. */
export function AttachmentList({
  attachments,
  urls,
  onOpen,
  onRename,
  onRemove,
  pending = NO_PENDING,
  error,
  className,
}: IProps) {
  if (!attachments.length && !pending.length) return null

  return (
    <CardContent className={className}>
      <div className="flex flex-col items-start">
        {attachments.map((att) => {
          const { base, ext } = splitName(att.name)
          return (
            <div
              key={att.id}
              className="group/item flex items-center gap-1 rounded-md py-0.5"
            >
              <div
                className="flex flex-1 cursor-pointer items-center"
                onClick={(e) => {
                  if (onRename) return
                  onOpen(att)
                  e.stopPropagation()
                }}
              >
                <AttachmentTile
                  attachment={att}
                  src={urls[att.key] ?? null}
                  className="size-6 shrink-0"
                  onOpen={onRename ? () => onOpen(att) : undefined}
                />
                {onRename ? (
                  <>
                    <InvisibleInput
                      value={base}
                      onCommit={(next) => onRename(att.id, next + ext)}
                      label="Attachment name"
                      placeholder="name"
                      title="Click to rename"
                      allowEmpty
                      className="ml-1 block shrink-0 text-sm"
                    />
                    {ext && (
                      <span className="shrink-0 text-sm text-muted-foreground">
                        {ext}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="line-clamp-1 px-2 text-sm text-muted-foreground group-hover/item:text-foreground">
                    {att.name}
                  </span>
                )}
              </div>
              {error && (
                <div className="ml-2 text-sm text-destructive">{error}</div>
              )}
              {onRemove && (
                <button
                  type="button"
                  aria-label="Remove attachment"
                  onClick={() => onRemove(att)}
                  className={cn(
                    "mt-0.5 ml-2 shrink-0 rounded p-1 text-muted-foreground",
                    "hover:text-destructive"
                  )}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )
        })}
        {pending.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-1 rounded-md py-0.5 opacity-60"
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-sm border">
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            </div>
            <span className="ml-1 truncate text-sm text-muted-foreground">
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </CardContent>
  )
}
