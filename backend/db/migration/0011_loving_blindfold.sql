CREATE TABLE "driver" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"reg_number" varchar(50),
	"image_url" varchar(255),
	"email" varchar(150),
	"phone_number" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parcel" ADD COLUMN "driver_id" uuid;--> statement-breakpoint
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_driver_id_driver_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver"("id") ON DELETE set null ON UPDATE no action;