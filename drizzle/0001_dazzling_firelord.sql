CREATE TABLE `dashboard_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectName` varchar(255) DEFAULT 'Healthcare KPI Dashboard',
	`projectStatus` enum('on_track','at_risk','off_track') DEFAULT 'on_track',
	`plannedBudget` decimal(12,2),
	`actualBudget` decimal(12,2),
	`pendingDecisions` int DEFAULT 0,
	`pendingActions` int DEFAULT 0,
	`pendingChangeRequests` int DEFAULT 0,
	`chartPreferences` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `dashboard_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(7) DEFAULT '#3B82F6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`departmentId` int NOT NULL,
	`templateId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`assignedTo` varchar(255),
	`startDate` timestamp,
	`endDate` timestamp,
	`targetValue` decimal(10,2),
	`actualValue` decimal(10,2),
	`unit` varchar(50),
	`status` enum('not_started','in_progress','complete','overdue','on_hold') NOT NULL DEFAULT 'not_started',
	`risk` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`comments` text,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kpi_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`unit` varchar(50),
	`targetValue` decimal(10,2),
	`isSystemTemplate` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kpi_templates_id` PRIMARY KEY(`id`)
);
