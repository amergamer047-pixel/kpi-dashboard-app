ALTER TABLE `kpi_categories` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `kpi_categories` MODIFY COLUMN `departmentId` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `kpi_categories` MODIFY COLUMN `departmentId` int;--> statement-breakpoint
ALTER TABLE `kpi_indicators` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `kpi_indicators` MODIFY COLUMN `departmentId` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `kpi_indicators` MODIFY COLUMN `departmentId` int;