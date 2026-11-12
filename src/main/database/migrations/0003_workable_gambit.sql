CREATE TABLE `relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`source_entity_id` text NOT NULL,
	`target_entity_id` text NOT NULL,
	`relationship_type` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `relationships_campaign_id_idx` ON `relationships` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `relationships_source_entity_id_idx` ON `relationships` (`source_entity_id`);--> statement-breakpoint
CREATE INDEX `relationships_target_entity_id_idx` ON `relationships` (`target_entity_id`);