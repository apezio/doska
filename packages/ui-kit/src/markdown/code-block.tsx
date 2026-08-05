export function MdCodeBlock({
  value,
  lang,
}: {
  value: string
  lang?: string | null
}) {
  return (
    <pre className="my-2.5 overflow-x-auto rounded-lg border border-border bg-muted/60 px-3.5 py-3 leading-normal">
      <code
        className={`font-mono text-[0.8125rem] ${lang ? `language-${lang}` : ""}`}
      >
        {value}
      </code>
    </pre>
  )
}
