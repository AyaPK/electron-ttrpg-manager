CREATE TABLE `encounter_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`encounter_id` text NOT NULL,
	`name` text NOT NULL,
	`cr` text DEFAULT '1' NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`notes` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `encounter_groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `encounter_entries_group_id_idx` ON `encounter_entries` (`group_id`);--> statement-breakpoint
CREATE INDEX `encounter_entries_encounter_id_idx` ON `encounter_entries` (`encounter_id`);--> statement-breakpoint
CREATE TABLE `encounter_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `encounter_groups_encounter_id_idx` ON `encounter_groups` (`encounter_id`);--> statement-breakpoint
CREATE TABLE `encounters` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `encounters_campaign_id_idx` ON `encounters` (`campaign_id`);