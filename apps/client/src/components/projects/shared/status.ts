import type { ProjectStatus, WorkstreamStatus } from "@doska/contract"

/** Restrained on purpose: colour only for what is moving or stuck. */
export type Tone = "primary" | "destructive" | "amber" | "muted"

export const PROJECT_STATUS: Record<
  ProjectStatus,
  { label: string; tone: Tone }
> = {
  active: { label: "Active", tone: "primary" },
  blocked: { label: "Blocked", tone: "destructive" },
  waiting: { label: "Waiting", tone: "amber" },
  paused: { label: "Paused", tone: "muted" },
  done: { label: "Done", tone: "muted" },
}

export const WORKSTREAM_STATUS: Record<
  WorkstreamStatus,
  { label: string; tone: Tone }
> = {
  planned: { label: "Planned", tone: "muted" },
  active: { label: "In progress", tone: "primary" },
  blocked: { label: "Blocked", tone: "destructive" },
  waiting: { label: "Waiting", tone: "amber" },
  done: { label: "Done", tone: "muted" },
  deferred: { label: "Deferred", tone: "muted" },
}

export const TONE_PILL: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  amber: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  muted: "bg-muted text-muted-foreground",
}

export const TONE_DOT: Record<Tone, string> = {
  primary: "bg-primary",
  destructive: "bg-destructive",
  amber: "bg-amber-500 dark:bg-amber-400",
  muted: "bg-muted-foreground/45",
}
