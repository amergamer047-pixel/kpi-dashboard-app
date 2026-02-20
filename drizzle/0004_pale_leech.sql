ALTER TABLE `kpi_categories` MODIFY COLUMN `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `kpi_indicators` MODIFY COLUMN `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `kpi_categories` ADD `departmentId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `kpi_indicators` ADD `departmentId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `kpi_categories` DROP COLUMN `isSystemCategory`;--> statement-breakpoint
ALTER TABLE `kpi_indicators` DROP COLUMN `isSystemIndicator`;