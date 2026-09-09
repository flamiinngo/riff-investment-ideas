CREATE TABLE `idea_allocations` (
	`idea_id` text NOT NULL,
	`position` integer NOT NULL,
	`symbol` text NOT NULL,
	`company` text NOT NULL,
	`weight` integer NOT NULL,
	`available` integer NOT NULL,
	PRIMARY KEY(`idea_id`, `position`),
	FOREIGN KEY (`idea_id`) REFERENCES `ideas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_idea_allocations_symbol` ON `idea_allocations` (`idea_id`,`symbol`);--> statement-breakpoint
CREATE TABLE `ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`client_request_id` text NOT NULL,
	`creator_address` text NOT NULL,
	`creator_handle` text NOT NULL,
	`creator_name` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`thesis` text NOT NULL,
	`category` text DEFAULT 'COMMUNITY' NOT NULL,
	`parent_idea_id` text,
	`version` integer NOT NULL,
	`allocation_hash` text NOT NULL,
	`lineage_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`status` text DEFAULT 'published' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ideas_client_request_id` ON `ideas` (`client_request_id`);--> statement-breakpoint
CREATE INDEX `idx_ideas_created_at` ON `ideas` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_ideas_creator_created` ON `ideas` (`creator_address`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_ideas_parent` ON `ideas` (`parent_idea_id`);