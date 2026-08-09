CREATE TABLE "board_members" (
	"board_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'editor' NOT NULL,
	"seq" integer NOT NULL,
	"revoked_at" bigint,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "board_members_board_id_user_id_pk" PRIMARY KEY("board_id","user_id")
);
--> statement-breakpoint
CREATE INDEX "board_members_user_seq" ON "board_members" USING btree ("user_id","seq");