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

export function BoardCard({
  title,
  deadline,
  body,
  children,
}: {
  title: string

  deadline?: string
  body: string
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
