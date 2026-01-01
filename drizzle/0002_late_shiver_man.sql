CREATE TABLE `kpi_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`sortOrder` int DEFAULT 0,
	`isSystemCategory` int DEFAULT 0,
	`requiresPatientInfo` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kpi_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_indicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`categoryId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`unit` varchar(50) DEFAULT 'cases',
	`targetValue` decimal(10,2),
	`sortOrder` int DEFAULT 0,
	`isSystemIndicator` int DEFAULT 0,
	`requiresPatientInfo` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kpi_indicators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthly_kpi_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`departmentId` int NOT NULL,
	`indicatorId` int NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`value` decimal(10,2) DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthly_kpi_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`departmentId` int NOT NULL,
	`indicatorId` int NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`hospitalId` varchar(100) NOT NULL,
	`patientName` varchar(255) NOT NULL,
	`caseDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patient_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quarterly_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`departmentId` int NOT NULL,
	`year` int NOT NULL,
	`quarter` int NOT NULL,
	`status` enum('draft','submitted','approved') DEFAULT 'draft',
	`submittedAt` timestamp,
	`approvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quarterly_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `dashboard_settings`;--> statement-breakpoint
DROP TABLE `kpi_entries`;--> statement-breakpoint
DROP TABLE `kpi_templates`;