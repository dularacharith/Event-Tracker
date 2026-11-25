ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "recurrence_rule" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "recurrence_day" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "parent_activity_id" text;