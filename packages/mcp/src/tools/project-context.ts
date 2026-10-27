import type { ProjectDetail, Step } from "@doska/contract"

const MAX_DECISIONS = 8
const MAX_WORKSTREAMS = 12
const MAX_CARDS = 8
const MAX_SESSIONS = 5

const clip = (text: string, max = 100) => {
  const line = text.trim().split("\n")[0]
  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}

function ago(at: number | null, now: number): string {
  if (at === null) return "never"
  const minutes = Math.floor((now - at) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function more(lines: string[], total: number, shown: number, what: string) {
  if (total > shown) lines.push(`- …and ${total - shown} more ${what}`)
}

function nextStep(steps: Step[]): string {
  if (steps.length === 0) return ""
  const done = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done)
  const count = `(${done}/${steps.length} steps)`
  return next ? ` next: ${clip(next.text, 80)} ${count}` : ` ${count}`
}

/** The session reading the brief, so answers to its own decisions lead it. */
export interface Reader {
  sessionId: string
  /** The session's activity before this call; null = never active. */
  since: number | null
}

/**
 * The brief a session reads at its start: where the project stands and what
 * needs a human, in a few dozen lines. Ids ride along so the agent can write
 * back without a second read. With a `reader`, answers to that session's
 * decisions lead, since a resolved decision drops out of Needs attention.
 */
export function projectContext(
  detail: ProjectDetail,
  now: number,
  reader?: Reader
): string {
  const { project, workstreams, decisions, cards, sessions, events } = detail
  const nameOf = new Map(workstreams.map((w) => [w.id, w.name]))
  const lines: string[] = [
    `Project: ${project.name} [${project.status}] (id ${project.id}, v${project.version})`,
    `Summary: ${project.summary.trim() || "(none yet)"}`,
  ]

  const answered = reader
    ? decisions.filter(
        (d) =>
          d.sessionId === reader.sessionId &&
          d.status === "resolved" &&
          (d.resolvedAt ?? 0) > (reader.since ?? 0)
      )
    : []
  if (answered.length) {
    lines.push("", "Since your last call, the operator answered:")
    for (const d of answered) {
      const answer = d.resolution.trim().replace(/\s*\n\s*/g, " ")
      lines.push(
        `- ${d.kind === "blocker" ? "Blocker" : "Decision"}: ${clip(d.title)}` +
          ` [${d.id}] → ${answer || "(resolved, no note)"}`
      )
    }
  }
  const last = events[0]
  if (last)
    lines.push(
      `Last update: ${ago(last.createdAt, now)} — ${clip(last.message)}`
    )

  const open = decisions
    .filter((d) => d.status === "open")
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "blocker" ? -1 : 1))
  lines.push(
    "",
    open.length ? "Needs attention:" : "Needs attention: nothing open"
  )
  for (const d of open.slice(0, MAX_DECISIONS)) {
    const ws = d.workstreamId && nameOf.get(d.workstreamId)
    lines.push(
      `- ${d.kind === "blocker" ? "Blocker" : "Decision"}: ${clip(d.title)}` +
        `${ws ? ` (${ws})` : ""} [${d.id}]`
    )
  }
  more(lines, open.length, MAX_DECISIONS, "open")

  lines.push("", workstreams.length ? "Workstreams:" : "Workstreams: none")
  for (const w of workstreams.slice(0, MAX_WORKSTREAMS)) {
    const after = w.dependsOn.map((id) => nameOf.get(id) ?? id)
    lines.push(
      `- ${w.name} [${w.status}, plan ${w.planState}]${nextStep(w.steps)}` +
        `${after.length ? ` after: ${after.join(", ")}` : ""}` +
        ` (id ${w.id}, v${w.version})`
    )
    if (w.note.trim()) lines.push(`  note: ${clip(w.note)}`)
  }
  more(lines, workstreams.length, MAX_WORKSTREAMS, "workstreams")

  if (cards.length) {
    lines.push("", "Linked cards:")
    for (const c of cards.slice(0, MAX_CARDS)) {
      if (!c.accessible || c.deleted) {
        lines.push(`- ${c.cardId}: no longer available`)
        continue
      }
      const number = c.number === null ? "" : `#${c.number} `
      lines.push(
        `- ${number}${clip(c.title, 80)} (${c.boardName}) ${c.done ? "✓" : "○"}`
      )
    }
    more(lines, cards.length, MAX_CARDS, "cards")
  }

  if (sessions.length) {
    lines.push("", "Sessions:")
    for (const s of sessions.slice(0, MAX_SESSIONS)) {
      const parts = [s.label, s.mission, `last ${ago(s.lastActivityAt, now)}`]
      lines.push(`- ${parts.filter(Boolean).join(" — ")} (id ${s.id})`)
    }
    more(lines, sessions.length, MAX_SESSIONS, "sessions")
  }

  return lines.join("\n")
}
