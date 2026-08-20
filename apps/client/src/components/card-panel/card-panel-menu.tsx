import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@doska/ui-kit"
import { LocateFixed, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { CopyIdItem } from "../card/menu/copy-id-item"
import { DeadlineSub } from "../card/menu/deadline-sub"
import { MoveToColumnSub } from "../card/menu/move-to-column-sub"
import { PrioritySub } from "../card/menu/priority-sub"

interface IProps {
  cardId: string
  isPreview: boolean
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
  onEdit,
  onReveal,
  onDelete,
}: IProps) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Card actions" />
        }
      >
        <MoreHorizontal />
      </MenuTrigger>
      <MenuContent align="end">
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
        <PrioritySub cardId={cardId} />
        <DeadlineSub cardId={cardId} />
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
