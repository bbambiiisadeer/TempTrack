ALTER TABLE "parcel" DROP COLUMN "is_delivered";
ALTER TABLE "parcel" ADD COLUMN "is_delivered" boolean DEFAULT false NOT NULL;