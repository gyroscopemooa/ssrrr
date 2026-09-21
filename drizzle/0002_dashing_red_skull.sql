CREATE TABLE `auto_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`external_id` text NOT NULL,
	`canonical_url` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`published_at` integer,
	`first_seen_at` integer NOT NULL,
	`first_seen_run_id` text NOT NULL,
	`last_seen_at` integer NOT NULL,
	`selected_at` integer,
	`used_at` integer,
	`score` integer NOT NULL,
	`metrics` text NOT NULL,
	`title_hash` text NOT NULL,
	`body_hash` text NOT NULL,
	`media_hash` text NOT NULL,
	`duplicate_of` text NOT NULL,
	`status` text NOT NULL,
	`reason` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_external` ON `auto_candidates` (`source_id`,`external_id`);--> statement-breakpoint
CREATE INDEX `candidate_pool` ON `auto_candidates` (`status`,`first_seen_at`);--> statement-breakpoint
CREATE INDEX `candidate_title` ON `auto_candidates` (`title_hash`);--> statement-breakpoint
CREATE INDEX `candidate_body` ON `auto_candidates` (`body_hash`);--> statement-breakpoint
CREATE TABLE `auto_post_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`source_id` text NOT NULL,
	`scheduled_at` integer NOT NULL,
	`day` text NOT NULL,
	`status` text NOT NULL,
	`attempts` integer NOT NULL,
	`last_error` text NOT NULL,
	`post_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `candidate_job` ON `auto_post_jobs` (`candidate_id`);--> statement-breakpoint
CREATE INDEX `source_daily` ON `auto_post_jobs` (`source_id`,`day`);--> statement-breakpoint
CREATE INDEX `auto_due` ON `auto_post_jobs` (`status`,`scheduled_at`);--> statement-breakpoint
CREATE TABLE `auto_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`config` text NOT NULL,
	`enabled` integer NOT NULL,
	`tested_at` integer,
	`last_run_at` integer,
	`last_success_at` integer,
	`last_error` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crawl_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`status` text NOT NULL,
	`counts` text NOT NULL,
	`error` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer
);
--> statement-breakpoint
CREATE TABLE `email_ingest_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_message_id` text NOT NULL,
	`message_id` text NOT NULL,
	`subject` text NOT NULL,
	`received_at` integer NOT NULL,
	`content_hash` text NOT NULL,
	`parsed_title` text NOT NULL,
	`parsed_body` text NOT NULL,
	`privacy_status` text NOT NULL,
	`privacy_reasons` text NOT NULL,
	`status` text NOT NULL,
	`post_id` text,
	`error` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mail_message` ON `email_ingest_messages` (`message_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `mail_content` ON `email_ingest_messages` (`content_hash`);--> statement-breakpoint
CREATE TABLE `job_events` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`stage` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_job` ON `job_events` (`job_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `ops_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`revision` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shorts_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`license_note` text NOT NULL,
	`active` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shorts_job_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`post_id` text NOT NULL,
	`sequence` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `short_post` ON `shorts_job_posts` (`post_id`);--> statement-breakpoint
CREATE TABLE `shorts_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`config` text NOT NULL,
	`plan` text NOT NULL,
	`progress` integer NOT NULL,
	`error` text NOT NULL,
	`retry_count` integer NOT NULL,
	`approved_at` integer,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `shorts_locks` (
	`post_id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shorts_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`publication_id` text NOT NULL,
	`measured_at` integer NOT NULL,
	`views` integer NOT NULL,
	`likes` integer NOT NULL,
	`comments` integer NOT NULL,
	`raw` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `metrics_publication` ON `shorts_metrics` (`publication_id`,`measured_at`);--> statement-breakpoint
CREATE TABLE `shorts_outputs` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`storage_key` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`fps` integer NOT NULL,
	`duration_ms` integer NOT NULL,
	`file_size` integer NOT NULL,
	`audio_mode` text NOT NULL,
	`qc_status` text NOT NULL,
	`qc_json` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `output_job` ON `shorts_outputs` (`job_id`);--> statement-breakpoint
CREATE TABLE `shorts_publications` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`external_id` text NOT NULL,
	`privacy` text NOT NULL,
	`status` text NOT NULL,
	`scheduled_at` integer,
	`published_at` integer,
	`metadata` text NOT NULL,
	`upload_session` text NOT NULL,
	`last_synced_at` integer,
	`created_at` integer NOT NULL,
	`error` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `publication_job` ON `shorts_publications` (`job_id`);--> statement-breakpoint
CREATE TABLE `system_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `worker_health` (
	`id` text PRIMARY KEY NOT NULL,
	`last_seen_at` integer NOT NULL,
	`capabilities` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `worker_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`ref_id` text NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`attempts` integer NOT NULL,
	`max_attempts` integer NOT NULL,
	`run_at` integer NOT NULL,
	`lease_token` text,
	`lease_until` integer,
	`error` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `task_due` ON `worker_tasks` (`status`,`run_at`);--> statement-breakpoint
CREATE INDEX `task_ref` ON `worker_tasks` (`kind`,`ref_id`,`status`);--> statement-breakpoint
ALTER TABLE `comments` ADD `origin` text DEFAULT 'local' NOT NULL;--> statement-breakpoint
ALTER TABLE `comments` ADD `source_id` text;--> statement-breakpoint
ALTER TABLE `comments` ADD `external_comment_id` text;--> statement-breakpoint
ALTER TABLE `comments` ADD `imported_at` integer;--> statement-breakpoint
ALTER TABLE `posts` ADD `system_author` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `source_candidate` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `short_excluded` integer DEFAULT 0 NOT NULL;