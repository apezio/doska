import { Button, Hint } from "@doska/ui-kit"
import { Redo2, Undo2 } from "lucide-react"

/** The open card's history, as the controls that drive it need it. */
export interface UndoRedoProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

/**
 * Undo/redo for the open card. The shortcuts only reach a focused textarea, so
 * these are the only way back from an edit made in the preview — ticking a task
 * box, say — as well as the visible reminder that the card has a history at all.
 */
export function UndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: UndoRedoProps) {
  return (
    <>
      <Hint label="Undo">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Undo"
          disabled={!canUndo}
          // Don't take focus: blurring the editor would end the run of typing
          // the click is about to take back, and lose the caret with it.
          onPointerDown={(e) => e.preventDefault()}
          onClick={onUndo}
        >
          <Undo2 />
        </Button>
      </Hint>
      <Hint label="Redo">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Redo"
          disabled={!canRedo}
          onPointerDown={(e) => e.preventDefault()}
          onClick={onRedo}
        >
          <Redo2 />
        </Button>
      </Hint>
    </>
  )
}
