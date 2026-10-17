CREATE TABLE `external_video_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`source_key` text NOT NULL,
	`provider` text NOT NULL,
	`source_url` text NOT NULL,
	`creator` text NOT NULL,
	`rights_basis` text NOT NULL,
	`media_id` text NOT NULL,
	`verified_by` text NOT NULL,
	`verified_at` integer NOT NULL,
	`status` text NOT NULL,
	`error` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_video_post_source` ON `external_video_sources` (`post_id`,`source_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `external_video_media` ON `external_video_sources` (`media_id`);--> statement-breakpoint
CREATE INDEX `external_video_post` ON `external_video_sources` (`post_id`,`status`);