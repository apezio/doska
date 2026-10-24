CREATE TABLE "project_cards" (
	"project_id" text NOT NULL,
	"board_id" text NOT NULL,
	"card_id" text NOT NULL,
	"workstream_id" text,
	"created_at" bigint NOT NULL,
	CONSTRAINT "project_cards_project_id_card_id_pk" PRIMARY KEY("project_id","card_id")
);
--> statement-breakpoint
CREATE TABLE "project_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"workstream_id" text,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	"resolved_at" bigint,
	"deleted_at" bigint,
	"session_id" text
);
--> statement-breakpoint
CREATE TABLE "project_events" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"workstream_id" text,
	"kind" text NOT NULL,
	"message" text NOT NULL,
	"before" jsonb,
	"session_id" text,
	"actor" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"workstream_id" text,
	"label" text DEFAULT '' NOT NULL,
	"mission" text DEFAULT '' NOT NULL,
	"worktree" text NOT NULL,
	"branch" text DEFAULT '' NOT NULL,
	"repo_id" text DEFAULT '' NOT NULL,
	"claude_session_id" text DEFAULT '' NOT NULL,
	"last_event" text DEFAULT '' NOT NULL,
	"last_activity_at" bigint,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"summary_updated_at" bigint,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "workstreams" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"plan" text DEFAULT '' NOT NULL,
	"plan_state" text DEFAULT 'proposed' NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"depends_on" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE INDEX "project_decisions_project" ON "project_decisions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_events_project_created" ON "project_events" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "project_sessions_project_worktree" ON "project_sessions" USING btree ("project_id","worktree");--> statement-breakpoint
CREATE INDEX "projects_owner" ON "projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "workstreams_project" ON "workstreams" USING btree ("project_id");