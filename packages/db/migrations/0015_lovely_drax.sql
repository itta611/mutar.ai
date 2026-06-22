ALTER TABLE "user" ALTER COLUMN "creditQuota" SET DEFAULT 400;--> statement-breakpoint
UPDATE "user" SET "creditQuota" = "creditQuota" * 100;--> statement-breakpoint
UPDATE "credit_ledger" SET "amount" = "amount" * 100;
