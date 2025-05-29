-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 28, 2025 at 05:46 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
-- Table structure for table `bluetooth_data`
--

CREATE TABLE `bluetooth_data` (
  `id` int(11) NOT NULL,
  `device_id` varchar(50) DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bluetooth_data`
--

INSERT INTO `bluetooth_data` (`id`, `device_id`, `temperature`, `humidity`, `timestamp`) VALUES
(3, 'fipy-bluetooth-unit-01', 30, 45, '1970-01-01 00:00:28'),
(4, 'fipy-bluetooth-unit-01', 33, 60, '1970-01-01 00:00:40');

-- --------------------------------------------------------

--
-- Table structure for table `sigfox1_data`
--

CREATE TABLE `sigfox1_data` (
  `id` int(11) NOT NULL,
  `device_id` varchar(50) DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sigfox1_data`
--

INSERT INTO `sigfox1_data` (`id`, `device_id`, `temperature`, `humidity`, `timestamp`) VALUES
(1, '24C0A467', 38, 47, '2024-05-28 12:40:00'),
(2, '24C0A467', 38, 2, '2024-05-28 12:40:00'),
(3, '24C0A467', 38, 2, '2024-05-28 12:40:00'),
(4, '24C0A467', 38, 2, '2024-05-28 12:40:00'),
(5, '24C0A467', 38, 2, '2024-05-28 12:40:00'),
(6, '24C0A467', 38, 2, '2024-05-28 12:40:00'),
(7, '24C0A467', 38, 2, '2024-05-28 12:40:00');

-- --------------------------------------------------------

--
-- Table structure for table `sigfox2_data`
--

CREATE TABLE `sigfox2_data` (
  `id` int(11) NOT NULL,
  `device_id` varchar(50) DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sla_breaches_admin`
--

CREATE TABLE `sla_breaches_admin` (
  `id` int(11) NOT NULL,
  `device_id` varchar(100) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `status` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sla_breaches_bluetooth`
--

CREATE TABLE `sla_breaches_bluetooth` (
  `id` int(11) NOT NULL,
  `device_id` varchar(100) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `status` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sla_breaches_sigfox1`
--

CREATE TABLE `sla_breaches_sigfox1` (
  `id` int(11) NOT NULL,
  `device_id` varchar(100) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `status` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sla_breaches_sigfox2`
--

CREATE TABLE `sla_breaches_sigfox2` (
  `id` int(11) NOT NULL,
  `device_id` varchar(100) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `status` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sla_breaches_wifi`
--

CREATE TABLE `sla_breaches_wifi` (
  `id` int(11) NOT NULL,
  `device_id` varchar(100) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `status` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sla_breaches_wifi`
--

INSERT INTO `sla_breaches_wifi` (`id`, `device_id`, `timestamp`, `temperature`, `humidity`, `status`) VALUES
(1, 'fipy-wifi-unit-01', '1970-01-01 08:31:51', 49.1396, 33.1731, 'High Temp'),
(2, 'fipy-wifi-unit-01', '1970-01-01 08:37:35', 49.3434, 33.3791, 'High Temp'),
(3, 'fipy-wifi-unit-01', '1970-01-01 08:40:30', 49.8153, 32.2195, 'High Temp'),
(4, 'fipy-wifi-unit-01', '1970-01-01 08:54:11', 48.4854, 33.074, 'High Temp');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `role` varchar(20) NOT NULL,
  `otp` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `role`, `otp`) VALUES
(1, '22007441@myrp.edu.sg', 'krish', 'sigfox1', NULL),
(2, '23036145@myrp.edu.sg', 'sigfox2pass', 'sigfox2', NULL),
(3, '23018682@myrp.edu.sg', 'wifipass', 'wifi', NULL),
(4, '23031663@myrp.edu.sg', 'btpass', 'bluetooth', NULL),
(5, 'krishnavijayan189@gmail.com', 'krish', 'admin', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `wifi_data`
--

CREATE TABLE `wifi_data` (
  `id` int(11) NOT NULL,
  `device_id` varchar(50) DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wifi_data`
--

INSERT INTO `wifi_data` (`id`, `device_id`, `temperature`, `humidity`, `timestamp`) VALUES
(1, 'fipy-wifi-unit-01', 48.4854, 33.074, '1970-01-01 00:54:11');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bluetooth_data`
--
ALTER TABLE `bluetooth_data`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sigfox1_data`
--
ALTER TABLE `sigfox1_data`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sigfox2_data`
--
ALTER TABLE `sigfox2_data`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sla_breaches_admin`
--
ALTER TABLE `sla_breaches_admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sla_breaches_bluetooth`
--
ALTER TABLE `sla_breaches_bluetooth`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sla_breaches_sigfox1`
--
ALTER TABLE `sla_breaches_sigfox1`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sla_breaches_sigfox2`
--
ALTER TABLE `sla_breaches_sigfox2`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sla_breaches_wifi`
--
ALTER TABLE `sla_breaches_wifi`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `wifi_data`
--
ALTER TABLE `wifi_data`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bluetooth_data`
--
ALTER TABLE `bluetooth_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `sigfox1_data`
--
ALTER TABLE `sigfox1_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `sigfox2_data`
--
ALTER TABLE `sigfox2_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sla_breaches_admin`
--
ALTER TABLE `sla_breaches_admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sla_breaches_bluetooth`
--
ALTER TABLE `sla_breaches_bluetooth`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sla_breaches_sigfox1`
--
ALTER TABLE `sla_breaches_sigfox1`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sla_breaches_sigfox2`
--
ALTER TABLE `sla_breaches_sigfox2`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sla_breaches_wifi`
--
ALTER TABLE `sla_breaches_wifi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `wifi_data`
--
ALTER TABLE `wifi_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
