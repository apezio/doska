/** Raw HTML, which the renderer does not interpret — showing the source beats
 *  dropping it silently. */
export function MdRawHtml({ value }: { value: string }) {
  return (
    <code className="raw-html rounded-[0.3125rem] border border-border bg-muted/70 px-[0.35em] py-[0.1em] font-mono text-[0.8125em] text-muted-foreground">
      {value}
    </code>
  )
}
