CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."health_trend" AS ENUM('up', 'down', 'stable');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."scan_urgency" AS ENUM('none', 'monitor', 'consult_soon', 'seek_immediate');--> statement-breakpoint
CREATE TYPE "public"."age_range" AS ENUM('18-24', '25-34', '35-44', '45-54', '55-64', '65+');--> statement-breakpoint
CREATE TYPE "public"."diet_type" AS ENUM('classic', 'vegan', 'carnivore', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."health_goal" AS ENUM('energy', 'sleep', 'digestion', 'stress', 'longevity');--> statement-breakpoint
CREATE TYPE "public"."symptom" AS ENUM('fatigue', 'brain_fog', 'digestive', 'anxiety', 'pain');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'expired', 'cancelled', 'trial');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_checkin" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"sleep_score" integer NOT NULL,
	"energy_score" integer NOT NULL,
	"stress_score" integer NOT NULL,
	"digestion_score" integer NOT NULL,
	"has_pain" boolean DEFAULT false NOT NULL,
	"ai_feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_checkin_user_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "health_score" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"overall_score" integer NOT NULL,
	"sleep_sub_score" integer,
	"stress_sub_score" integer,
	"nutrition_sub_score" integer,
	"activity_sub_score" integer,
	"pain_sub_score" integer,
	"trend" "health_trend" DEFAULT 'stable',
	"change_from_previous" integer DEFAULT 0,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "health_score_user_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "streak" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_checkin_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "streak_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "scan" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "scan_status" DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_answer" (
	"id" text PRIMARY KEY NOT NULL,
	"scan_id" text NOT NULL,
	"answers" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scan_answer_scan_id_unique" UNIQUE("scan_id")
);
--> statement-breakpoint
CREATE TABLE "scan_result" (
	"id" text PRIMARY KEY NOT NULL,
	"scan_id" text NOT NULL,
	"confidence" real NOT NULL,
	"processing_time_ms" integer NOT NULL,
	"result" jsonb NOT NULL,
	"disclaimer" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scan_result_scan_id_unique" UNIQUE("scan_id")
);
--> statement-breakpoint
CREATE TABLE "user_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"age_range" "age_range",
	"gender" "gender",
	"height_cm" integer,
	"weight_kg" integer,
	"activity_level" integer,
	"sleep_quality" integer,
	"stress_level" integer,
	"diet_type" "diet_type",
	"primary_goal" "health_goal",
	"secondary_goal" "health_goal",
	"symptoms" jsonb DEFAULT '[]'::jsonb,
	"motivation_level" integer,
	"willing_daily_actions" boolean,
	"notifications_enabled" boolean DEFAULT false,
	"disclaimer_accepted" boolean DEFAULT false,
	"onboarding_completed" boolean DEFAULT false,
	"onboarding_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"revenuecat_user_id" text,
	"product_id" text,
	"status" "subscription_status" DEFAULT 'trial' NOT NULL,
	"expires_at" timestamp,
	"original_purchase_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_checkin" ADD CONSTRAINT "daily_checkin_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_score" ADD CONSTRAINT "health_score_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streak" ADD CONSTRAINT "streak_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan" ADD CONSTRAINT "scan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_answer" ADD CONSTRAINT "scan_answer_scan_id_scan_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_result" ADD CONSTRAINT "scan_result_scan_id_scan_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "chat_message_user_id_idx" ON "chat_message" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_message_created_at_idx" ON "chat_message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "daily_checkin_user_id_idx" ON "daily_checkin" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "daily_checkin_date_idx" ON "daily_checkin" USING btree ("date");--> statement-breakpoint
CREATE INDEX "health_score_user_id_idx" ON "health_score" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "health_score_date_idx" ON "health_score" USING btree ("date");--> statement-breakpoint
CREATE INDEX "streak_user_id_idx" ON "streak" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scan_user_id_idx" ON "scan" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scan_answer_scan_id_idx" ON "scan_answer" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "scan_result_scan_id_idx" ON "scan_result" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "subscription_user_id_idx" ON "subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_revenuecat_user_id_idx" ON "subscription" USING btree ("revenuecat_user_id");