-- Card priority: the high/medium/low enum becomes an integer 0-100.
-- The old default ('') cannot be cast, so it is dropped before the type change
-- and re-set after. Values map high=75, medium=50, low=25, everything else 0 —
-- which covers '' (no priority) and any value a future client wrote as digits.
ALTER TABLE "cards" ALTER COLUMN "priority" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "cards" ALTER COLUMN "priority" SET DATA TYPE integer USING (
  CASE lower(trim("priority"))
    WHEN 'high' THEN 75
    WHEN 'medium' THEN 50
    WHEN 'low' THEN 25
    ELSE CASE
      WHEN trim("priority") ~ '^[0-9]+$'
        THEN least(100, greatest(0, trim("priority")::integer))
      ELSE 0
    END
  END
);--> statement-breakpoint
ALTER TABLE "cards" ALTER COLUMN "priority" SET DEFAULT 0;
