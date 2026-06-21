-- profiles.handle uses the citext type for case-insensitive UNIQUE; enable it
-- before any citext column is created. drizzle-kit does not emit extensions.
CREATE EXTENSION IF NOT EXISTS citext;--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('enterprise', 'landing');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('es', 'en');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"org" text,
	"message" text NOT NULL,
	"source" "lead_source" DEFAULT 'enterprise' NOT NULL,
	"locale" "locale" DEFAULT 'es' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_email_format" CHECK ("leads"."email" ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
	CONSTRAINT "leads_name_len" CHECK (char_length("leads"."name") BETWEEN 1 AND 120),
	CONSTRAINT "leads_message_len" CHECK (char_length("leads"."message") BETWEEN 1 AND 2000)
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"privy_did" text NOT NULL,
	"handle" "citext" NOT NULL,
	"display_name" text NOT NULL,
	"role" text,
	"location" text,
	"bio" text,
	"links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"locale" "locale" DEFAULT 'es' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_handle_format" CHECK ("profiles"."handle" ~ '^[A-Za-z0-9_-]{3,30}$'),
	CONSTRAINT "profiles_display_name_len" CHECK (char_length("profiles"."display_name") BETWEEN 1 AND 80),
	CONSTRAINT "profiles_bio_len" CHECK ("profiles"."bio" IS NULL OR char_length("profiles"."bio") <= 280)
);
--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_privy_did_key" ON "profiles" USING btree ("privy_did");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_handle_key" ON "profiles" USING btree ("handle");