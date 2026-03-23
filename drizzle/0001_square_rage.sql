CREATE TABLE "login_history" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "login_history_student_id_idx" ON "login_history" USING btree ("student_id");
