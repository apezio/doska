import { useState } from "react"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import type { Board, Dashboard } from "@doska/core/types"
import { byPosition, groupCardsByColumn, sortCards } from "@doska/core/utils"
import type { CardPatch } from "@doska/core/mutations"
import { useLandingSlot } from "@/lib/hooks"
import { Column } from "../column/column"
import { AddColumn } from "../column/add-column"
import { DraggableCard } from "../card/draggable-card"
import { BoardView } from "./board-view"
import { DragStateProvider } from "./drag-state"
import { DeckHeader } from "./deck-header/deck-header"
import { SyncIndicator } from "./sync-indicator"

interface IProps {
  dashboard: Dashboard
  board: Board
  isLoading: boolean
  onToggleBody: (columnId: string, collapsed: boolean) => void
  onAddCard: (columnId: string) => void
  onAddColumn: () => void
  onReorderColumns: (changed: Board["columns"]) => void
  onChangeColumnColor: (columnId: string, color: string) => void
  onChangeColumnDone: (columnId: string, done: boolean) => void
  onRenameColumn: (columnId: string, title: string) => void
  onDeleteColumn: (columnId: string) => void
  onRenameDashboard: (name: string) => void
  onRenameDashboardPrefix: (prefix: string) => void
  takenPrefixes: string[]
  onDeleteDashboard: () => void
  onChangeSort: (sort: string[]) => void
  onDragEnd: (result: DropResult) => void
  onPatchCard: (id: string, patch: CardPatch) => void
}

export function Deck({
  dashboard,
  board,
  isLoading,
  onToggleBody,
  onAddCard,
  onAddColumn,
  onReorderColumns,
  onChangeColumnColor,
  onChangeColumnDone,
  onRenameColumn,
  onDeleteColumn,
  onRenameDashboard,
  onRenameDashboardPrefix,
  takenPrefixes,
  onDeleteDashboard,
  onChangeSort,
  onDragEnd,
  onPatchCard,
}: IProps) {
  const [isDragging, setIsDragging] = useState(false)

  const grouped = groupCardsByColumn(board)
  const sort = dashboard.sort ?? []
  const { hold, release, place } = useLandingSlot(sort.length > 0)

  return (
    <DragStateProvider value={isDragging}>
      <DragDropContext
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(result) => {
          setIsDragging(false)
          hold(result)
          onDragEnd(result)
        }}
      >
        <BoardView
          isLoading={isLoading}
          isDragging={isDragging}
          footer={<SyncIndicator />}
          header={
            <DeckHeader
              boardId={dashboard.id}
              title={dashboard.title}
              prefix={dashboard.prefix ?? ""}
              takenPrefixes={takenPrefixes}
              onRename={onRenameDashboard}
              onRenamePrefix={onRenameDashboardPrefix}
              onDelete={onDeleteDashboard}
              columns={[...board.columns].sort(byPosition)}
              onReorderColumns={onReorderColumns}
              sort={sort}
              onChangeSort={onChangeSort}
            />
          }
        >
          {grouped.map(({ column, cards }) => {
            const ordered = place(sortCards(cards, sort), column.id)
            const showBody = !column.collapsed
            return (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                showBody={showBody}
                onToggleBody={() => onToggleBody(column.id, showBody)}
                onAddCard={() => onAddCard(column.id)}
                onRename={(title) => onRenameColumn(column.id, title)}
                onChangeColor={(color) => onChangeColumnColor(column.id, color)}
                done={column.done}
                onChangeDone={(done) => onChangeColumnDone(column.id, done)}
                onDelete={() => onDeleteColumn(column.id)}
              >
                {ordered.map((card, index) => (
                  <DraggableCard
                    key={card.id}
                    card={card}
                    column={column}
                    index={index}
                    showBody={showBody}
                    onPatch={onPatchCard}
                    onDropSettled={release}
                  />
                ))}
              </Column>
            )
          })}
          <AddColumn onAdd={onAddColumn} />
        </BoardView>
      </DragDropContext>
    </DragStateProvider>
  )
}
