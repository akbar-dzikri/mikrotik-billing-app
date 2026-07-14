CREATE TABLE "delivery_log" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"response" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mikrotik_config" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"host" text NOT NULL,
	"port" integer DEFAULT 8729 NOT NULL,
	"use_https" boolean DEFAULT true NOT NULL,
	"username" text NOT NULL,
	"password_enc" text NOT NULL,
	"default_profile" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"package_id" text NOT NULL,
	"customer_name" text NOT NULL,
	"wa_number" text NOT NULL,
	"amount_idr" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_ref" text,
	"paid_at" timestamp with time zone,
	"fulfilled_at" timestamp with time zone,
	"mikrotik_synced_at" timestamp with time zone,
	"mikrotik_error" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "store_package" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"plan_id" text,
	"price_idr" integer NOT NULL,
	"duration_label" text NOT NULL,
	"hotspot_profile" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "store_voucher" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"hotspot_profile" text,
	"mikrotik_synced_at" timestamp with time zone,
	"mikrotik_error" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"brand_color" text,
	"wa_support" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tenant_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "wa_config" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"cloud_phone_id" text,
	"cloud_token_enc" text,
	"cloud_template_name" text,
	"fonnte_token_enc" text,
	"wablas_token_enc" text,
	"wablas_domain" text,
	"provider_order" text[],
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "delivery_log" ADD CONSTRAINT "delivery_log_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_log" ADD CONSTRAINT "delivery_log_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mikrotik_config" ADD CONSTRAINT "mikrotik_config_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_package_id_store_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."store_package"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_package" ADD CONSTRAINT "store_package_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_package" ADD CONSTRAINT "store_package_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_voucher" ADD CONSTRAINT "store_voucher_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_voucher" ADD CONSTRAINT "store_voucher_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wa_config" ADD CONSTRAINT "wa_config_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;