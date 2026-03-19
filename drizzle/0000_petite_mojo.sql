CREATE TABLE `locations` (
	`locationId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`seriesId` integer NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`altitude` real,
	`accuracy` real,
	`timestamp` text NOT NULL,
	`weight` real DEFAULT 1,
	FOREIGN KEY (`seriesId`) REFERENCES `series`(`seriesId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_locations_seriesId` ON `locations` (`seriesId`);--> statement-breakpoint
CREATE TABLE `series` (
	`seriesId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`city` text,
	`country` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`isActive` integer DEFAULT 0,
	`pointCount` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
