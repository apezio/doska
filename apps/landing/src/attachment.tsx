import { Paperclip } from "lucide-react"

/**
 * Stands in for an attached screenshot — the same box a real one gets from
 * `MdImage`, so the layout matches without shipping the image. Spans, not
 * divs: it renders inside the paragraph the image ref sat in.
 */
export function AttachmentPlaceholder({ alt }: { alt: string }) {
  return (
    <>
      <span className="my-4 flex aspect-video items-center justify-center rounded-lg bg-linear-to-br from-primary/15 to-accent">
        <img src="/favicon.svg" alt="" className="size-10 opacity-80" />
      </span>
      <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
        <Paperclip className="size-3" />
        {alt}
      </span>
    </>
  )
}
