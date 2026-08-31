import {
  Button,
  Hint,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  type MenuActions,
} from "@doska/ui-kit"
import {
  LocateFixed,
  MoreHorizontal,
  Pencil,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react"
import { useRef } from "react"
import { CopyIdItem } from "../card/menu/copy-id-item"
import { DeadlineSub } from "../card/menu/deadline-sub"
import { MoveToColumnSub } from "../card/menu/move-to-column-sub"
import type { UndoRedoProps } from "./undo-redo-buttons"

interface IProps {
  cardId: string
  isPreview: boolean
  /** Undo/redo, given only where the header has no room for their buttons. */
  history?: UndoRedoProps
  onEdit: () => void
  onReveal: () => void
  onDelete: () => void
}

/**
 * The open card's actions: the same set the board card's menu offers, plus
 * "Reveal on board". Delete goes through the panel's own handler rather than
 * `DeleteItem`, since the panel has to close itself and offer the undo toast.
 */
export function CardPanelMenu({
  cardId,
  isPreview,
  history,
  onEdit,
  onReveal,
  onDelete,
}: IProps) {
  const actionsRef = useRef<MenuActions>(null)

  return (
    <Menu actionsRef={actionsRef}>
      <Hint label="Card actions">
        <MenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Card actions" />
          }
        >
          <MoreHorizontal />
        </MenuTrigger>
      </Hint>
      <MenuContent align="end">
        {history && (
          <>
            <MenuItem onClick={history.onUndo} disabled={!history.canUndo}>
              <Undo2 />
              Undo
            </MenuItem>
            <MenuItem onClick={history.onRedo} disabled={!history.canRedo}>
              <Redo2 />
              Redo
            </MenuItem>
            <MenuSeparator />
          </>
        )}
        {isPreview && (
          <MenuItem onClick={onEdit}>
            <Pencil />
            Edit
          </MenuItem>
        )}
        <MenuItem onClick={onReveal}>
          <LocateFixed />
          Reveal on board
        </MenuItem>
        <MoveToColumnSub cardId={cardId} />
        <DeadlineSub
          cardId={cardId}
          closeMenu={() => actionsRef.current?.close()}
        />
        <CopyIdItem cardId={cardId} />
        <MenuSeparator />
        <MenuItem
          onClick={onDelete}
          className="data-highlighted:text-destructive"
        >
          <Trash2 />
          Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}
