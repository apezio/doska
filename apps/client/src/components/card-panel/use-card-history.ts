import { useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  breakGroup,
  canRedo,
  canUndo,
  createHistory,
  current,
  diff,
  record,
  redo,
  undo,
  type EditSource,
  type Entry,
  type Field,
  type Sel,
  type Snapshot,
} from "./text-history"

const FIELDS = ["title", "body"] as const

type FieldRefs = Record<Field, React.RefObject<HTMLTextAreaElement | null>>

/** What a field's textarea needs to take part in the card's history. */
export interface EditorFieldProps {
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onBlur: () => void
  onCompositionStart: () => void
  onCompositionEnd: (e: React.CompositionEvent<HTMLTextAreaElement>) => void
}

interface Options {
  /** What is on screen right now — the `prev` the next edit is recorded from. */
  state: Snapshot
  /** Puts the fields a step changed back on screen and queues them for saving. */
  onRestore: (patch: Partial<Snapshot>) => void
}

/** The selection in whichever field has focus, or null when none has it. */
function readSel(refs: FieldRefs): Sel | null {
  for (const field of FIELDS) {
    const el = refs[field].current
    if (el && document.activeElement === el)
      return { field, start: el.selectionStart, end: el.selectionEnd }
  }
  return null
}

/**
 * Undo/redo for one card's editing session. Title and body share a single
 * stack, and the hook is mounted with the card, so a stack can neither outlive
 * its card nor reach another one.
 */
export function useCardHistory({ state, onRestore }: Options) {
  // Held in state, not a ref, so it can be read during render: it is created
  // once and then mutated in place, never replaced.
  const [history] = useState(createHistory)

  const titleRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const refs = useMemo<FieldRefs>(
    () => ({ title: titleRef, body: bodyRef }),
    [titleRef, bodyRef]
  )

  const [undoable, setUndoable] = useState(false)
  const [redoable, setRedoable] = useState(false)
  const sync = () => {
    setUndoable(canUndo(history))
    setRedoable(canRedo(history))
  }

  /** Selection to put back once a restored snapshot has rendered. */
  const pending = useRef<Sel | null>(null)
  /** The snapshot from before an IME composition; null when not composing. */
  const composing = useRef<Snapshot | null>(null)

  /**
   * Applies a selection an undo queued, then records the settled selection for
   * whatever entry is now current. Ordering is the point: child effects run
   * before a parent's, so by the time this runs the hooks that own the textarea
   * — the slash and wikilink menus, paste, list continuation — have already put
   * their own caret back. What it reads is therefore the caret an insertion
   * meant, not the one that preceded it.
   */
  useLayoutEffect(() => {
    if (composing.current) return

    const sel = pending.current
    if (sel) {
      pending.current = null
      const el = refs[sel.field].current
      if (el) {
        el.focus()
        el.setSelectionRange(sel.start, sel.end)
      }
    }

    const entry = current(history)
    if (entry) entry.sel = readSel(refs)
  }, [state.title, state.body, history, refs])

  /**
   * Where to put the caret when the step's own recorded selection is no use —
   * it belongs to a field this step did not touch, or the entry never had one.
   * The end of the changed run in the restored text is where the edit was, and
   * so where the caret belongs.
   */
  const caretAtChange = (field: Field, from: Snapshot, to: Snapshot): Sel => {
    const d = diff(from[field], to[field])
    const at = d.start + d.inserted
    return { field, start: at, end: at }
  }

  /**
   * Walks the stack one step and puts back only what that step changed.
   * Entries snapshot both fields, but restoring both would roll back whatever
   * had meanwhile arrived in the field the step never touched — a remote
   * rename landing on the title while the body is being typed, say, which
   * undo would otherwise revert and then save.
   */
  const step = (move: () => Entry | null) => {
    const from = current(history)
    const to = move()
    if (!from || !to) return

    const patch: Partial<Snapshot> = {}
    if (to.state.title !== from.state.title) patch.title = to.state.title
    if (to.state.body !== from.state.body) patch.body = to.state.body

    // Prefer the caret the entry recorded — for a slash insert that is the
    // spot the snippet meant, mid-snippet and all. It is only usable when it
    // belongs to a field this step actually restored.
    const changed = (Object.keys(patch) as Field[])[0]
    pending.current =
      to.sel && patch[to.sel.field] !== undefined
        ? to.sel
        : changed
          ? caretAtChange(changed, from.state, to.state)
          : null

    onRestore(patch)
    sync()
  }

  /**
   * Records an edit. `source` is "typing" for keystrokes and "command" for
   * everything the app writes itself — a slash insert, a wikilink, a pasted
   * file, a task toggle — which never joins a run of typing.
   *
   * `state` is this render's, which is what every path here edits from: each
   * one changes a single field once per event. A future path that wrote both
   * fields in one tick would need the second write to see the first.
   */
  const push = (next: Snapshot, source: EditSource) => {
    // Mid-composition states are not steps of their own; the whole composition
    // lands as one when it ends.
    if (composing.current) return
    record(history, state, next, source, Date.now())
    sync()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Let the IME have the keystroke while it is composing.
    if (composing.current) return
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return

    const key = e.key.toLowerCase()
    const isUndo = key === "z" && !e.shiftKey
    const isRedo = (key === "z" && e.shiftKey) || (key === "y" && !e.shiftKey)
    if (!isUndo && !isRedo) return

    e.preventDefault()
    step(() => (isRedo ? redo(history) : undo(history)))
  }

  const fieldProps = (field: Field): EditorFieldProps => ({
    inputRef: refs[field],
    onKeyDown,
    // Coming back to a field starts a fresh step rather than extending the run
    // that was open when focus left it.
    onBlur: () => breakGroup(history),
    onCompositionStart: () => {
      composing.current = state
    },
    onCompositionEnd: (e) => {
      const before = composing.current
      composing.current = null
      if (!before) return
      // Read the element, not `state`: the final input event lands either side
      // of compositionend depending on the browser, but the element holds the
      // committed text by now either way. A cancelled composition gives back
      // what it started with, which records as nothing.
      record(
        history,
        before,
        { ...before, [field]: e.currentTarget.value },
        "command",
        Date.now()
      )
      sync()
    },
  })

  return {
    fieldProps,
    record: push,
    breakGroup: () => breakGroup(history),
    undo: () => step(() => undo(history)),
    redo: () => step(() => redo(history)),
    canUndo: undoable,
    canRedo: redoable,
  }
}
