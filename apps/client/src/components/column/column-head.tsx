import { useState } from "react"
import { Button, cn, InvisibleInput } from "@doska/ui-kit"
import { CircleCheck, Eye, EyeOff } from "lucide-react"
import { ConfirmDialog } from "../confirm-dialog"
import { ColumnSwatch } from "./column-swatch"
import { ColumnMenu } from "./column-menu"

interface IProps {
  title: string
  color: string
  showBody: boolean
  onToggleBody: () => void
  onRename: (title: string) => void
  onChangeColor: (color: string) => void
  done: boolean
  onChangeDone: (done: boolean) => void
  onDelete: () => void
}

export function ColumnHead({
  onToggleBody,
  onRename,
  onChangeColor,
  done,
  onChangeDone,
  onDelete,
  showBody,
  title,
  color,
}: IProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex h-15 shrink-0 items-center justify-between gap-2 px-4 py-3 md:px-0",
        "bg-background/80 backdrop-blur-xs",
        "text-muted-foreground"
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <ColumnSwatch color={color} labelled className="ml-1" />
        <InvisibleInput
          value={title}
          onCommit={onRename}
          label={`Rename ${title}`}
          className="uppercase"
          title="Click to rename"
        />
        {/* The only place the flag shows — its toggle lives in the menu. */}
        {done && (
          <CircleCheck
            aria-label={`${title} is the done column`}
            className="size-4 shrink-0 text-emerald-600/50 dark:text-emerald-500/50"
          />
        )}
      </div>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon-lg"
          aria-pressed={showBody}
          aria-label={
            showBody ? `Hide body in ${title}` : `Show body in ${title}`
          }
          onClick={onToggleBody}
        >
          {showBody ? <EyeOff /> : <Eye />}
        </Button>
        <ColumnMenu
          title={title}
          color={color}
          onChangeColor={onChangeColor}
          done={done}
          onChangeDone={onChangeDone}
          onDelete={() => setConfirmOpen(true)}
        />
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete column?"
        description={`"${title}" and all of its cards move to the trash, where they stay restorable for 14 days.`}
        confirmLabel="Delete column"
        onConfirm={onDelete}
      />
    </div>
  )
}
