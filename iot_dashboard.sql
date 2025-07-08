-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 08, 2025 at 06:46 PM
-- Server version: 8.2.0
-- PHP Version: 8.2.13

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `iot_dashboard`
--

-- --------------------------------------------------------

--
-- Table structure for table `devices`
--

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

--
-- Dumping data for table `devices`
--

INSERT INTO `devices` (`id`, `device_id`, `device_type_id`, `name`, `is_active`, `created_date`) VALUES
(1, 'fipy-bluetooth-unit-01', 1, 'FiPy Bluetooth Unit 01', 1, '2025-07-02 15:39:25'),
(2, 'fipy-wifi-unit-01', 2, 'FiPy WiFi Unit 01', 1, '2025-07-02 15:39:25'),
(3, '24C0A467', 3, 'Sigfox Device 24C0A467', 1, '2025-07-02 15:39:25');

-- --------------------------------------------------------

--
-- Table structure for table `device_types`
--

DROP TABLE IF EXISTS `device_types`;
CREATE TABLE IF NOT EXISTS `device_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_device_types_name` (`type_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `device_types`
--

INSERT INTO `device_types` (`id`, `type_name`, `description`) VALUES
(1, 'bluetooth', 'Bluetooth connected IoT devices'),
(2, 'wifi', 'WiFi connected IoT devices'),
(3, 'sigfox1', 'Sigfox protocol devices - Type 1'),
(4, 'sigfox2', 'Sigfox protocol devices - Type 2'),
(5, 'admin', 'Administrative devices');

-- --------------------------------------------------------

--
-- Table structure for table `sensor_data`
--

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

--
-- Dumping data for table `sensor_data`
--

INSERT INTO `sensor_data` (`id`, `device_id`, `temperature`, `city`, `humidity`, `timestamp`, `created_date`) VALUES
(1, 1, 30, 'Paris', 45, '2024-05-28 12:00:28', '2025-07-02 15:39:26'),
(2, 1, 33, 'Paris', 60, '2024-05-28 12:00:40', '2025-07-02 15:39:26'),
(3, 2, 48.4854, 'Paris', 33.074, '2024-05-28 08:54:11', '2025-07-02 15:39:26'),
(4, 3, 38, 'Paris', 47, '2024-05-28 12:40:00', '2025-07-02 15:39:26'),
(5, 3, 38, 'Paris', 2, '2024-05-28 12:41:00', '2025-07-02 15:39:26'),
(6, 3, 38, 'Paris', 2, '2024-05-28 12:42:00', '2025-07-02 15:39:26'),
(7, 3, 38, 'Paris', 2, '2024-05-28 12:43:00', '2025-07-02 15:39:26'),
(8, 3, 38, 'Paris', 2, '2024-05-28 12:44:00', '2025-07-02 15:39:26'),
(9, 3, 38, 'Paris', 2, '2024-05-28 12:45:00', '2025-07-02 15:39:26'),
(10, 3, 38, 'Paris', 2, '2024-05-28 12:46:00', '2025-07-02 15:39:26');

-- --------------------------------------------------------

--
-- Table structure for table `sla_breaches`
--

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

--
-- Dumping data for table `sla_breaches`
--

INSERT INTO `sla_breaches` (`id`, `device_id`, `timestamp`, `temperature`, `city`, `humidity`, `status`, `breach_type`, `severity`, `resolved`, `created_date`) VALUES
(1, 2, '2024-05-28 08:31:51', 49.1396, 'Paris', 33.1731, 'High Temp', 'Temperature', 'High', 0, '2025-07-02 15:39:26'),
(2, 2, '2024-05-28 08:37:35', 49.3434, 'Paris', 33.3791, 'High Temp', 'Temperature', 'High', 0, '2025-07-02 15:39:26'),
(3, 2, '2024-05-28 08:40:30', 49.8153, 'Paris', 32.2195, 'High Temp', 'Temperature', 'High', 0, '2025-07-02 15:39:26'),
(4, 2, '2024-05-28 08:54:11', 48.4854, 'Paris', 33.074, 'High Temp', 'Temperature', 'High', 0, '2025-07-02 15:39:26');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

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

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `role`, `otp`, `created_date`, `is_active`) VALUES
(1, '22007441@myrp.edu.sg', 'krish', 'sigfox1', NULL, '2025-07-02 15:39:25', 1),
(2, '23036145@myrp.edu.sg', 'sigfox2pass', 'sigfox2', NULL, '2025-07-02 15:39:25', 1),
(3, '23018682@myrp.edu.sg', 'wifipass', 'wifi', NULL, '2025-07-02 15:39:25', 1),
(4, '23031663@myrp.edu.sg', 'btpass', 'bluetooth', NULL, '2025-07-02 15:39:25', 1),
(5, 'krishnavijayan189@gmail.com', 'krish', 'admin', NULL, '2025-07-02 15:39:25', 1);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `devices`
--
ALTER TABLE `devices`
  ADD CONSTRAINT `FK_devices_device_type` FOREIGN KEY (`device_type_id`) REFERENCES `device_types` (`id`);

--
-- Constraints for table `sensor_data`
--
ALTER TABLE `sensor_data`
  ADD CONSTRAINT `FK_sensor_data_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`);

--
-- Constraints for table `sla_breaches`
--
ALTER TABLE `sla_breaches`
  ADD CONSTRAINT `FK_sla_breaches_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`);

ALTER TABLE sensor_data ADD COLUMN place_name VARCHAR(100) DEFAULT NULL;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
