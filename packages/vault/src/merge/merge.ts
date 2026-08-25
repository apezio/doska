import type { Projection } from "./projection"

/** The fields a file can edit. `id` is identity, so it never merges. */
export const MERGED_FIELDS = ["title", "body", "deadline", "priority"] as const

export type MergedField = (typeof MERGED_FIELDS)[number]

export type CardPatch = Partial<Pick<Projection, MergedField>>

export interface MergeInput {
  /** The last state the mirror wrote out: what both sides diverged from. */
  base: Projection
  file: Projection
  db: Projection
  winner: "file" | "db"
}

export interface Merge {
  merged: Projection
  /** What to apply to the card; empty when the file brought nothing new. */
  patch: CardPatch
  /** The file no longer says what the card does and has to be rewritten. */
  rewrite: boolean
  /** Fields both sides changed. The winner is already in `merged`. */
  conflicts: MergedField[]
}

/**
 * Three-way merge, field by field, against the last written state:
 * an untouched file keeps the DB's value, an untouched field in the DB takes
 * the file's, and a field that moved on both sides is a conflict.
 */
export function mergeCard({ base, file, db, winner }: MergeInput): Merge {
  const merged = { ...db }
  const patch: CardPatch = {}
  const conflicts: MergedField[] = []

  for (const field of MERGED_FIELDS) {
    // Nothing to apply when the file didn't move, or moved to where the card
    // already is: both sides making the same edit is not a conflict either.
    if (file[field] === base[field] || file[field] === db[field]) continue
    if (db[field] !== base[field]) {
      conflicts.push(field)
      if (winner === "db") continue
    }
    take(field, file, merged, patch)
  }

  const rewrite = MERGED_FIELDS.some((field) => merged[field] !== file[field])
  return { merged, patch, rewrite, conflicts }
}

function take<F extends MergedField>(
  field: F,
  from: Projection,
  merged: Projection,
  patch: CardPatch
): void {
  merged[field] = from[field]
  patch[field] = from[field]
}
