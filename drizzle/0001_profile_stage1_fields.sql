CREATE TYPE "public"."preferred_color" AS ENUM('magenta', 'violet', 'amber', 'green');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "favorite_fruit" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "preferred_color" "preferred_color";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "testimony" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_testimony_len" CHECK ("profiles"."testimony" IS NULL OR char_length("profiles"."testimony") <= 280);