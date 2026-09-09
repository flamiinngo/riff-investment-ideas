CREATE TABLE `auth_nonces` (
	`nonce` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_nonces_expires_at` ON `auth_nonces` (`expires_at`);--> statement-breakpoint
CREATE TABLE `follows` (
	`user_address` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_address`, `target_type`, `target_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_follows_target` ON `follows` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`address` text PRIMARY KEY NOT NULL,
	`handle` text NOT NULL,
	`display_name` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_handle` ON `profiles` (`handle`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`address` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_address` ON `sessions` (`address`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);