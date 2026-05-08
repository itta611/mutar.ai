ALTER TABLE "project" ADD COLUMN "title" text;--> statement-breakpoint
UPDATE "project" SET "title" = "prompt";--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "title" SET NOT NULL;
