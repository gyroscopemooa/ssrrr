CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `grants` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner`) REFERENCES `members`(`owner`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`delta` integer NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner`) REFERENCES `members`(`owner`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ledger_member_time` ON `ledger` (`owner`,`created_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`owner` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_nickname_unique` ON `members` (`nickname`);--> statement-breakpoint
CREATE TABLE `post_views` (
	`post_id` text NOT NULL,
	`viewer` text NOT NULL,
	`day` text NOT NULL,
	PRIMARY KEY(`post_id`, `viewer`, `day`),
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `previews` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`image_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `previews_url_unique` ON `previews` (`url`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`target` text NOT NULL,
	`post_id` text NOT NULL,
	`media_id` text,
	`cost` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner`) REFERENCES `members`(`owner`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_owner_target` ON `purchases` (`owner`,`target`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `views` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TRIGGER purchases_validate BEFORE INSERT ON purchases BEGIN
 SELECT CASE WHEN NEW.cost<1 OR COALESCE((SELECT points FROM members WHERE owner=NEW.owner),-1)<NEW.cost THEN RAISE(ABORT,'INSUFFICIENT_POINTS') END;
END;
--> statement-breakpoint
CREATE TRIGGER purchases_debit AFTER INSERT ON purchases BEGIN
 UPDATE members SET points=points-NEW.cost WHERE owner=NEW.owner;
 INSERT INTO ledger(id,owner,delta,reason,created_at) VALUES('purchase:'||NEW.id,NEW.owner,-NEW.cost,'자료 다운로드',NEW.created_at);
END;
--> statement-breakpoint
CREATE TRIGGER grants_credit AFTER INSERT ON grants BEGIN
 SELECT CASE WHEN NEW.amount<1 THEN RAISE(ABORT,'INVALID_GRANT') END;
 UPDATE members SET points=points+NEW.amount WHERE owner=NEW.owner;
 INSERT INTO ledger(id,owner,delta,reason,created_at) VALUES('grant:'||NEW.id,NEW.owner,NEW.amount,NEW.reason,NEW.created_at);
 INSERT INTO audit(id,actor,action,created_at) VALUES('grant:'||NEW.id,NEW.actor,'포인트 지급 '||NEW.amount||'P / '||NEW.reason,NEW.created_at);
END;
--> statement-breakpoint
CREATE TRIGGER members_signup AFTER INSERT ON members BEGIN
 SELECT CASE WHEN NEW.points<0 THEN RAISE(ABORT,'INVALID_BALANCE') END;
 INSERT INTO ledger(id,owner,delta,reason,created_at) VALUES('signup:'||NEW.owner,NEW.owner,NEW.points,'가입 포인트',NEW.created_at);
END;
--> statement-breakpoint
CREATE TRIGGER views_increment AFTER INSERT ON post_views BEGIN
 UPDATE posts SET views=views+1 WHERE id=NEW.post_id;
END;

