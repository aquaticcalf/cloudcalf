CREATE TABLE `projects` (`id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL, `worker_id` text, `name` text NOT NULL, `status` text DEFAULT 'draft' NOT NULL, `production_url` text, `last_deployed_at` integer, `created_at` integer NOT NULL, `updated_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_user_name_unq` ON `projects` (`user_id`,`name`);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_worker_unq` ON `projects` (`worker_id`);
--> statement-breakpoint
CREATE TABLE `deployments` (`id` text PRIMARY KEY NOT NULL, `project_id` text NOT NULL, `status` text NOT NULL, `source` text DEFAULT 'cli' NOT NULL, `error` text, `created_at` integer NOT NULL, `finished_at` integer, FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade);
--> statement-breakpoint
CREATE TABLE `project_resources` (`id` text PRIMARY KEY NOT NULL, `project_id` text NOT NULL, `resource_type` text NOT NULL, `resource_id` text NOT NULL, `created_at` integer NOT NULL, FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_resources_unq` ON `project_resources` (`project_id`,`resource_type`,`resource_id`);
--> statement-breakpoint
CREATE TABLE `billing_accounts` (`user_id` text PRIMARY KEY NOT NULL, `polar_customer_id` text, `tier` text DEFAULT 'free' NOT NULL, `credit_balance` integer DEFAULT 10000 NOT NULL, `currency` text DEFAULT 'USD' NOT NULL, `updated_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (`id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL, `project_id` text, `amount` integer NOT NULL, `kind` text NOT NULL, `description` text NOT NULL, `external_id` text, `created_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade, FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_transactions_external_unq` ON `credit_transactions` (`external_id`);
--> statement-breakpoint
CREATE TABLE `polar_events` (`id` text PRIMARY KEY NOT NULL, `type` text NOT NULL, `processed_at` integer NOT NULL);
