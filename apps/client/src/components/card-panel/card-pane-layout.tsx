import { CardContent } from "@doska/ui-kit"
import type { ReactNode } from "react"
import { CardContentLayout } from "./card-content-layout"

interface IProps {
  header: ReactNode
  /** Card id, task progress, deadline — and the column beside them. */
  meta: ReactNode
  attachments: ReactNode
  title: ReactNode
  body: ReactNode
  /** Fired by clicking the body, where clicking it starts an edit. */
  onClickBody?: (e: React.MouseEvent) => void
}

/** How a card reads in the panel, whether or not it can be edited there. */
export function CardPaneLayout({
  header,
  meta,
  attachments,
  title,
  body,
  onClickBody,
}: IProps) {
  return (
    <>
      {header}
      <CardContentLayout>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2">
          {meta}
        </CardContent>
        {attachments}
        <CardContent
          className="flex min-h-0 flex-1 flex-col px-4 pt-2"
          onClick={onClickBody}
        >
          {title}
          {body}
        </CardContent>
      </CardContentLayout>
    </>
  )
}
