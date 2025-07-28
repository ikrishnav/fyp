SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

DROP TABLE IF EXISTS `devices`;
CREATE TABLE IF NOT EXISTS `devices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `device_type_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_devices_device_id` (`device_id`),
  KEY `IX_devices_type` (`device_type_id`),
  KEY `IX_devices_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `device_types`;
CREATE TABLE IF NOT EXISTS `device_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_device_types_name` (`type_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `sensor_data`;
CREATE TABLE IF NOT EXISTS `sensor_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `device_id` int NOT NULL,
  `temperature` float DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'Paris',
  `humidity` float DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IX_sensor_data_device_timestamp` (`device_id`,`timestamp`),
  KEY `IX_sensor_data_timestamp` (`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `sla_breaches`;
CREATE TABLE IF NOT EXISTS `sla_breaches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `device_id` int NOT NULL,
  `timestamp` datetime NOT NULL,
  `temperature` float DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'Paris',
  `humidity` float DEFAULT NULL,
  `status` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `breach_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `severity` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'Medium',
  `resolved` tinyint(1) NOT NULL DEFAULT '0',
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IX_sla_breaches_device_timestamp` (`device_id`,`timestamp`),
  KEY `IX_sla_breaches_status` (`status`),
  KEY `IX_sla_breaches_resolved` (`resolved`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `otp` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `devices`
  ADD CONSTRAINT `FK_devices_device_type` FOREIGN KEY (`device_type_id`) REFERENCES `device_types` (`id`);

ALTER TABLE `sensor_data`
  ADD CONSTRAINT `FK_sensor_data_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`);

ALTER TABLE `sla_breaches`
  ADD CONSTRAINT `FK_sla_breaches_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`);

COMMIT;
