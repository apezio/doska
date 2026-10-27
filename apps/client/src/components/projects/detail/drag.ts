export type ProjectDrag =
  | {
      kind: "card"
      cardId: string
      boardId: string
      number: number | null
      title: string
      workstreamId: string | null
    }
  | { kind: "workstream"; id: string; name: string }
  | { kind: "step"; workstreamId: string; workstreamName: string; text: string }

// One type per kind, because `dragover` may read the types but not the data.
const DRAG_PREFIX = "application/x-doska-drag."
const dragType = (kind: ProjectDrag["kind"]) => DRAG_PREFIX + kind

export function setDrag(e: React.DragEvent, drag: ProjectDrag) {
  e.dataTransfer.setData(dragType(drag.kind), JSON.stringify(drag))
  e.dataTransfer.effectAllowed = "link"
  // Session cards hide their chat iframes from the pointer meanwhile:
  // a cross-origin frame would swallow the drag before the card saw it.
  document.body.dataset.cardDrag = ""
}

export function endDrag() {
  delete document.body.dataset.cardDrag
}

export function dragKind(e: React.DragEvent): ProjectDrag["kind"] | null {
  const type = e.dataTransfer.types.find((t) => t.startsWith(DRAG_PREFIX))
  return type ? (type.slice(DRAG_PREFIX.length) as ProjectDrag["kind"]) : null
}

export function readDrag(e: React.DragEvent): ProjectDrag | null {
  const kind = dragKind(e)
  const raw = kind && e.dataTransfer.getData(dragType(kind))
  return raw ? (JSON.parse(raw) as ProjectDrag) : null
}
