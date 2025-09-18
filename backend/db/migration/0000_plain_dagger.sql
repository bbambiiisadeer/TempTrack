CREATE TABLE "address" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"company" varchar(150),
	"email" varchar(150),
	"phone_number" varchar(20),
	"type" varchar(20) NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100),
	"state" varchar(100),
	"postal_code" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "parcel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_address_id" uuid,
	"recipient_address_id" uuid,
	"parcel_name" varchar(150) NOT NULL,
	"quantity" integer NOT NULL,
	"weight" real NOT NULL,
	"dimension_length" real,
	"dimension_width" real,
	"dimension_height" real,
	"temperature_range_min" real,
	"temperature_range_max" real,
	"allowed_deviation" real,
	"special_notes" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_sender_address_id_address_id_fk" FOREIGN KEY ("sender_address_id") REFERENCES "public"."address"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_recipient_address_id_address_id_fk" FOREIGN KEY ("recipient_address_id") REFERENCES "public"."address"("id") ON DELETE set null ON UPDATE no action;