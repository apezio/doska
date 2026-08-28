import {
  Button,
  Hint,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@doska/ui-kit"
import { CircleCheck, MoreHorizontal, Trash2 } from "lucide-react"
import { ColumnColorSubmenu } from "./column-color"

interface IProps {
  title: string
  color: string
  onChangeColor: (color: string) => void
  done: boolean
  onChangeDone: (done: boolean) => void
  onDelete: () => void
}

/** The column's rarely-reached actions, behind a ⋯ in its header. */
export function ColumnMenu({
  title,
  color,
  onChangeColor,
  done,
  onChangeDone,
  onDelete,
}: IProps) {
  return (
    <Menu>
      <Hint label={`${title} actions`}>
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={`${title} actions`}
            />
          }
        >
          <MoreHorizontal />
        </MenuTrigger>
      </Hint>
      <MenuContent>
        <ColumnColorSubmenu color={color} onChange={onChangeColor} />
        <MenuItem onClick={() => onChangeDone(!done)}>
          <CircleCheck />
          {done ? "Unmark cards as done" : "Mark cards as done"}
        </MenuItem>
        <MenuSeparator className="my-1 h-px" />
        <MenuItem onClick={onDelete} className="text-destructive">
          <Trash2 />
          Delete column
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}
