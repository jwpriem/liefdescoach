CREATE TYPE "public"."booking_source" AS ENUM('regular', 'classpass');--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "source" "booking_source" DEFAULT 'regular' NOT NULL;