import { createContext, useContext } from "react"
import type { ProjectSessionDetail } from "@doska/contract"

/** What the pointer rests on: a session, or a workstream and maybe one step. */
export type LinkHover =
  { session: string } | { ws: string; step?: string } | null

interface LinkHoverCtx {
  hover: LinkHover
  setHover: (hover: LinkHover) => void
}

// Apart from ProjectCtx, so a hover re-renders only what reads it.
export const LinkHoverContext = createContext<LinkHoverCtx>({
  hover: null,
  setHover: () => {},
})

export const useLinkHover = () => useContext(LinkHoverContext)

export function hoverProps(
  setHover: LinkHoverCtx["setHover"],
  hover: LinkHover,
  leave: LinkHover = null
) {
  return {
    onMouseEnter: () => setHover(hover),
    onMouseLeave: () => setHover(leave),
  }
}

/** The session is hovered, or works on the hovered item. */
export function sessionLit(hover: LinkHover, s: ProjectSessionDetail): boolean {
  if (!hover) return false
  if ("session" in hover) return hover.session === s.id
  return (
    s.workstreamId === hover.ws &&
    (hover.step === undefined || s.stepId === hover.step)
  )
}

/** The hovered session works on this workstream, or on this step of it. */
export function itemLit(
  hover: LinkHover,
  sessionById: Map<string, ProjectSessionDetail>,
  wsId: string,
  stepId?: string
): boolean {
  if (!hover || !("session" in hover)) return false
  const s = sessionById.get(hover.session)
  return (
    !!s &&
    s.workstreamId === wsId &&
    (stepId === undefined || s.stepId === stepId)
  )
}
