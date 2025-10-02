ALTER TABLE "parcel" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "parcel" ADD COLUMN "tracking_no" varchar(15) NOT NULL;--> statement-breakpoint
ALTER TABLE "parcel" ADD COLUMN "status" varchar(50) DEFAULT 'In Transit' NOT NULL;--> statement-breakpoint
ALTER TABLE "parcel" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_tracking_no_unique" UNIQUE("tracking_no");