CREATE TABLE IF NOT EXISTS "complaint_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"complaint_id" integer NOT NULL,
	"embedding" "vector(1536)" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "complaints" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(12) NOT NULL,
	"complainant_name" varchar(255) NOT NULL,
	"complainant_contact" text NOT NULL,
	"incident_datetime" timestamp NOT NULL,
	"incident_place" varchar(255) NOT NULL,
	"accused_details" text NOT NULL,
	"description" text NOT NULL,
	"ipc_sections" text[] NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"otp_hash" varchar(255) NOT NULL,
	"purpose" varchar(50) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'USER' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"upload_limit" integer DEFAULT 5 NOT NULL,
	"search_limit" integer DEFAULT 10 NOT NULL,
	"uploads_used" integer DEFAULT 0 NOT NULL,
	"searches_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "complaint_embeddings" ADD CONSTRAINT "complaint_embeddings_complaint_id_complaints_id_fk" FOREIGN KEY ("complaint_id") REFERENCES "public"."complaints"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "complaints" ADD CONSTRAINT "complaints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "otps" ADD CONSTRAINT "otps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
