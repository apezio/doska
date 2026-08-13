import { useState } from "react"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import type { Board, Dashboard } from "@doska/core/types"
import { byPosition, groupCardsByColumn } from "@doska/core/utils"
import { Column } from "../column/column"
import { AddColumn } from "../column/add-column"
import { DraggableCard } from "../card/draggable-card"
import { BoardView } from "./board-view"
import { DeckHeader } from "./deck-header"
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
  onDragEnd: (result: DropResult) => void
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
  onDragEnd,
}: IProps) {
  const [isDragging, setIsDragging] = useState(false)

  const grouped = groupCardsByColumn(board)

  return (
    <DragDropContext
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(result) => {
        setIsDragging(false)
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
          />
        }
      >
        {grouped.map(({ column, cards }) => {
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
              {cards.map((card, index) => (
                <DraggableCard
                  key={card.id}
                  id={card.id}
                  index={index}
                  showBody={showBody}
                />
              ))}
            </Column>
          )
        })}
        <AddColumn onAdd={onAddColumn} />
      </BoardView>
    </DragDropContext>
  )
}
