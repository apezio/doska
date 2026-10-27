import { useEffect, useRef, useState } from "react"
import { cn } from "@doska/ui-kit"
import { sessionLit, useLinkHover } from "./link-hover"
import { useProjectCtx } from "./project-context"

interface Line {
  sessionId: string
  d: string
  x2: number
  y2: number
}

/** How far down a session card the line leaves it: level with its name. */
const CARD_Y = 20

/**
 * Curves from each session card in the side column to what it works on: the
 * step row when its workstream is open, else the workstream's header. Drawn
 * over the body it sits in, which scrolls with it, so only layout changes
 * move a line — the observed columns resize whenever anything in them does.
 */
export function SessionLinks() {
  const { detail, openIds, sessionById } = useProjectCtx()
  const { hover } = useLinkHover()
  const svg = useRef<SVGSVGElement>(null)
  const [lines, setLines] = useState<Line[]>([])

  useEffect(() => {
    const root = svg.current?.parentElement
    if (!root) return
    let frame = 0
    const measure = () => {
      frame = 0
      const origin = root.getBoundingClientRect()
      const find = (attr: string, id: string) =>
        root.querySelector(`[${attr}="${CSS.escape(id)}"]`)
      const next: Line[] = []
      for (const s of detail.sessions) {
        if (!s.workstreamId) continue
        const card = find("data-link-session", s.id)
        const item =
          (s.stepId && find("data-link-step", s.stepId)) ||
          find("data-link-ws", s.workstreamId)
        if (!card || !item) continue
        const a = card.getBoundingClientRect()
        const b = item.getBoundingClientRect()
        const x1 = a.left - origin.left
        const y1 = a.top - origin.top + Math.min(CARD_Y, a.height / 2)
        const x2 = b.right - origin.left
        const y2 = b.top - origin.top + b.height / 2
        const mid = (x1 + x2) / 2
        next.push({
          sessionId: s.id,
          d: `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`,
          x2,
          y2,
        })
      }
      setLines(next)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    const ro = new ResizeObserver(schedule)
    ro.observe(root)
    root.querySelectorAll("[data-link-column]").forEach((el) => ro.observe(el))
    window.addEventListener("resize", schedule)
    schedule()
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", schedule)
      cancelAnimationFrame(frame)
    }
  }, [detail, openIds])

  return (
    <svg
      ref={svg}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full overflow-visible fill-none"
    >
      {lines.map((l) => {
        const s = sessionById.get(l.sessionId)
        const lit = !!s && sessionLit(hover, s)
        return (
          <g
            key={l.sessionId}
            className={cn(
              "stroke-primary transition-opacity",
              lit ? "opacity-80" : "opacity-20"
            )}
          >
            <path d={l.d} strokeWidth={lit ? 2 : 1.5} />
            <circle cx={l.x2} cy={l.y2} r={2.5} className="fill-primary" />
          </g>
        )
      })}
    </svg>
  )
}
