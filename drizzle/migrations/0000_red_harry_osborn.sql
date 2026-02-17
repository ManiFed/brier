CREATE TABLE `benchmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`market_id` text NOT NULL,
	`probability` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ingestion_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`exchange` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`markets_fetched` integer DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`id` text PRIMARY KEY NOT NULL,
	`external_id` text NOT NULL,
	`exchange` text NOT NULL,
	`title` text NOT NULL,
	`topic` text NOT NULL,
	`series` text,
	`outcome` integer,
	`resolved_at` integer,
	`status` text NOT NULL,
	`volume` real,
	`liquidity` real,
	`created_at` integer NOT NULL,
	`tags` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_markets_exchange` ON `markets` (`exchange`);--> statement-breakpoint
CREATE INDEX `idx_markets_topic` ON `markets` (`topic`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_markets_exchange_external_id` ON `markets` (`exchange`,`external_id`);--> statement-breakpoint
CREATE TABLE `probability_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`market_id` text NOT NULL,
	`probability` real NOT NULL,
	`observed_at` integer NOT NULL,
	FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_observations_market_observed` ON `probability_observations` (`market_id`,`observed_at`);