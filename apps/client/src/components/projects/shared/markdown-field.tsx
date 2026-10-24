import { useState, type ReactNode } from "react"
import { Pencil } from "lucide-react"
import { conflictVersion } from "@doska/core/projects"
import {
  Button,
  cn,
  Hint,
  Input,
  Markdown,
  shortcutLabel,
  Textarea,
} from "@doska/ui-kit"

interface IProps {
  value: string
  /** The record's version; an edit is saved against the one it started from. */
  version: number
  /** `why` is only asked for when `askWhy` is set; empty when skipped. */
  onSave: (next: string, why: string, ifVersion: number) => Promise<unknown>
  /** Accessible name, e.g. "Summary". */
  label: string
  /** Shown in place of an empty value — say what belongs here. */
  empty: ReactNode
  askWhy?: boolean
  className?: string
  markdownClassName?: string
}

interface Draft {
  text: string
  why: string
  /** The version the text was written against. */
  base: number
  /** A save was refused: the value changed under the draft. */
  conflicted: boolean
}

/**
 * Markdown that flips to a textarea; ⌘/Ctrl+Enter saves, Escape cancels. A
 * save that loses a race keeps the draft open beside the newer text, so
 * nothing typed is lost and the next save is a deliberate overwrite.
 */
export function MarkdownField({
  value,
  version,
  onSave,
  label,
  empty,
  askWhy,
  className,
  markdownClassName,
}: IProps) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)

  const start = () =>
    setDraft({ text: value, why: "", base: version, conflicted: false })
  const cancel = () => setDraft(null)
  const edit = (fields: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...fields } : d))

  const save = async () => {
    if (!draft || saving) return
    if (draft.text === value && !draft.conflicted) return cancel()
    setSaving(true)
    try {
      await onSave(draft.text, draft.why.trim(), draft.base)
      setDraft(null)
    } catch (err) {
      // The refetch showing the newer text is already on its way.
      const current = conflictVersion(err)
      if (current !== null) edit({ conflicted: true, base: current })
    } finally {
      setSaving(false)
    }
  }

  if (draft)
    return (
      <form
        className={cn("flex flex-col gap-2", className)}
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation()
            cancel()
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            void save()
          }
        }}
      >
        {draft.conflicted && (
          <div className="flex flex-col gap-2 rounded-lg bg-amber-500/10 p-3">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              This changed while you were editing. The current text is below;
              saving replaces it with yours.
            </p>
            {value.trim() ? (
              <Markdown className="max-h-56 overflow-y-auto text-sm">
                {value}
              </Markdown>
            ) : (
              <p className="text-sm text-muted-foreground">It is now empty.</p>
            )}
          </div>
        )}
        <Textarea
          aria-label={label}
          autoFocus
          value={draft.text}
          onChange={(e) => edit({ text: e.target.value })}
          className="max-h-[60svh] min-h-28 leading-relaxed"
        />
        {askWhy && (
          <Input
            aria-label="Why it changed"
            placeholder="Why it changed (kept in the activity log)"
            value={draft.why}
            onChange={(e) => edit({ why: e.target.value })}
          />
        )}
        <div className="flex items-center gap-1.5">
          <Button type="submit" size="sm" disabled={saving}>
            {draft.conflicted ? "Replace with mine" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={cancel}>
            {draft.conflicted ? "Keep theirs" : "Cancel"}
          </Button>
          <span className="ml-auto text-xs text-muted-foreground max-md:hidden">
            Markdown, {shortcutLabel("Enter")} to save
          </span>
        </div>
      </form>
    )

  if (!value.trim())
    return (
      <button
        type="button"
        onClick={start}
        className={cn(
          "w-full rounded-lg border border-dashed px-3 py-2.5 text-left",
          "text-sm text-muted-foreground transition-colors",
          "hover:border-foreground/25 hover:text-foreground",
          className
        )}
      >
        {empty}
      </button>
    )

  return (
    <div className={cn("group/field relative", className)}>
      <Markdown className={cn("pr-8", markdownClassName)}>{value}</Markdown>
      <Hint label={`Edit ${label.toLowerCase()}`}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${label.toLowerCase()}`}
          onClick={start}
          className={cn(
            "absolute top-0 right-0 text-muted-foreground",
            "md:opacity-0 md:group-hover/field:opacity-100 md:focus-visible:opacity-100"
          )}
        >
          <Pencil />
        </Button>
      </Hint>
    </div>
  )
}
