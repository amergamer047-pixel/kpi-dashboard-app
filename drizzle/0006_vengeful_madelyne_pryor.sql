CREATE TABLE `dashboard_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`title` varchar(255) DEFAULT 'Shared Dashboard',
	`description` text,
	`passwordHash` varchar(255),
	`isPublic` int DEFAULT 1,
	`expiresAt` timestamp,
	`viewCount` int DEFAULT 0,
	`lastViewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `dashboard_shares_token_unique` UNIQUE(`token`)
);
