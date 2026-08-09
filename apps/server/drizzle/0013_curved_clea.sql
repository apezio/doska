ALTER TABLE "dashboards" ADD COLUMN "public_token" text;--> statement-breakpoint
ALTER TABLE "dashboards" ADD COLUMN "published_at" bigint;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_public_token_unique" UNIQUE("public_token");