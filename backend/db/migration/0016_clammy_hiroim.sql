ALTER TABLE "notification_status" RENAME TO "notification";--> statement-breakpoint
ALTER TABLE "notification" DROP CONSTRAINT "notification_status_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;