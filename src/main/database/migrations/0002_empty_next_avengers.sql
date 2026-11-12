CREATE TABLE `entities` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`visibility` text DEFAULT 'campaign' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `entities_campaign_id_idx` ON `entities` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `entities_type_idx` ON `entities` (`type`);