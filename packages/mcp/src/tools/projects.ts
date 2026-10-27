import {
  DecisionKindSchema,
  PlanStateSchema,
  ProjectStatusSchema,
  WorkstreamStatusSchema,
  type Step,
  type Workstream,
} from "@doska/contract"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ConflictError, type ProjectInput, type ProjectStore } from "../store"
import { projectContext } from "./project-context"
import { reply } from "./reply"

const projectId = z.string().describe("The project's id (proj-…)")
const workstreamId = z.string().describe("A workstream's id (ws-…)")
const ifVersion = z
  .number()
  .int()
  .optional()
  .describe(
    "The version you last read. If the record has moved on, the write is " +
      "refused with the current value, so you can merge instead of overwrite"
  )
const sessionId = z
  .string()
  .optional()
  .describe(
    "Your session id from session_start or register_session, so the " +
      "activity log shows who did it"
  )
const message = z
  .string()
  .optional()
  .describe("Why — recorded in the activity log")
const steps = z
  .array(
    z.object({
      id: z
        .string()
        .optional()
        .describe("Keep an existing step's id; omit for a new step"),
      text: z.string(),
      done: z.boolean().optional(),
    })
  )
  .describe("The whole step list, in order — it replaces the current one")
const planState = PlanStateSchema.describe(
  "proposed until the operator approves the plan; never set approved yourself"
)
const workstreamStatus = WorkstreamStatusSchema.describe(
  "done only once the operator has confirmed the work is done"
)

const text = (value: string) => ({
  content: [{ type: "text" as const, text: value }],
})

async function contextOf(store: ProjectStore, id: string): Promise<string> {
  return projectContext(await store.getProject(id), Date.now())
}

/** Match each ref to a step by id, else by exact text; unknown refs throw. */
function markSteps(steps: Step[], refs: string[], done: boolean): Step[] {
  const hit = new Set<string>()
  for (const ref of refs) {
    const step =
      steps.find((s) => s.id === ref) ??
      steps.find((s) => s.text.trim() === ref.trim())
    if (!step)
      throw new Error(
        `No step "${ref}": pass a step id or its exact text. ` +
          `Steps: ${JSON.stringify(steps)}`
      )
    hit.add(step.id)
  }
  return steps.map((s) => (hit.has(s.id) ? { ...s, done } : s))
}

/**
 * Steps are written as a whole list, so ticking one under a concurrent edit
 * would drop the other session's change. Write against the version read, and
 * on a conflict re-read and reapply.
 */
async function writeSteps(
  store: ProjectStore,
  ws: Workstream,
  refs: string[],
  done: boolean,
  rest: Omit<ProjectInput<"workstreamUpdate">, "id" | "ifVersion" | "steps">
): Promise<Workstream> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await store.updateWorkstream({
        ...rest,
        id: ws.id,
        ifVersion: ws.version,
        steps: markSteps(ws.steps, refs, done),
      })
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err
      ws = await store.getWorkstream(ws.id)
    }
  }
}

