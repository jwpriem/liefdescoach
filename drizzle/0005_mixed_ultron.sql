CREATE TABLE "passkey_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" text,
	"backed_up" boolean DEFAULT false NOT NULL,
	"transports" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "passkey_credentials" ADD CONSTRAINT "passkey_credentials_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "passkey_credentials_student_id_idx" ON "passkey_credentials" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "passkey_credentials_credential_id_idx" ON "passkey_credentials" USING btree ("credential_id");