import { useState } from "react"
import {
  Button,
  InvisibleInput,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@doska/ui-kit"
import { ArrowRightLeft, Hash, MoreHorizontal, Trash2 } from "lucide-react"
import { PageHeader } from "../app/page-header"
import { ConfirmDialog } from "../confirm-dialog"
import { ReorderColumnsModal } from "./reorder-columns/reorder-columns-modal"
import { PrefixModal } from "./prefix-modal"
import type { Column } from "@doska/core/types"

interface IProps {
  title: string
  prefix: string
  takenPrefixes: string[]
  columns: Column[]
  onRename: (name: string) => void
  onRenamePrefix: (prefix: string) => void
  onDelete: () => void
  onReorderColumns: (changed: Column[]) => void
}

export function DeckHeader({
  title,
  prefix,
  takenPrefixes,
  columns,
  onRename,
  onRenamePrefix,
  onDelete,
  onReorderColumns,
}: IProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reorderOpen, setReorderOpen] = useState(false)
  const [prefixOpen, setPrefixOpen] = useState(false)

  return (
    <PageHeader>
      <InvisibleInput
        value={title}
        onCommit={onRename}
        label="Board name"
        className="min-w-40 text-base font-semibold sm:min-w-68"
      />

      <div className="ml-auto flex items-center">
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Board actions"
                className="text-muted-foreground"
              />
            }
          >
            <MoreHorizontal />
          </MenuTrigger>
          <MenuContent>
            <MenuItem onClick={() => setPrefixOpen(true)}>
              <Hash />
              Card prefix
              {prefix && (
                <span className="ml-auto pl-4 font-mono text-muted-foreground">
                  {prefix}
                </span>
              )}
            </MenuItem>
            <MenuItem
              onClick={() => setReorderOpen(true)}
              disabled={columns.length < 2}
            >
              <ArrowRightLeft />
              Reorder columns
            </MenuItem>
            <MenuSeparator className="my-1 h-px" />
            <MenuItem
              onClick={() => setConfirmOpen(true)}
              className="text-destructive"
            >
              <Trash2 />
              Delete board
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete board?"
        description={`"${title}" and all of its columns and cards move to the trash, where they stay restorable for 14 days.`}
        confirmLabel="Delete board"
        onConfirm={onDelete}
      />
      <ReorderColumnsModal
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        columns={columns}
        onReorder={onReorderColumns}
      />
      <PrefixModal
        open={prefixOpen}
        onOpenChange={setPrefixOpen}
        prefix={prefix}
        taken={takenPrefixes}
        onCommit={onRenamePrefix}
      />
    </PageHeader>
  )
}