export function registerProjectTools(
  server: McpServer,
  store: ProjectStore
): void {
  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description:
        "Every project with its status, a one-line summary and counts: " +
        "workstreams, open blockers and decisions, active sessions, cards.",
      inputSchema: {},
    },
    async () =>
      reply(
        (await store.listProjects()).map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          summary: p.summary.trim().split("\n")[0],
          version: p.version,
          workstreams: p.workstreams,
          openBlockers: p.openBlockers,
          openDecisions: p.openDecisions,
          activeSessions: p.activeSessions,
          cards: p.cards,
          lastActivityAt: p.lastActivityAt,
        }))
      )
  )

  server.registerTool(
    "get_project",
    {
      title: "Get project",
      description:
        "One project in full: workstreams with plans and steps, decisions, " +
        "linked cards, sessions and the last 100 events. For a quick read, " +
        "get_project_context is shorter.",
      inputSchema: { project_id: projectId },
    },
    async ({ project_id }) => reply(await store.getProject(project_id))
  )

  server.registerTool(
    "get_project_context",
    {
      title: "Get project context",
      description:
        "A short plain-text brief: summary, what needs attention, each " +
        "workstream's status and next step, linked cards and sessions. " +
        "Read this before working on a project.",
      inputSchema: { project_id: projectId },
    },
    async ({ project_id }) => text(await contextOf(store, project_id))
  )

  server.registerTool(
    "session_start",
    {
      title: "Start session",
      description:
        "Call at the start of a session with your working directory. " +
        "Returns every project this worktree is registered on, with its " +
        "brief and your session_id, and marks the session active. With " +
        "project_id, joins that project if this worktree hasn't yet.",
      inputSchema: {
        worktree: z.string().min(1).describe("Absolute working directory"),
        mission: z.string().optional(),
        branch: z.string().optional(),
        repo_id: z.string().optional(),
        claude_session_id: z.string().optional(),
        dashboard_url: z
          .string()
          .optional()
          .describe("The Miss Claude dashboard this session runs under"),
        project_id: projectId.optional(),
      },
    },
    async ({
      worktree,
      mission,
      branch,
      repo_id,
      claude_session_id,
      dashboard_url,
      project_id,
    }) => {
      // Each project's session here, as it was before this call touches it.
      const since = new Map<string, number | null>()
      for (const p of await store.listProjects()) {
        const detail = await store.getProject(p.id)
        const mine = detail.sessions.find((s) => s.worktree === worktree)
        if (mine) since.set(p.id, mine.lastActivityAt)
      }
      const ids = new Set(since.keys())
      if (project_id) ids.add(project_id)
      if (ids.size === 0)
        return reply({
          projects: [],
          hint: "call list_projects and register_session to join one",
        })

      const projects = []
      for (const id of ids) {
        const session = await store.registerSession({
          projectId: id,
          worktree,
          mission,
          branch,
          repoId: repo_id,
          claudeSessionId: claude_session_id,
          dashboardUrl: dashboard_url,
          lastEvent: "start",
        })
        const detail = await store.getProject(id)
        projects.push({
          id,
          name: detail.project.name,
          session_id: session.id,
          context: projectContext(detail, Date.now(), {
            sessionId: session.id,
            since: since.get(id) ?? null,
          }),
        })
      }
      return reply({ projects })
    }
  )

  server.registerTool(
    "create_project",
    {
      title: "Create project",
      description: "Start a project: a goal with workstreams under it.",
      inputSchema: {
        name: z.string().min(1),
        description: z.string().optional(),
        status: ProjectStatusSchema.optional(),
        summary: z.string().optional().describe("Where things stand, briefly"),
        session_id: sessionId,
      },
    },
    async ({ session_id, ...input }) =>
      reply(await store.createProject({ ...input, sessionId: session_id }))
  )

  server.registerTool(
    "update_project",
    {
      title: "Update project",
      description:
        "Patch a project: only the fields given are written. Set status " +
        "done only once the operator has confirmed it.",
      inputSchema: {
        project_id: projectId,
        if_version: ifVersion,
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        status: ProjectStatusSchema.optional(),
        summary: z.string().optional(),
        message,
        session_id: sessionId,
      },
    },
    async ({ project_id, if_version, session_id, ...patch }) =>
      reply(
        await store.updateProject({
          ...patch,
          id: project_id,
          ifVersion: if_version,
          sessionId: session_id,
        })
      )
  )

  server.registerTool(
    "create_workstream",
    {
      title: "Create workstream",
      description:
        "Add a workstream to a project: a line of work with a plan, steps " +
        "and dependencies. Its plan starts proposed.",
      inputSchema: {
        project_id: projectId,
        name: z.string().min(1),
        status: workstreamStatus.optional(),
        plan: z.string().optional().describe("Markdown"),
        plan_state: planState.optional(),
        steps: steps.optional(),
        depends_on: z
          .array(z.string())
          .optional()
          .describe("Ids of workstreams in this project that come first"),
        note: z.string().optional().describe("Short blocker / waiting-on note"),
        session_id: sessionId,
      },
    },
    async ({ project_id, plan_state, depends_on, session_id, ...input }) =>
      reply(
        await store.createWorkstream({
          ...input,
          projectId: project_id,
          planState: plan_state,
          dependsOn: depends_on,
          sessionId: session_id,
        })
      )
  )

  server.registerTool(
    "update_workstream",
    {
      title: "Update workstream",
      description:
        "Patch a workstream: only the fields given are written. `steps` " +
        "replaces the whole list — to tick one step use set_step. Say why " +
        "in `message` when the plan changes.",
      inputSchema: {
        workstream_id: workstreamId,
        if_version: ifVersion,
        name: z.string().min(1).optional(),
        status: workstreamStatus.optional(),
        plan: z.string().optional(),
        plan_state: planState.optional(),
        steps: steps.optional(),
        depends_on: z.array(z.string()).optional(),
        note: z.string().optional(),
        message,
        session_id: sessionId,
      },
    },
    async ({
      workstream_id,
      if_version,
      plan_state,
      depends_on,
      session_id,
      ...patch
    }) =>
      reply(
        await store.updateWorkstream({
          ...patch,
          id: workstream_id,
          ifVersion: if_version,
          planState: plan_state,
          dependsOn: depends_on,
          sessionId: session_id,
        })
      )
  )

  server.registerTool(
    "set_step",
    {
      title: "Set step",
      description:
        "Tick or untick one step of a workstream, by its id or exact text, " +
        "leaving the other steps alone.",
      inputSchema: {
        workstream_id: workstreamId,
        step_id: z.string().optional(),
        text: z.string().optional().describe("The step's exact text"),
        done: z.boolean(),
        session_id: sessionId,
      },
    },
    async ({ workstream_id, step_id, text, done, session_id }) => {
      const ref = step_id ?? text
      if (ref === undefined) throw new Error("Pass step_id or text")
      const ws = await store.getWorkstream(workstream_id)
      return reply(
        await writeSteps(store, ws, [ref], done, { sessionId: session_id })
      )
    }
  )

  server.registerTool(
    "add_decision",
    {
      title: "Add decision or blocker",
      description:
        "Raise something the operator has to decide (kind decision) or " +
        "that stops the work (kind blocker). It shows under Needs attention " +
        "until resolved.",
      inputSchema: {
        project_id: projectId,
        workstream_id: workstreamId.optional(),
        kind: DecisionKindSchema,
        title: z.string().min(1),
        body: z.string().optional().describe("Options, context — Markdown"),
        session_id: sessionId,
      },
    },
    async ({ project_id, workstream_id, session_id, ...input }) =>
      reply(
        await store.createDecision({
          ...input,
          projectId: project_id,
          workstreamId: workstream_id,
          sessionId: session_id,
        })
      )
  )

  server.registerTool(
    "resolve_decision",
    {
      title: "Resolve decision",
      description:
        "Close a decision or blocker with what was decided. Record the " +
        "operator's decision, not your own preference.",
      inputSchema: {
        decision_id: z.string().describe("The decision's id (dec-…)"),
        resolution: z.string(),
        session_id: sessionId,
      },
    },
    async ({ decision_id, resolution, session_id }) =>
      reply(
        await store.updateDecision({
          id: decision_id,
          status: "resolved",
          resolution,
          sessionId: session_id,
        })
      )
  )

  server.registerTool(
    "link_card",
    {
      title: "Link card",
      description:
        "Link a board card to the project, optionally under a workstream. " +
        "The card stays the source of truth; the brief shows its title and " +
        "whether it is in its board's done column.",
      inputSchema: {
        project_id: projectId,
        board_id: z.string(),
        card_id: z
          .string()
          .describe("The card's own id (card-…), not its [[12]] number"),
        workstream_id: workstreamId.optional(),
        session_id: sessionId,
      },
    },
    async ({ project_id, board_id, card_id, workstream_id, session_id }) => {
      await store.linkCard({
        projectId: project_id,
        boardId: board_id,
        cardId: card_id,
        workstreamId: workstream_id,
        sessionId: session_id,
      })
      return reply({ ok: true })
    }
  )

  server.registerTool(
    "unlink_card",
    {
      title: "Unlink card",
      description: "Remove a card from the project. The card itself is kept.",
      inputSchema: {
        project_id: projectId,
        card_id: z.string(),
        session_id: sessionId,
      },
    },
    async ({ project_id, card_id, session_id }) => {
      await store.unlinkCard({
        projectId: project_id,
        cardId: card_id,
        sessionId: session_id,
      })
      return reply({ ok: true })
    }
  )

  server.registerTool(
    "register_session",
    {
      title: "Register session",
      description:
        "Join a project as the session working in `worktree`, or refresh " +
        "that session if it already joined. Returns the session; its id is " +
        "the session_id other tools take. `workstream_id` and `step_id` say " +
        "what the session works on; a new workstream without a step_id " +
        "clears the step.",
      inputSchema: {
        project_id: projectId,
        worktree: z.string().min(1).describe("Absolute working directory"),
        label: z
          .string()
          .optional()
          .describe("Defaults to the mission, else the worktree's name"),
        mission: z.string().optional(),
        branch: z.string().optional(),
        repo_id: z.string().optional(),
        claude_session_id: z.string().optional(),
        dashboard_url: z
          .string()
          .optional()
          .describe("The Miss Claude dashboard this session runs under"),
        workstream_id: workstreamId.optional(),
        step_id: z
          .string()
          .optional()
          .describe("A step of that workstream (step-…)"),
      },
    },
    async ({
      project_id,
      repo_id,
      claude_session_id,
      dashboard_url,
      workstream_id,
      step_id,
      ...input
    }) =>
      reply(
        await store.registerSession({
          ...input,
          projectId: project_id,
          repoId: repo_id,
          claudeSessionId: claude_session_id,
          dashboardUrl: dashboard_url,
          workstreamId: workstream_id,
          stepId: step_id,
        })
      )
  )

  server.registerTool(
    "record_progress",
    {
      title: "Record progress",
      description:
        "The one-call checkpoint / handoff: logs `message`, and optionally " +
        "replaces the project summary, sets a workstream's status and ticks " +
        "its steps. Returns the refreshed brief. Use at checkpoints, not " +
        "after every message.",
      inputSchema: {
        project_id: projectId,
        message: z.string().min(1).describe("What happened, for the log"),
        session_id: sessionId,
        workstream_id: workstreamId
          .optional()
          .describe("Required for workstream_status and steps_done"),
        summary: z
          .string()
          .optional()
          .describe("Replaces the project summary: where things stand now"),
        workstream_status: workstreamStatus.optional(),
        steps_done: z
          .array(z.string())
          .optional()
          .describe("Steps now done, by id or exact text"),
      },
    },
    async (input) => {
      const { project_id, session_id, workstream_id } = input
      const detail = await store.getProject(project_id)

      // Check everything before the first write, so a bad id writes nothing.
      const session = session_id
        ? detail.sessions.find((s) => s.id === session_id)
        : undefined
      if (session_id && !session)
        throw new Error(
          `No session ${session_id} on project ${project_id}: call ` +
            "session_start or register_session first"
        )
      const ws = workstream_id
        ? detail.workstreams.find((w) => w.id === workstream_id)
        : undefined
      if (workstream_id && !ws)
        throw new Error(
          `No workstream ${workstream_id} on project ${project_id}`
        )
      const touchesWorkstream =
        input.workstream_status !== undefined || input.steps_done?.length
      if (touchesWorkstream && !ws)
        throw new Error("workstream_status and steps_done need workstream_id")
      if (ws && input.steps_done) markSteps(ws.steps, input.steps_done, true)

      await store.addNote({
        projectId: project_id,
        workstreamId: workstream_id,
        message: input.message,
        sessionId: session_id,
      })
      if (input.summary !== undefined)
        await store.updateProject({
          id: project_id,
          summary: input.summary,
          sessionId: session_id,
        })
      if (ws && touchesWorkstream)
        await writeSteps(store, ws, input.steps_done ?? [], true, {
          status: input.workstream_status,
          sessionId: session_id,
        })
      if (session)
        await store.registerSession({
          projectId: project_id,
          worktree: session.worktree,
          lastEvent: "progress",
        })

      return text(
        projectContext(
          await store.getProject(project_id),
          Date.now(),
          session && { sessionId: session.id, since: session.lastActivityAt }
        )
      )
    }
  )
}
