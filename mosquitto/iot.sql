DROP DATABASE IF EXISTS `testing_iot`;

-- Create database
CREATE DATABASE `testing_iot` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_general_ci;

-- Use the database
USE `testing_iot`;

-- Create device_types table
CREATE TABLE `device_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_device_types_name` (`type_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create devices table
CREATE TABLE `devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` varchar(50) NOT NULL,
  `device_type_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_devices_device_id` (`device_id`),
  KEY `IX_devices_type` (`device_type_id`),
  KEY `IX_devices_active` (`is_active`),
  CONSTRAINT `FK_devices_device_type` FOREIGN KEY (`device_type_id`) REFERENCES `device_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create users table
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `role` varchar(20) NOT NULL,
  `otp` varchar(10) DEFAULT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create sensor_data table
CREATE TABLE `sensor_data` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `device_id` int(11) NOT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IX_sensor_data_device_timestamp` (`device_id`,`timestamp`),
  KEY `IX_sensor_data_timestamp` (`timestamp`),
  CONSTRAINT `FK_sensor_data_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create sla_breaches table
CREATE TABLE `sla_breaches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` int(11) NOT NULL,
  `timestamp` datetime NOT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `status` varchar(100) NOT NULL,
  `breach_type` varchar(50) DEFAULT NULL,
  `severity` varchar(20) DEFAULT 'Medium',
  `resolved` tinyint(1) NOT NULL DEFAULT 0,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IX_sla_breaches_device_timestamp` (`device_id`,`timestamp`),
  KEY `IX_sla_breaches_status` (`status`),
  KEY `IX_sla_breaches_resolved` (`resolved`),
  CONSTRAINT `FK_sla_breaches_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert data into device_types
INSERT INTO `device_types` (`id`, `type_name`, `description`) VALUES
(1, 'bluetooth', 'Bluetooth connected IoT devices'),
(2, 'wifi', 'WiFi connected IoT devices'),
(3, 'sigfox1', 'Sigfox protocol devices - Type 1'),
(4, 'sigfox2', 'Sigfox protocol devices - Type 2'),
(5, 'admin', 'Administrative devices');

-- Insert data into devices
INSERT INTO `devices` (`id`, `device_id`, `device_type_id`, `name`, `is_active`, `created_date`) VALUES
(1, 'fipy-bluetooth-unit-01', 1, 'FiPy Bluetooth Unit 01', 1, '2025-07-02 15:39:25'),
(2, 'fipy-wifi-unit-01', 2, 'FiPy WiFi Unit 01', 1, '2025-07-02 15:39:25'),
(3, '24C0A467', 3, 'Sigfox Device 24C0A467', 1, '2025-07-02 15:39:25');

-- Insert data into users
INSERT INTO `users` (`id`, `email`, `password`, `role`, `otp`, `created_date`, `is_active`) VALUES
(1, '22007441@myrp.edu.sg', 'krish', 'sigfox1', NULL, '2025-07-02 15:39:25', 1),
(2, '23036145@myrp.edu.sg', 'sigfox2pass', 'sigfox2', NULL, '2025-07-02 15:39:25', 1),
(3, '23018682@myrp.edu.sg', 'wifipass', 'wifi', NULL, '2025-07-02 15:39:25', 1),
(4, '23031663@myrp.edu.sg', 'btpass', 'bluetooth', NULL, '2025-07-02 15:39:25', 1),
(5, 'krishnavijayan189@gmail.com', 'krish', 'admin', NULL, '2025-07-02 15:39:25', 1);

-- Insert data into sensor_data
INSERT INTO `sensor_data` (`id`, `device_id`, `temperature`, `humidity`, `timestamp`, `created_date`) VALUES
(1, 1, 30, 45, '2024-05-28 12:00:28', '2025-07-02 15:39:26'),
(2, 1, 33, 60, '2024-05-28 12:00:40', '2025-07-02 15:39:26'),
(3, 2, 48.4854, 33.074, '2024-05-28 08:54:11', '2025-07-02 15:39:26'),
(4, 3, 38, 47, '2024-05-28 12:40:00', '2025-07-02 15:39:26'),
(5, 3, 38, 2, '2024-05-28 12:41:00', '2025-07-02 15:39:26'),
(6, 3, 38, 2, '2024-05-28 12:42:00', '2025-07-02 15:39:26'),
(7, 3, 38, 2, '2024-05-28 12:43:00', '2025-07-02 15:39:26'),
(8, 3, 38, 2, '2024-05-28 12:44:00', '2025-07-02 15:39:26'),
(9, 3, 38, 2, '2024-05-28 12:45:00', '2025-07-02 15:39:26'),
(10, 3, 38, 2, '2024-05-28 12:46:00', '2025-07-02 15:39:26');

-- Insert data into sla_breaches
INSERT INTO `sla_breaches` (`id`, `device_id`, `timestamp`, `temperature`, `humidity`, `status`, `breach_type`, `severity`, `resolved`, `created_date`) VALUES
(1, 2, '2024-05-28 08:31:51', 49.1396, 33.1731, 'High Temp', 'Temperature', 'High', 0, '2025-07-02 15:39:26'),
(2, 2, '2024-05-28 08:37:35', 49.3434, 33.3791, 'High Temp', 'Temperature', 'High', 0, '2025-07-02 15:39:26'),
(3, 2, '2024-05-28 08:40:30', 49.8153, 32.2195, 'High Temp', 'Temperature', 'High', 0, '2025-07-02 15:39:26'),
(4, 2, '2024-05-28 08:54:11', 48.4854, 33.074, 'High Temp', 'Temperature', 'High', 0, '2025-07-02 15:39:26');

-- Reset AUTO_INCREMENT values
ALTER TABLE `device_types` AUTO_INCREMENT = 6;
ALTER TABLE `devices` AUTO_INCREMENT = 4;
ALTER TABLE `users` AUTO_INCREMENT = 6;
ALTER TABLE `sensor_data` AUTO_INCREMENT = 11;
ALTER TABLE `sla_breaches` AUTO_INCREMENT = 5;