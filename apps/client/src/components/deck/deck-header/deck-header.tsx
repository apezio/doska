import { InvisibleInput } from "@doska/ui-kit"
import { PageHeader } from "../../app/page-header"
import { BoardActionsMenu } from "./board-actions-menu"
import { SearchButton } from "./search-button"
import { RowViewButton } from "./row-view-button"
import { ShareButton } from "./share-button"
import { SortMenu } from "./sort-menu"
import type { Column, DashboardView } from "@doska/core/types"

interface IProps {
  boardId: string
  title: string
  columns: Column[]
  sort: string[]
  view: DashboardView
  onRename: (name: string) => void
  onDelete: () => void
  onReorderColumns: (changed: Column[]) => void
  onChangeSort: (sort: string[]) => void
  onChangeView: (view: DashboardView) => void
}

export function DeckHeader({
  boardId,
  title,
  columns,
  sort,
  view,
  onRename,
  onDelete,
  onReorderColumns,
  onChangeSort,
  onChangeView,
}: IProps) {
  return (
    <PageHeader>
      <InvisibleInput
        value={title}
        onCommit={onRename}
        label="Board name"
        className="min-w-40 text-base font-semibold sm:min-w-68"
      />

      <div className="ml-auto flex items-center gap-1">
        <SearchButton boardId={boardId} />
        <RowViewButton view={view} onChangeView={onChangeView} />
        <SortMenu sort={sort} onChangeSort={onChangeSort} />
        <ShareButton boardId={boardId} title={title} />
        <BoardActionsMenu
          title={title}
          columns={columns}
          onDelete={onDelete}
          onReorderColumns={onReorderColumns}
        />
      </div>
    </PageHeader>
  )
}
