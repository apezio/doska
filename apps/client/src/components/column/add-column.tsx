import { Button, cn } from "@doska/ui-kit"
import { Plus } from "lucide-react"

interface IProps {
  onAdd: () => void
}

/** The trailing "+", standing where the next column would go. */
export function AddColumn({ onAdd }: IProps) {
  return (
    <div className="xs:max-w-sm flex w-full max-w-none shrink-0 snap-center flex-col pb-6">
      {/* Clears the column headers, so the button starts level with the card lists. */}
      <div className="h-15 shrink-0" />
      <Button
        variant="ghost"
        onClick={onAdd}
        aria-label="Add column"
        className={cn(
          "min-h-20 w-full shrink-0 rounded-3xl bg-background p-4 transition-colors",
          "border border-sidebar-primary-foreground",
          "shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground/50 uppercase">
          <Plus /> Add column
        </div>
      </Button>
    </div>
  )
}
