ALTER TABLE "dashboards" ADD COLUMN "owner_id" text;--> statement-breakpoint
CREATE INDEX "dashboards_owner_seq" ON "dashboards" USING btree ("owner_id","seq");--> statement-breakpoint
-- Boards from the single-account era belong to the seeded owner. On a fresh
-- database this matches nothing (migrations run before `seedAccount`); the seed
-- adopts whatever is left orphaned.
UPDATE "dashboards" SET "owner_id" = (SELECT "id" FROM "user" ORDER BY "created_at" LIMIT 1) WHERE "owner_id" IS NULL;