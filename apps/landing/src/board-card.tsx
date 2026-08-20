import { useState, type ReactNode } from "react"
import { taskProgress, toggleTaskByIndex } from "@doska/markdown"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DeadlineChip,
  Markdown,
  TaskIndicator,
} from "@doska/ui-kit"

/**
 * A board card. Same ui-kit slots as the app's card, and the body goes through
 * the app's renderer, so the page shows the real thing rather than a mock-up.
 * The body is state because ticking a task rewrites the markdown, exactly as
 * it does in the app.
 */
export function BoardCard({
  title,
  deadline,
  body,
  lead,
  children,
}: {
  title: string
  /** Fixed dates only — a relative one ("in 3 days") would break prerendering. */
  deadline?: string
  body: string
  /** Rendered above the body — a terminal, a demo. */
  lead?: ReactNode
  children?: ReactNode
}) {
  const [markdown, setMarkdown] = useState(body)
  const tasks = taskProgress(markdown)

  return (
    <Card className="mb-3">
      <CardHeader>
        <CardTitle className="font-bold text-balance">
          <h3>{title}</h3>
        </CardTitle>
      </CardHeader>
      {(tasks.total > 0 || deadline) && (
        <CardContent>
          <div className="mt-2 flex items-center gap-2 text-sm">
            {tasks.total > 0 && (
              <TaskIndicator done={tasks.done} total={tasks.total} />
            )}
            {deadline && <DeadlineChip value={deadline} done={false} />}
          </div>
        </CardContent>
      )}
      <CardContent className="pt-2 text-pretty">
        {lead}
        <Markdown
          onToggleTask={(index) =>
            setMarkdown((md) => toggleTaskByIndex(md, index))
          }
        >
          {markdown}
        </Markdown>
        {children}
      </CardContent>
    </Card>
  )
}
