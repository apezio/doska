import { Paperclip } from "lucide-react"

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
