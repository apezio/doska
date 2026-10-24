import type { z } from "zod"
import type {
  AttachmentSchema,
  CardSchema,
  ChangeSchema,
  ColumnSchema,
  DashboardChangeSchema,
  DashboardSchema,
  DecisionKindSchema,
  DecisionStatusSchema,
  DirectoryUserSchema,
  LinkedCardSchema,
  MemberRoleSchema,
  MemberSchema,
  PlanStateSchema,
  ProjectActorSchema,
  ProjectDecisionSchema,
  ProjectDetailSchema,
  ProjectEventKindSchema,
  ProjectEventSchema,
  ProjectSchema,
  ProjectSessionDetailSchema,
  ProjectSessionSchema,
  ProjectStatusSchema,
  ProjectSummarySchema,
  PublicBoardSchema,
  StepInputSchema,
  StepSchema,
  WorkstreamSchema,
  WorkstreamStatusSchema,
} from "./schemas"

export * from "./schemas"
export * from "./card-id"
export * from "./priority"
export * from "./retention"
export { contract } from "./contract"

export type Attachment = z.infer<typeof AttachmentSchema>
export type Card = z.infer<typeof CardSchema>
export type Column = z.infer<typeof ColumnSchema>
export type Dashboard = z.infer<typeof DashboardSchema>
export type Change = z.infer<typeof ChangeSchema>
export type DashboardChange = z.infer<typeof DashboardChangeSchema>
export type Member = z.infer<typeof MemberSchema>
export type MemberRole = z.infer<typeof MemberRoleSchema>
export type DirectoryUser = z.infer<typeof DirectoryUserSchema>
export type PublicBoard = z.infer<typeof PublicBoardSchema>

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>
export type WorkstreamStatus = z.infer<typeof WorkstreamStatusSchema>
export type PlanState = z.infer<typeof PlanStateSchema>
export type Step = z.infer<typeof StepSchema>
export type StepInput = z.input<typeof StepInputSchema>
export type DecisionKind = z.infer<typeof DecisionKindSchema>
export type DecisionStatus = z.infer<typeof DecisionStatusSchema>
export type ProjectEventKind = z.infer<typeof ProjectEventKindSchema>
export type ProjectActor = z.infer<typeof ProjectActorSchema>
export type Project = z.infer<typeof ProjectSchema>
export type Workstream = z.infer<typeof WorkstreamSchema>
export type ProjectDecision = z.infer<typeof ProjectDecisionSchema>
export type ProjectSession = z.infer<typeof ProjectSessionSchema>
export type ProjectSessionDetail = z.infer<typeof ProjectSessionDetailSchema>
export type ProjectEvent = z.infer<typeof ProjectEventSchema>
export type LinkedCard = z.infer<typeof LinkedCardSchema>
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>
export type ProjectDetail = z.infer<typeof ProjectDetailSchema>
