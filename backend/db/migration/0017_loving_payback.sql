ALTER TABLE "address" ADD COLUMN "province" varchar(100);--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "district" varchar(100);--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "subdistrict" varchar(100);--> statement-breakpoint
ALTER TABLE "address" DROP COLUMN "city";--> statement-breakpoint
ALTER TABLE "address" DROP COLUMN "state";