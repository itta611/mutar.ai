ALTER TABLE "project" ADD COLUMN "aspectRatio" text DEFAULT '4:3' NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "model" text DEFAULT 'openai/gpt-5.4-image-2' NOT NULL;