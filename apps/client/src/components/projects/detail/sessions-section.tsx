import { useState } from "react"
import { Plus } from "lucide-react"
import { Button, Input } from "@doska/ui-kit"
import { NativeSelect } from "../shared/native-select"
import { Section } from "../shared/section"
import { useProjectWrite } from "../shared/use-project-write"
import { useProjectCtx } from "./project-context"
import { SessionCard } from "./session-card"
import { sessionDefaults } from "./session-defaults"

/** The Claude sessions working on the project, most recently active first. */
export function SessionsSection() {
  const { detail } = useProjectCtx()
  const [adding, setAdding] = useState(false)
  const sessions = [...detail.sessions].sort(
    (a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0)
  )

  return (
    <Section
      title="Sessions"
      meta={sessions.length || undefined}
      actions={
        !adding && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setAdding(true)}
          >
            <Plus />
            Add
          </Button>
        )
      }
    >
      {adding && <AddSession onDone={() => setAdding(false)} />}
      {sessions.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">
          No sessions yet. A Claude session registers itself when it starts on
          the project, or add one by its worktree.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </ul>
      )}
    </Section>
  )
}

function AddSession({ onDone }: { onDone: () => void }) {
  const { detail, projectId, workstreams } = useProjectCtx()
  const [fields, setFields] = useState(() => ({
    label: "",
    ...sessionDefaults(detail.project.name, detail.sessions),
    workstreamId: "",
  }))
  const { mutate: register, isPending } = useProjectWrite(
    "sessionRegister",
    projectId
  )
  const set =
    (key: keyof typeof fields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }))

  return (
    <form
      className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/5"
      onKeyDown={(e) => e.key === "Escape" && onDone()}
      onSubmit={(e) => {
        e.preventDefault()
        if (!fields.worktree.trim()) return
        register(
          {
            projectId,
            worktree: fields.worktree.trim(),
            label: fields.label.trim() || undefined,
            mission: fields.mission.trim() || undefined,
            branch: fields.branch.trim() || undefined,
            workstreamId: fields.workstreamId || undefined,
          },
          { onSuccess: onDone }
        )
      }}
    >
      <Input
        autoFocus
        aria-label="Label"
        placeholder="Label, e.g. Routing / BGP"
        value={fields.label}
        onChange={set("label")}
      />
      <Input
        aria-label="Worktree path"
        placeholder="Worktree path (required)"
        value={fields.worktree}
        onChange={set("worktree")}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          aria-label="Mission"
          placeholder="Mission"
          value={fields.mission}
          onChange={set("mission")}
        />
        <Input
          aria-label="Branch"
          placeholder="Branch"
          value={fields.branch}
          onChange={set("branch")}
        />
      </div>
      {workstreams.length > 0 && (
        <NativeSelect
          aria-label="Workstream"
          value={fields.workstreamId}
          onChange={set("workstreamId")}
        >
          <option value="">No workstream</option>
          {workstreams.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </NativeSelect>
      )}
      <div className="flex justify-end gap-1.5">
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!fields.worktree.trim() || isPending}
        >
          Add session
        </Button>
      </div>
    </form>
  )
}
