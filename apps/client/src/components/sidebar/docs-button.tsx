import { Button } from "@doska/ui-kit"
import { BookOpen } from "lucide-react"

/** Sidebar entry linking to the documentation site. */
export function DocsButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="justify-start gap-2"
      render={
        <a href="https://doska.sh/docs" target="_blank" rel="noreferrer" />
      }
    >
      <BookOpen className="size-4" />
      <span>Docs</span>
    </Button>
  )
}
