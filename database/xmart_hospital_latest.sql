-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 21, 2026 at 01:22 PM
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
-- Database: `xmart_hospital`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `account_type` varchar(50) NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `hospital_id`, `code`, `name`, `account_type`, `parent_id`) VALUES
(1, 1, '1000', 'Cash', 'ASSET', NULL),
(2, 1, '1100', 'Bank', 'ASSET', NULL),
(3, 1, '1200', 'Inventory', 'ASSET', NULL),
(4, 1, '2000', 'Accounts Payable', 'LIABILITY', NULL),
(5, 1, '3000', 'Capital', 'EQUITY', NULL),
(6, 1, '4000', 'Sales Revenue', 'REVENUE', NULL),
(7, 1, '5000', 'Cost of Goods Sold', 'EXPENSE', NULL),
(8, 1, '5100', 'Hospital Expenses', 'EXPENSE', NULL),
(9, 1, '1050', 'Accounts Receivable', 'ASSET', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `app_settings`
--

CREATE TABLE `app_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `setting_key` varchar(150) NOT NULL,
  `setting_value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `app_settings`
--

INSERT INTO `app_settings` (`id`, `hospital_id`, `setting_key`, `setting_value`) VALUES
(1, 1, 'api_endpoint', 'http://localhost:5001/api'),
(2, 1, 'printer_type', '80mm Thermal'),
(3, 1, 'hospital_name', 'Punjab Hospital '),
(4, 1, 'tax_note', 'Punjab Hospital');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity` varchar(100) DEFAULT NULL,
  `entity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `details`, `created_at`) VALUES
(1, 1, 'UPDATE', 'DOCTOR', 1, '{\"before\":{\"id\":1,\"hospital_id\":1,\"department_id\":1,\"doctor_code\":\"DOC-001\",\"name\":\"Dr. Ahmed Khan\",\"qualification\":\"MBBS\",\"speciality\":\"General Medicine\",\"phone\":null,\"consultation_fee\":500,\"is_active\":1},\"after\":{\"doctor_code\":\"DOC-001\",\"name\":\"Dr. Ahmed Khan\",\"qualification\":\"MBBS\",\"speciality\":\"General Medicine\",\"department_id\":1,\"phone\":null,\"consultation_fee\":500,\"is_active\":1}}', '2026-09-17 15:10:18'),
(2, 1, 'CREATE', 'SALE', 13, '{\"invoice_no\":\"INV-1789657908549\",\"net_total\":10,\"items\":1}', '2026-09-17 15:11:48'),
(3, 1, 'UPDATE', 'DOCTOR', 2, '{\"before\":{\"id\":2,\"hospital_id\":1,\"department_id\":2,\"doctor_code\":\"DOC-002\",\"name\":\"Dr. Sara Ali\",\"qualification\":\"MBBS, FCPS\",\"speciality\":\"Cardiology\",\"phone\":null,\"consultation_fee\":1000,\"is_active\":1},\"after\":{\"doctor_code\":\"DOC-002\",\"name\":\"Dr. Sara Ali\",\"qualification\":\"MBBS, FCPS\",\"speciality\":\"Cardiology\",\"department_id\":2,\"phone\":null,\"consultation_fee\":1000,\"is_active\":1}}', '2026-09-17 15:16:20'),
(4, 1, 'UPDATE', 'DOCTOR', 1, '{\"before\":{\"id\":1,\"hospital_id\":1,\"department_id\":1,\"doctor_code\":\"DOC-001\",\"name\":\"Dr. Ahmed Khan\",\"qualification\":\"MBBS\",\"speciality\":\"General Medicine\",\"phone\":null,\"consultation_fee\":500,\"is_active\":1},\"after\":{\"doctor_code\":\"DOC-001\",\"name\":\"Dr. Ahmed Khan\",\"qualification\":\"MBBS\",\"speciality\":\"General Medicine\",\"department_id\":1,\"phone\":null,\"consultation_fee\":500,\"is_active\":1}}', '2026-09-17 15:16:39'),
(5, 1, 'UPDATE', 'DOCTOR', 2, '{\"before\":{\"id\":2,\"hospital_id\":1,\"department_id\":2,\"doctor_code\":\"DOC-002\",\"name\":\"Dr. Sara Ali\",\"qualification\":\"MBBS, FCPS\",\"speciality\":\"Cardiology\",\"phone\":null,\"consultation_fee\":1000,\"is_active\":1},\"after\":{\"doctor_code\":\"DOC-002\",\"name\":\"Dr. Sara Ali\",\"qualification\":\"MBBS, FCPS\",\"speciality\":\"Cardiology\",\"department_id\":2,\"phone\":null,\"consultation_fee\":1000,\"is_active\":1}}', '2026-09-17 15:16:42'),
(6, 1, 'UPDATE', 'DOCTOR', 1, '{\"before\":{\"id\":1,\"hospital_id\":1,\"department_id\":1,\"doctor_code\":\"DOC-001\",\"name\":\"Dr. Ahmed Khan\",\"qualification\":\"MBBS\",\"speciality\":\"General Medicine\",\"phone\":null,\"consultation_fee\":500,\"is_active\":1},\"after\":{\"doctor_code\":\"DOC-001\",\"name\":\"Dr. Ahmed Khan\",\"qualification\":\"MBBS\",\"speciality\":\"General Medicine\",\"department_id\":1,\"phone\":null,\"consultation_fee\":500,\"is_active\":1}}', '2026-09-17 17:23:12'),
(7, 1, 'CREATE', 'PATIENT', 2, '{\"after\":{\"name\":\"Adnan\",\"cnic\":\"3110193671053\",\"gender\":\"Male\",\"mobile\":\"03328327729\",\"department_id\":4,\"registration_fee\":1000,\"discount\":0,\"paid\":0,\"address\":\"Mehmood street basti sadar din\"}}', '2026-09-17 17:41:19'),
(8, 1, 'UPDATE', 'PATIENT', 2, '{\"before\":{\"id\":2,\"hospital_id\":1,\"patient_no\":\"PAT-2026-000002\",\"name\":\"Adnan\",\"father_husband_name\":null,\"cnic\":\"3110193671053\",\"gender\":\"Male\",\"dob\":null,\"mobile\":\"03328327729\",\"address\":\"Mehmood street basti sadar din\",\"blood_group\":null,\"emergency_contact\":null,\"created_at\":\"2026-09-17T17:41:19.000Z\"},\"after\":{\"name\":\"Adnan\",\"father_husband_name\":null,\"cnic\":\"3110193671053\",\"gender\":\"Male\",\"mobile\":\"03328327729\",\"blood_group\":null,\"emergency_contact\":null,\"address\":\"Mehmood street basti sadar din\"}}', '2026-09-17 17:41:24'),
(9, 1, 'UPDATE', 'DOCTOR', 1, '{\"before\":{\"id\":1,\"hospital_id\":1,\"department_id\":1,\"doctor_code\":\"DOC-001\",\"name\":\"Dr. Ahmed Khan\",\"qualification\":\"MBBS\",\"speciality\":\"General Medicine\",\"phone\":null,\"consultation_fee\":500,\"is_active\":1},\"after\":{\"doctor_code\":\"DOC-001\",\"name\":\"Dr. Ahmed Khan\",\"qualification\":\"MBBS\",\"speciality\":\"General Medicine\",\"department_id\":1,\"phone\":null,\"consultation_fee\":500,\"is_active\":1}}', '2026-09-17 17:41:34'),
(10, 1, 'UPDATE', 'DOCTOR', 2, '{\"before\":{\"id\":2,\"hospital_id\":1,\"department_id\":2,\"doctor_code\":\"DOC-002\",\"name\":\"Dr. Sara Ali\",\"qualification\":\"MBBS, FCPS\",\"speciality\":\"Cardiology\",\"phone\":null,\"consultation_fee\":1000,\"is_active\":1},\"after\":{\"doctor_code\":\"DOC-002\",\"name\":\"Dr. Sara Ali\",\"qualification\":\"MBBS, FCPS\",\"speciality\":\"Cardiology\",\"department_id\":2,\"phone\":null,\"consultation_fee\":1000,\"is_active\":1}}', '2026-09-17 17:41:37'),
(11, 1, 'UPDATE', 'MEDICINE', 2, '{\"before\":{\"id\":2,\"hospital_id\":1,\"category_id\":null,\"manufacturer_id\":null,\"unit_id\":null,\"tax_profile_id\":null,\"hs_code_id\":null,\"name\":\"Brufen 400mg\",\"generic_name\":\"Ibuprofen\",\"strength\":\"400mg\",\"pack_size\":\"20 tablets\",\"barcode\":null,\"reorder_level\":0,\"is_active\":1,\"created_at\":\"2026-09-17T17:44:58.000Z\",\"updated_at\":\"2026-09-17T17:44:58.000Z\"},\"after\":{\"name\":\"Brufen 400mg\",\"generic_name\":\"Ibuprofen\",\"strength\":\"400mg\",\"pack_size\":\"20 tablets\",\"barcode\":null,\"category_id\":2,\"unit_id\":3,\"reorder_level\":0}}', '2026-09-17 17:45:01'),
(12, 1, 'UPDATE', 'PATIENT', 2, '{\"before\":{\"id\":2,\"hospital_id\":1,\"patient_no\":\"PAT-2026-000002\",\"name\":\"Adnan\",\"father_husband_name\":null,\"cnic\":\"3110193671053\",\"gender\":\"Male\",\"dob\":null,\"mobile\":\"03328327729\",\"address\":\"Mehmood street basti sadar din\",\"blood_group\":null,\"emergency_contact\":null,\"created_at\":\"2026-09-17T17:41:19.000Z\"},\"after\":{\"name\":\"Adnan\",\"father_husband_name\":\"Ahmed\",\"cnic\":\"3110193671053\",\"gender\":\"Male\",\"mobile\":\"03328327729\",\"blood_group\":null,\"emergency_contact\":null,\"address\":\"Mehmood street basti sadar din\"}}', '2026-09-18 09:43:05'),
(13, 1, 'CREATE', 'SALE', 14, '{\"invoice_no\":\"INV-1789745690118\",\"net_total\":40,\"items\":1}', '2026-09-18 15:34:50'),
(14, 1, 'CREATE', 'SALE', 15, '{\"invoice_no\":\"INV-1789754709303\",\"net_total\":80,\"items\":1}', '2026-09-18 18:05:09'),
(15, 1, 'CREATE', 'PURCHASE', 3, '{\"invoice_no\":\"TEST123\",\"net_total\":3456,\"items\":1}', '2026-09-19 14:58:27'),
(16, 1, 'CREATE', 'PURCHASE', 4, '{\"invoice_no\":\"23432423423\",\"net_total\":11678,\"items\":1}', '2026-09-20 14:40:24'),
(17, 1, 'CREATE', 'SALE', 16, '{\"invoice_no\":\"INV-1789915255762\",\"net_total\":1730,\"items\":1}', '2026-09-20 14:40:55'),
(18, 1, 'CREATE', 'SALE', 17, '{\"invoice_no\":\"INV-1789915307449\",\"net_total\":2030,\"items\":2}', '2026-09-20 14:41:47'),
(19, 1, 'CREATE', 'SALE', 18, '{\"invoice_no\":\"INV-1789919882812\",\"net_total\":30,\"items\":1}', '2026-09-20 15:58:02'),
(20, 1, 'CREATE', 'SALE', 19, '{\"invoice_no\":\"INV-1789927833534\",\"net_total\":844.9984,\"items\":1}', '2026-09-20 18:10:33'),
(21, 1, 'CREATE', 'SALE', 20, '{\"invoice_no\":\"INV-1789927892534\",\"net_total\":865,\"items\":1}', '2026-09-20 18:11:32'),
(22, 1, 'CREATE', 'PURCHASE', 5, '{\"invoice_no\":\"42423432\",\"net_total\":450.995,\"items\":1}', '2026-09-20 18:17:22'),
(23, 1, 'CREATE', 'SALE', 21, '{\"invoice_no\":\"INV-1789928283422\",\"net_total\":10,\"items\":1}', '2026-09-20 18:18:03');

-- --------------------------------------------------------

--
-- Table structure for table `bank_accounts`
--

CREATE TABLE `bank_accounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED NOT NULL COMMENT 'FK to accounts.id — the ledger account for this bank account',
  `name` varchar(150) NOT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `account_no` varchar(100) DEFAULT NULL,
  `opening_balance` decimal(14,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `hospital_id`, `name`, `code`, `address`, `is_active`) VALUES
(1, 1, 'Main Branch', 'MAIN', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `hospital_id`, `name`, `is_active`) VALUES
(1, 1, 'General Medicine', 1),
(2, 1, 'Cardiology', 1),
(3, 1, 'Gynaecology', 1),
(4, 1, 'Emergency', 1);

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `doctor_code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `qualification` varchar(200) DEFAULT NULL,
  `speciality` varchar(200) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `consultation_fee` decimal(14,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `hospital_id`, `department_id`, `doctor_code`, `name`, `qualification`, `speciality`, `phone`, `consultation_fee`, `is_active`) VALUES
(1, 1, 1, 'DOC-001', 'Dr. Ahmed Khan', 'MBBS', 'General Medicine', NULL, 500.00, 1),
(2, 1, 2, 'DOC-002', 'Dr. Sara Ali', 'MBBS, FCPS', 'Cardiology', NULL, 1000.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `expense_date` date NOT NULL,
  `category` varchar(150) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL,
  `payment_method` varchar(30) DEFAULT 'Cash'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `hospital_id`, `expense_date`, `category`, `description`, `amount`, `payment_method`) VALUES
(1, 1, '2026-09-16', 'AC repair ', 'AC repair ', 300.00, 'Cash'),
(2, 1, '2026-09-19', 'Chair ', 'chair ', 200.00, 'Cash');

-- --------------------------------------------------------

--
-- Table structure for table `hospitals`
--

CREATE TABLE `hospitals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `ntn` varchar(100) DEFAULT NULL,
  `strn` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `hospitals`
--

INSERT INTO `hospitals` (`id`, `name`, `logo_url`, `phone`, `email`, `address`, `ntn`, `strn`, `created_at`, `updated_at`) VALUES
(1, 'Xmart Demo Hospital', NULL, '0300-0000000', NULL, 'Pakistan', NULL, NULL, '2026-09-16 08:48:25', '2026-09-16 08:48:25');

-- --------------------------------------------------------

--
-- Table structure for table `hs_codes`
--

CREATE TABLE `hs_codes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `hs_codes`
--

INSERT INTO `hs_codes` (`id`, `code`, `description`) VALUES
(1, '0000.0000', 'Configure applicable HS code');

-- --------------------------------------------------------

--
-- Table structure for table `journal_entries`
--

CREATE TABLE `journal_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `entry_date` datetime DEFAULT current_timestamp(),
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `narration` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `journal_entries`
--

INSERT INTO `journal_entries` (`id`, `hospital_id`, `entry_date`, `reference_type`, `reference_id`, `narration`) VALUES
(1, 1, '2026-09-16 16:32:56', 'PURCHASE', 1, 'Purchase 36564'),
(2, 1, '2026-09-16 16:34:15', 'SALE', 1, 'Pharmacy sale INV-1789558455125'),
(3, 1, '2026-09-16 16:40:35', 'SALE', 7, 'Pharmacy sale INV-1789558835190'),
(4, 1, '2026-09-17 13:26:04', 'PURCHASE', 2, 'Purchase GTY00001'),
(5, 1, '2026-09-17 13:27:35', 'SALE', 9, 'Pharmacy sale INV-1789633655070'),
(6, 1, '2026-09-17 14:57:14', 'SALE', 11, 'Pharmacy sale INV-1789639034032'),
(7, 1, '2026-09-17 20:11:48', 'SALE', 13, 'Pharmacy sale INV-1789657908549'),
(8, 1, '2026-09-18 20:34:50', 'SALE', 14, 'Pharmacy sale INV-1789745690118'),
(9, 1, '2026-09-18 23:05:09', 'SALE', 15, 'Pharmacy sale INV-1789754709303'),
(10, 1, '2026-09-19 19:58:27', 'PURCHASE', 3, 'Purchase TEST123'),
(11, 1, '2026-09-20 19:40:24', 'PURCHASE', 4, 'Purchase 23432423423'),
(12, 1, '2026-09-20 19:40:55', 'SALE', 16, 'Pharmacy sale INV-1789915255762'),
(13, 1, '2026-09-20 19:41:47', 'SALE', 17, 'Pharmacy sale INV-1789915307449'),
(14, 1, '2026-09-20 20:58:02', 'SALE', 18, 'Pharmacy sale INV-1789919882812'),
(15, 1, '2026-09-20 20:59:34', 'PURCHASE_RETURN', 1, 'Purchase return DN-1789919974755'),
(16, 1, '2026-09-20 21:00:09', 'PAYMENT', 1, 'Payment made'),
(17, 1, '2026-09-20 23:10:33', 'SALE', 19, 'Pharmacy sale INV-1789927833534'),
(18, 1, '2026-09-20 23:11:32', 'SALE', 20, 'Pharmacy sale INV-1789927892534'),
(19, 1, '2026-09-20 23:17:22', 'PURCHASE', 5, 'Purchase 42423432'),
(20, 1, '2026-09-20 23:18:03', 'SALE', 21, 'Pharmacy sale INV-1789928283422');

-- --------------------------------------------------------

--
-- Table structure for table `journal_entry_items`
--

CREATE TABLE `journal_entry_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `journal_entry_id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED NOT NULL,
  `debit` decimal(14,2) DEFAULT 0.00,
  `credit` decimal(14,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `journal_entry_items`
--

INSERT INTO `journal_entry_items` (`id`, `journal_entry_id`, `account_id`, `debit`, `credit`) VALUES
(1, 1, 3, 400.00, 0.00),
(2, 1, 1, 0.00, 0.00),
(3, 1, 4, 0.00, 400.00),
(4, 2, 1, 150.00, 0.00),
(5, 2, 6, 0.00, 150.00),
(6, 2, 3, 60.00, 0.00),
(7, 2, 7, 0.00, 60.00),
(8, 3, 1, 300.00, 0.00),
(9, 3, 6, 0.00, 300.00),
(10, 3, 3, 40.00, 0.00),
(11, 3, 7, 0.00, 40.00),
(12, 4, 3, 30000.00, 0.00),
(13, 4, 1, 0.00, 0.00),
(14, 4, 4, 0.00, 30000.00),
(15, 5, 1, 1500.00, 0.00),
(16, 5, 6, 0.00, 1500.00),
(17, 5, 3, 6000.00, 0.00),
(18, 5, 7, 0.00, 6000.00),
(19, 6, 1, 100.00, 0.00),
(20, 6, 6, 0.00, 100.00),
(21, 6, 3, 3000.00, 0.00),
(22, 6, 7, 0.00, 3000.00),
(23, 7, 1, 10.00, 0.00),
(24, 7, 6, 0.00, 10.00),
(25, 7, 3, 20.00, 0.00),
(26, 7, 7, 0.00, 20.00),
(27, 8, 1, 40.00, 0.00),
(28, 8, 6, 0.00, 40.00),
(29, 8, 3, 6000.00, 0.00),
(30, 8, 7, 0.00, 6000.00),
(31, 9, 1, 80.00, 0.00),
(32, 9, 6, 0.00, 80.00),
(33, 9, 3, 60.00, 0.00),
(34, 9, 7, 0.00, 60.00),
(35, 10, 3, 3456.00, 0.00),
(36, 10, 1, 0.00, 0.00),
(37, 10, 4, 0.00, 3456.00),
(38, 11, 3, 11678.00, 0.00),
(39, 11, 1, 0.00, 11678.00),
(40, 12, 1, 1730.00, 0.00),
(41, 12, 6, 0.00, 1730.00),
(42, 12, 3, 1730.00, 0.00),
(43, 12, 7, 0.00, 1730.00),
(44, 13, 1, 2030.00, 0.00),
(45, 13, 6, 0.00, 2030.00),
(46, 13, 3, 2030.00, 0.00),
(47, 13, 7, 0.00, 2030.00),
(48, 14, 1, 30.00, 0.00),
(49, 14, 6, 0.00, 30.00),
(50, 14, 3, 20.00, 0.00),
(51, 14, 7, 0.00, 20.00),
(52, 15, 4, 4325.00, 0.00),
(53, 15, 3, 0.00, 4325.00),
(54, 16, 4, 6000.00, 0.00),
(55, 16, 1, 0.00, 6000.00),
(56, 17, 1, 845.00, 0.00),
(57, 17, 6, 0.00, 845.00),
(58, 17, 7, 865.00, 0.00),
(59, 17, 3, 0.00, 865.00),
(60, 18, 1, 865.00, 0.00),
(61, 18, 6, 0.00, 865.00),
(62, 18, 7, 865.00, 0.00),
(63, 18, 3, 0.00, 865.00),
(64, 19, 3, 451.00, 0.00),
(65, 19, 1, 0.00, 451.00),
(66, 20, 1, 10.00, 0.00),
(67, 20, 6, 0.00, 10.00),
(68, 20, 7, 10.00, 0.00),
(69, 20, 3, 0.00, 10.00);

-- --------------------------------------------------------

--
-- Table structure for table `manufacturers`
--

CREATE TABLE `manufacturers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `manufacturers`
--

INSERT INTO `manufacturers` (`id`, `hospital_id`, `name`) VALUES
(1, 1, 'Demo Pharma');

-- --------------------------------------------------------

--
-- Table structure for table `medicines`
--

CREATE TABLE `medicines` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `manufacturer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `unit_id` bigint(20) UNSIGNED DEFAULT NULL,
  `tax_profile_id` bigint(20) UNSIGNED DEFAULT NULL,
  `hs_code_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `generic_name` varchar(200) DEFAULT NULL,
  `strength` varchar(100) DEFAULT NULL,
  `pack_size` varchar(100) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `reorder_level` decimal(14,3) DEFAULT 0.000,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `medicines`
--

INSERT INTO `medicines` (`id`, `hospital_id`, `category_id`, `manufacturer_id`, `unit_id`, `tax_profile_id`, `hs_code_id`, `name`, `generic_name`, `strength`, `pack_size`, `barcode`, `reorder_level`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 1, 1, 1, 'Panadol 500mg', 'Paracetamol', '500mg', '20 tablets', NULL, 50.000, 1, '2026-09-17 17:44:58', '2026-09-17 17:44:58'),
(2, 1, 2, NULL, 3, NULL, NULL, 'Brufen 400mg', 'Ibuprofen', '400mg', '20 tablets', NULL, 0.000, 1, '2026-09-17 17:44:58', '2026-09-17 17:45:01'),
(3, 1, 2, 1, 3, 1, 1, 'Demo Syrup', 'Demo Generic', '100mg/5ml', '120ml', NULL, 20.000, 1, '2026-09-17 17:44:58', '2026-09-17 17:44:58');

-- --------------------------------------------------------

--
-- Table structure for table `medicine_batches`
--

CREATE TABLE `medicine_batches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `medicine_id` bigint(20) UNSIGNED NOT NULL,
  `batch_no` varchar(100) NOT NULL,
  `manufacture_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `purchase_price` decimal(14,2) DEFAULT 0.00,
  `sale_price` decimal(14,2) DEFAULT 0.00,
  `mrp` decimal(14,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `medicine_batches`
--

INSERT INTO `medicine_batches` (`id`, `medicine_id`, `batch_no`, `manufacture_date`, `expiry_date`, `purchase_price`, `sale_price`, `mrp`) VALUES
(1, 1, 'PNL-001', '2025-12-31', '2027-12-31', 180.00, 210.00, 210.00),
(2, 2, 'BRF-001', '2026-01-01', '2028-02-01', 140.00, 180.00, 180.00),
(3, 3, 'SYR-001', '2026-01-01', '2027-12-01', 120.00, 160.00, 160.00),
(4, 2, '10', NULL, '2027-01-16', 20.00, 30.00, 0.00),
(5, 1, 'RYXJ-6464', NULL, '2027-12-23', 3000.00, 5000.00, 0.00),
(6, 1, 'AUTO-1789829907040', NULL, '2027-02-19', 300.00, 300.00, 0.00),
(7, 3, 'AUTO-1789915224188', NULL, '2027-03-05', 865.00, 865.00, 0.00),
(8, 3, 'AUTO-1789928242146', NULL, '2027-02-15', 10.00, 10.00, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `medicine_categories`
--

CREATE TABLE `medicine_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `medicine_categories`
--

INSERT INTO `medicine_categories` (`id`, `hospital_id`, `name`) VALUES
(1, 1, 'Tablet'),
(2, 1, 'Syrup'),
(3, 1, 'Injection'),
(4, 1, 'Surgical');

-- --------------------------------------------------------

--
-- Table structure for table `medicine_units`
--

CREATE TABLE `medicine_units` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(80) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `medicine_units`
--

INSERT INTO `medicine_units` (`id`, `hospital_id`, `name`) VALUES
(1, 1, 'Piece'),
(2, 1, 'Box'),
(3, 1, 'Bottle');

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `patient_no` varchar(60) NOT NULL,
  `name` varchar(150) NOT NULL,
  `father_husband_name` varchar(150) DEFAULT NULL,
  `cnic` varchar(50) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT 'Other',
  `dob` date DEFAULT NULL,
  `mobile` varchar(50) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `hospital_id`, `patient_no`, `name`, `father_husband_name`, `cnic`, `gender`, `dob`, `mobile`, `address`, `blood_group`, `emergency_contact`, `created_at`) VALUES
(1, 1, 'PAT-2026-000001', 'Asad', 'Saleem', '3110193671503', 'Male', '2007-01-30', '03328327729', 'Mehmood street basti sadar din', NULL, NULL, '2026-09-16 11:59:14'),
(2, 1, 'PAT-2026-000002', 'Adnan', 'Ahmed', '3110193671053', 'Male', NULL, '03328327729', 'Mehmood street basti sadar din', NULL, NULL, '2026-09-17 17:41:19');

-- --------------------------------------------------------

--
-- Table structure for table `patient_visits`
--

CREATE TABLE `patient_visits` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `patient_id` bigint(20) UNSIGNED NOT NULL,
  `doctor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `visit_date` datetime DEFAULT current_timestamp(),
  `visit_type` varchar(50) DEFAULT 'OPD',
  `registration_fee` decimal(14,2) DEFAULT 0.00,
  `discount` decimal(14,2) DEFAULT 0.00,
  `paid` decimal(14,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `patient_visits`
--

INSERT INTO `patient_visits` (`id`, `patient_id`, `doctor_id`, `department_id`, `visit_date`, `visit_type`, `registration_fee`, `discount`, `paid`, `notes`) VALUES
(1, 1, 1, 4, '2026-09-16 16:59:14', 'OPD', 100.00, 0.00, 100.00, NULL),
(2, 2, NULL, 4, '2026-09-17 22:41:19', 'OPD', 1000.00, 0.00, 0.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `party_type` enum('PATIENT','SUPPLIER') NOT NULL,
  `party_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `payment_method` varchar(30) NOT NULL DEFAULT 'Cash',
  `bank_account_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `hospital_id`, `party_type`, `party_id`, `amount`, `payment_method`, `bank_account_id`, `reference_no`, `notes`, `created_by`, `created_at`) VALUES
(1, 1, 'SUPPLIER', 1, 6000.00, 'Cash', NULL, NULL, NULL, 1, '2026-09-20 16:00:09');

-- --------------------------------------------------------

--
-- Table structure for table `payment_allocations`
--

CREATE TABLE `payment_allocations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_id` bigint(20) UNSIGNED NOT NULL,
  `invoice_type` enum('SALE','PURCHASE') NOT NULL,
  `invoice_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(14,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_allocations`
--

INSERT INTO `payment_allocations` (`id`, `payment_id`, `invoice_type`, `invoice_id`, `amount`) VALUES
(1, 1, 'PURCHASE', 2, 6000.00);

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `code`) VALUES
(10, 'accounts.view'),
(1, 'dashboard.view'),
(4, 'doctors.manage'),
(9, 'inventory.view'),
(6, 'medicines.manage'),
(5, 'medicines.view'),
(3, 'patients.create'),
(2, 'patients.view'),
(7, 'purchase.manage'),
(11, 'reports.view'),
(8, 'sales.manage'),
(12, 'settings.manage');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_invoices`
--

CREATE TABLE `purchase_invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `supplier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `invoice_no` varchar(100) NOT NULL,
  `invoice_date` date NOT NULL,
  `subtotal` decimal(14,2) DEFAULT 0.00,
  `discount` decimal(14,2) DEFAULT 0.00,
  `tax` decimal(14,2) DEFAULT 0.00,
  `net_total` decimal(14,2) DEFAULT 0.00,
  `round_off` decimal(10,2) DEFAULT 0.00,
  `paid` decimal(14,2) DEFAULT 0.00,
  `status` varchar(30) DEFAULT 'POSTED',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_invoices`
--

INSERT INTO `purchase_invoices` (`id`, `hospital_id`, `supplier_id`, `invoice_no`, `invoice_date`, `subtotal`, `discount`, `tax`, `net_total`, `round_off`, `paid`, `status`, `created_at`) VALUES
(1, 1, NULL, '36564', '2026-09-16', 400.00, 0.00, 0.00, 400.00, 0.00, 0.00, 'POSTED', '2026-09-16 11:32:56'),
(2, 1, 1, 'GTY00001', '2026-09-17', 30000.00, 0.00, 0.00, 30000.00, 0.00, 6000.00, 'POSTED', '2026-09-17 08:26:04'),
(3, 1, NULL, 'TEST123', '2026-09-19', 2700.00, 0.00, 756.00, 3456.00, 0.00, 0.00, 'POSTED', '2026-09-19 14:58:27'),
(4, 1, 1, '23432423423', '2026-09-20', 7352.50, 0.00, 0.00, 7353.00, 0.50, 11678.00, 'POSTED', '2026-09-20 14:40:24'),
(5, 1, NULL, '42423432', '2026-09-20', 450.00, 0.00, 1.13, 451.00, -0.13, 451.00, 'POSTED', '2026-09-20 18:17:22');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_items`
--

CREATE TABLE `purchase_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `purchase_id` bigint(20) UNSIGNED NOT NULL,
  `medicine_id` bigint(20) UNSIGNED NOT NULL,
  `batch_id` bigint(20) UNSIGNED NOT NULL,
  `qty` decimal(14,3) NOT NULL,
  `bonus_qty` decimal(14,3) NOT NULL DEFAULT 0.000,
  `unit_cost` decimal(14,2) NOT NULL,
  `discount` decimal(14,2) DEFAULT 0.00,
  `discount_percent` decimal(6,2) DEFAULT 0.00,
  `tax` decimal(14,2) DEFAULT 0.00,
  `tax_profile_id` bigint(20) UNSIGNED DEFAULT NULL,
  `tax_percent` decimal(8,3) DEFAULT 0.000,
  `cess` decimal(14,2) DEFAULT 0.00,
  `custom_field` varchar(191) DEFAULT NULL,
  `total` decimal(14,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_items`
--

INSERT INTO `purchase_items` (`id`, `purchase_id`, `medicine_id`, `batch_id`, `qty`, `bonus_qty`, `unit_cost`, `discount`, `discount_percent`, `tax`, `tax_profile_id`, `tax_percent`, `cess`, `custom_field`, `total`) VALUES
(1, 1, 2, 4, 20.000, 0.000, 20.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 400.00),
(2, 2, 1, 5, 10.000, 0.000, 3000.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 30000.00),
(3, 3, 1, 6, 10.000, 0.000, 300.00, 300.00, 10.00, 756.00, 5, 28.000, 0.00, NULL, 3456.00),
(4, 4, 3, 7, 15.000, 0.000, 865.00, 1297.50, 10.00, 0.00, NULL, 0.000, 0.00, NULL, 11677.50),
(5, 5, 3, 8, 50.000, 0.000, 10.00, 50.00, 10.00, 1.13, 11, 0.250, 0.00, NULL, 451.13);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_returns`
--

CREATE TABLE `purchase_returns` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `purchase_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'original Purchase Bill this Debit Note is against, if any',
  `supplier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `return_no` varchar(50) NOT NULL,
  `return_date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `net_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_returns`
--

INSERT INTO `purchase_returns` (`id`, `hospital_id`, `purchase_id`, `supplier_id`, `return_no`, `return_date`, `reason`, `subtotal`, `net_total`, `created_by`, `created_at`) VALUES
(1, 1, 4, 1, 'DN-1789919974755', '2026-09-20', NULL, 4325.00, 4325.00, 1, '2026-09-20 15:59:34');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_return_items`
--

CREATE TABLE `purchase_return_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `purchase_return_id` bigint(20) UNSIGNED NOT NULL,
  `medicine_id` bigint(20) UNSIGNED NOT NULL,
  `batch_id` bigint(20) UNSIGNED NOT NULL,
  `qty` decimal(14,3) NOT NULL,
  `unit_cost` decimal(14,2) NOT NULL,
  `total` decimal(14,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_return_items`
--

INSERT INTO `purchase_return_items` (`id`, `purchase_return_id`, `medicine_id`, `batch_id`, `qty`, `unit_cost`, `total`) VALUES
(1, 1, 3, 7, 5.000, 865.00, 4325.00);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`) VALUES
(5, 'Accountant'),
(1, 'Admin'),
(2, 'Doctor'),
(3, 'Pharmacist'),
(4, 'Receptionist');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `permission_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12);

-- --------------------------------------------------------

--
-- Table structure for table `sales_invoices`
--

CREATE TABLE `sales_invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `patient_id` bigint(20) UNSIGNED DEFAULT NULL,
  `doctor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `invoice_no` varchar(100) NOT NULL,
  `invoice_date` datetime DEFAULT current_timestamp(),
  `subtotal` decimal(14,2) DEFAULT 0.00,
  `discount` decimal(14,2) DEFAULT 0.00,
  `tax` decimal(14,2) DEFAULT 0.00,
  `net_total` decimal(14,2) DEFAULT 0.00,
  `round_off` decimal(10,2) DEFAULT 0.00,
  `paid` decimal(14,2) DEFAULT 0.00,
  `payment_method` varchar(30) DEFAULT 'Cash',
  `status` varchar(30) DEFAULT 'POSTED'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sales_invoices`
--

INSERT INTO `sales_invoices` (`id`, `hospital_id`, `patient_id`, `doctor_id`, `invoice_no`, `invoice_date`, `subtotal`, `discount`, `tax`, `net_total`, `round_off`, `paid`, `payment_method`, `status`) VALUES
(1, 1, NULL, NULL, 'INV-1789558455125', '2026-09-16 16:34:15', 150.00, 0.00, 0.00, 150.00, 0.00, 150.00, 'Cash', 'POSTED'),
(7, 1, NULL, NULL, 'INV-1789558835190', '2026-09-16 16:40:35', 300.00, 0.00, 0.00, 300.00, 0.00, 300.00, 'Cash', 'POSTED'),
(9, 1, 1, NULL, 'INV-1789633655070', '2026-09-17 13:27:35', 1500.00, 0.00, 0.00, 1500.00, 0.00, 1500.00, 'Cash', 'POSTED'),
(11, 1, 1, NULL, 'INV-1789639034032', '2026-09-17 14:57:14', 100.00, 0.00, 0.00, 100.00, 0.00, 100.00, 'Cash', 'POSTED'),
(13, 1, NULL, NULL, 'INV-1789657908549', '2026-09-17 20:11:48', 10.00, 0.00, 0.00, 10.00, 0.00, 10.00, 'Cash', 'POSTED'),
(14, 1, NULL, NULL, 'INV-1789745690118', '2026-09-18 20:34:50', 40.00, 0.00, 0.00, 40.00, 0.00, 40.00, 'Cash', 'POSTED'),
(15, 1, NULL, NULL, 'INV-1789754709303', '2026-09-18 23:05:09', 80.00, 0.00, 0.00, 80.00, 0.00, 80.00, 'Cash', 'POSTED'),
(16, 1, NULL, NULL, 'INV-1789915255762', '2026-09-20 19:40:55', 1730.00, 0.00, 0.00, 1730.00, 0.00, 1730.00, 'Cash', 'POSTED'),
(17, 1, NULL, NULL, 'INV-1789915307449', '2026-09-20 19:41:47', 2030.00, 0.00, 0.00, 2030.00, 0.00, 2030.00, 'Cash', 'POSTED'),
(18, 1, NULL, NULL, 'INV-1789919882812', '2026-09-20 20:58:02', 30.00, 0.00, 0.00, 30.00, 0.00, 30.00, 'Cash', 'POSTED'),
(19, 1, NULL, NULL, 'INV-1789927833534', '2026-09-20 23:10:33', 843.37, 0.00, 2.11, 845.00, -0.48, 845.00, 'Cash', 'POSTED'),
(20, 1, NULL, NULL, 'INV-1789927892534', '2026-09-20 23:11:32', 865.00, 0.00, 0.00, 865.00, 0.00, 865.00, 'Cash', 'POSTED'),
(21, 1, NULL, NULL, 'INV-1789928283422', '2026-09-20 23:18:03', 10.00, 0.00, 0.00, 10.00, 0.00, 10.00, 'Cash', 'POSTED');

-- --------------------------------------------------------

--
-- Table structure for table `sale_items`
--

CREATE TABLE `sale_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sale_id` bigint(20) UNSIGNED NOT NULL,
  `medicine_id` bigint(20) UNSIGNED NOT NULL,
  `batch_id` bigint(20) UNSIGNED NOT NULL,
  `qty` decimal(14,3) NOT NULL,
  `unit_price` decimal(14,2) NOT NULL,
  `discount` decimal(14,2) DEFAULT 0.00,
  `discount_percent` decimal(6,2) DEFAULT 0.00,
  `tax` decimal(14,2) DEFAULT 0.00,
  `tax_profile_id` bigint(20) UNSIGNED DEFAULT NULL,
  `tax_percent` decimal(8,3) DEFAULT 0.000,
  `cess` decimal(14,2) DEFAULT 0.00,
  `custom_field` varchar(191) DEFAULT NULL,
  `cost_price` decimal(14,2) DEFAULT 0.00,
  `total` decimal(14,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sale_items`
--

INSERT INTO `sale_items` (`id`, `sale_id`, `medicine_id`, `batch_id`, `qty`, `unit_price`, `discount`, `discount_percent`, `tax`, `tax_profile_id`, `tax_percent`, `cess`, `custom_field`, `cost_price`, `total`) VALUES
(1, 1, 2, 4, 3.000, 50.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 20.00, 150.00),
(7, 7, 2, 4, 2.000, 150.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 20.00, 300.00),
(9, 9, 1, 5, 2.000, 750.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 3000.00, 1500.00),
(11, 11, 1, 5, 1.000, 100.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 3000.00, 100.00),
(13, 13, 2, 4, 1.000, 10.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 20.00, 10.00),
(14, 14, 1, 5, 2.000, 20.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 3000.00, 40.00),
(15, 15, 2, 4, 3.000, 30.00, 10.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 20.00, 80.00),
(16, 16, 3, 7, 2.000, 865.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 865.00, 1730.00),
(17, 17, 3, 7, 2.000, 865.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 865.00, 1730.00),
(18, 17, 1, 6, 1.000, 300.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 300.00, 300.00),
(19, 18, 2, 4, 1.000, 30.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 20.00, 30.00),
(20, 19, 3, 7, 1.000, 865.00, 21.63, 2.50, 2.11, 11, 0.250, 0.00, NULL, 865.00, 845.48),
(21, 20, 3, 7, 1.000, 865.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 865.00, 865.00),
(22, 21, 3, 8, 1.000, 10.00, 0.00, 0.00, 0.00, NULL, 0.000, 0.00, NULL, 10.00, 10.00);

-- --------------------------------------------------------

--
-- Table structure for table `sale_returns`
--

CREATE TABLE `sale_returns` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `sale_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'original Sale Invoice this Credit Note is against, if any',
  `patient_id` bigint(20) UNSIGNED DEFAULT NULL,
  `return_no` varchar(50) NOT NULL,
  `return_date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `net_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sale_return_items`
--

CREATE TABLE `sale_return_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sale_return_id` bigint(20) UNSIGNED NOT NULL,
  `medicine_id` bigint(20) UNSIGNED NOT NULL,
  `batch_id` bigint(20) UNSIGNED NOT NULL,
  `qty` decimal(14,3) NOT NULL,
  `unit_price` decimal(14,2) NOT NULL,
  `cost_price` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total` decimal(14,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_transactions`
--

CREATE TABLE `stock_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `medicine_id` bigint(20) UNSIGNED NOT NULL,
  `batch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `transaction_type` varchar(40) NOT NULL,
  `reference_type` varchar(40) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `qty_in` decimal(14,3) DEFAULT 0.000,
  `qty_out` decimal(14,3) DEFAULT 0.000,
  `unit_cost` decimal(14,2) DEFAULT 0.00,
  `transaction_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_transactions`
--

INSERT INTO `stock_transactions` (`id`, `hospital_id`, `warehouse_id`, `medicine_id`, `batch_id`, `transaction_type`, `reference_type`, `reference_id`, `qty_in`, `qty_out`, `unit_cost`, `transaction_date`) VALUES
(1, 1, NULL, 2, 4, 'PURCHASE', 'PURCHASE', 1, 20.000, 0.000, 20.00, '2026-09-16 16:32:56'),
(2, 1, NULL, 2, 4, 'SALE', 'SALE', 1, 0.000, 3.000, 20.00, '2026-09-16 16:34:15'),
(8, 1, NULL, 2, 4, 'SALE', 'SALE', 7, 0.000, 2.000, 20.00, '2026-09-16 16:40:35'),
(9, 1, NULL, 1, 5, 'PURCHASE', 'PURCHASE', 2, 10.000, 0.000, 3000.00, '2026-09-17 13:26:04'),
(11, 1, NULL, 1, 5, 'SALE', 'SALE', 9, 0.000, 2.000, 3000.00, '2026-09-17 13:27:35'),
(13, 1, NULL, 1, 5, 'SALE', 'SALE', 11, 0.000, 1.000, 3000.00, '2026-09-17 14:57:14'),
(15, 1, NULL, 2, 4, 'SALE', 'SALE', 13, 0.000, 1.000, 20.00, '2026-09-17 20:11:48'),
(16, 1, NULL, 1, 5, 'SALE', 'SALE', 14, 0.000, 2.000, 3000.00, '2026-09-18 20:34:50'),
(17, 1, NULL, 2, 4, 'SALE', 'SALE', 15, 0.000, 3.000, 20.00, '2026-09-18 23:05:09'),
(18, 1, NULL, 1, 6, 'PURCHASE', 'PURCHASE', 3, 10.000, 0.000, 300.00, '2026-09-19 19:58:27'),
(19, 1, NULL, 3, 7, 'PURCHASE', 'PURCHASE', 4, 15.000, 0.000, 865.00, '2026-09-20 19:40:24'),
(20, 1, NULL, 3, 7, 'SALE', 'SALE', 16, 0.000, 2.000, 865.00, '2026-09-20 19:40:55'),
(21, 1, NULL, 3, 7, 'SALE', 'SALE', 17, 0.000, 2.000, 865.00, '2026-09-20 19:41:47'),
(22, 1, NULL, 1, 6, 'SALE', 'SALE', 17, 0.000, 1.000, 300.00, '2026-09-20 19:41:47'),
(23, 1, NULL, 2, 4, 'SALE', 'SALE', 18, 0.000, 1.000, 20.00, '2026-09-20 20:58:02'),
(24, 1, NULL, 3, 7, 'PURCHASE_RETURN', 'PURCHASE_RETURN', 1, 0.000, 5.000, 865.00, '2026-09-20 20:59:34'),
(25, 1, NULL, 3, 7, 'SALE', 'SALE', 19, 0.000, 1.000, 865.00, '2026-09-20 23:10:33'),
(26, 1, NULL, 3, 7, 'SALE', 'SALE', 20, 0.000, 1.000, 865.00, '2026-09-20 23:11:32'),
(27, 1, NULL, 3, 8, 'PURCHASE', 'PURCHASE', 5, 50.000, 0.000, 10.00, '2026-09-20 23:17:22'),
(28, 1, NULL, 3, 8, 'SALE', 'SALE', 21, 0.000, 1.000, 10.00, '2026-09-20 23:18:03');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `tax_number` varchar(100) DEFAULT NULL,
  `opening_balance` decimal(14,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `hospital_id`, `name`, `phone`, `address`, `tax_number`, `opening_balance`) VALUES
(1, 1, 'GetZ Pharmacy', '03328327729', 'Mehmood street basti sadar din', NULL, 0.00),
(2, 1, 'Ahmed Group', '03328327729', 'Lahore', NULL, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `tax_profiles`
--

CREATE TABLE `tax_profiles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `tax_type` varchar(50) NOT NULL,
  `rate` decimal(8,4) DEFAULT 0.0000,
  `is_tax_inclusive` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tax_profiles`
--

INSERT INTO `tax_profiles` (`id`, `hospital_id`, `name`, `tax_type`, `rate`, `is_tax_inclusive`, `is_active`) VALUES
(1, 1, 'Exempt', 'EXEMPT', 0.0000, 0, 1),
(2, 1, 'Taxable Configurable', 'TAXABLE', 0.0000, 0, 1),
(3, 1, 'NONE', 'EXEMPT', 0.0000, 0, 1),
(4, 1, 'GST@18', 'GST', 18.0000, 0, 1),
(5, 1, 'GST@28', 'GST', 28.0000, 0, 1),
(6, 1, 'IGST@28', 'IGST', 28.0000, 0, 1),
(7, 1, 'S.Tax@22', 'SERVICE_TAX', 22.0000, 0, 1),
(8, 1, 'ADV.Tax', 'ADVANCE_TAX', 0.0000, 0, 1),
(10, 1, 'IGST@18', 'IGST', 18.0000, 0, 1),
(11, 1, 'GST@.25', 'GST', 0.2500, 0, 1),
(12, 1, 'GST@3', 'GST', 3.0000, 0, 1),
(13, 1, 'GST@5', 'GST', 5.0000, 0, 1),
(14, 1, 'IGST@3', 'IGST', 3.0000, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED DEFAULT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(180) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `hospital_id`, `branch_id`, `name`, `email`, `password_hash`, `is_active`, `created_at`) VALUES
(1, 1, 1, 'System Administrator', 'admin@gmail.com', '$2a$10$om5HymReR2MknrkVKeM8..bjsv8b4HBHPm1./gBEngWgYtTKl83VK', 1, '2026-09-16 11:07:33');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `warehouses`
--

CREATE TABLE `warehouses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hospital_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warehouses`
--

INSERT INTO `warehouses` (`id`, `hospital_id`, `branch_id`, `name`) VALUES
(1, 1, 1, 'Main Pharmacy');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_account_code` (`hospital_id`,`code`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indexes for table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_setting` (`hospital_id`,`setting_key`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `bank_accounts`
--
ALTER TABLE `bank_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_branch_code` (`hospital_id`,`code`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_doctor_code` (`hospital_id`,`doctor_code`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `hospitals`
--
ALTER TABLE `hospitals`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hs_codes`
--
ALTER TABLE `hs_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `journal_entry_items`
--
ALTER TABLE `journal_entry_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `journal_entry_id` (`journal_entry_id`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `manufacturers`
--
ALTER TABLE `manufacturers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `medicines`
--
ALTER TABLE `medicines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `manufacturer_id` (`manufacturer_id`),
  ADD KEY `unit_id` (`unit_id`),
  ADD KEY `tax_profile_id` (`tax_profile_id`),
  ADD KEY `hs_code_id` (`hs_code_id`);

--
-- Indexes for table `medicine_batches`
--
ALTER TABLE `medicine_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_batch` (`medicine_id`,`batch_no`);

--
-- Indexes for table `medicine_categories`
--
ALTER TABLE `medicine_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `medicine_units`
--
ALTER TABLE `medicine_units`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_patient_no` (`hospital_id`,`patient_no`),
  ADD KEY `idx_patients_mobile` (`hospital_id`,`mobile`);

--
-- Indexes for table `patient_visits`
--
ALTER TABLE `patient_visits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `idx_patient_visit_date` (`visit_date`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`),
  ADD KEY `party` (`party_type`,`party_id`);

--
-- Indexes for table `payment_allocations`
--
ALTER TABLE `payment_allocations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_id` (`payment_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `purchase_invoices`
--
ALTER TABLE `purchase_invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `idx_purchase_date` (`invoice_date`),
  ADD KEY `idx_purchase_invoice_no` (`hospital_id`,`invoice_no`);

--
-- Indexes for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_id` (`purchase_id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `idx_purchase_items_medicine` (`medicine_id`);

--
-- Indexes for table `purchase_returns`
--
ALTER TABLE `purchase_returns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`),
  ADD KEY `purchase_id` (`purchase_id`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- Indexes for table `purchase_return_items`
--
ALTER TABLE `purchase_return_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_return_id` (`purchase_return_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `sales_invoices`
--
ALTER TABLE `sales_invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`),
  ADD KEY `idx_sale_date` (`invoice_date`),
  ADD KEY `idx_sales_invoice_no` (`hospital_id`,`invoice_no`);

--
-- Indexes for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sale_id` (`sale_id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `idx_sale_items_medicine` (`medicine_id`);

--
-- Indexes for table `sale_returns`
--
ALTER TABLE `sale_returns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`),
  ADD KEY `sale_id` (`sale_id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `sale_return_items`
--
ALTER TABLE `sale_return_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sale_return_id` (`sale_return_id`);

--
-- Indexes for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`),
  ADD KEY `warehouse_id` (`warehouse_id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `idx_stock_medicine` (`medicine_id`,`batch_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_suppliers_phone` (`hospital_id`,`phone`);

--
-- Indexes for table `tax_profiles`
--
ALTER TABLE `tax_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `hospital_id` (`hospital_id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `app_settings`
--
ALTER TABLE `app_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `bank_accounts`
--
ALTER TABLE `bank_accounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `hospitals`
--
ALTER TABLE `hospitals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `hs_codes`
--
ALTER TABLE `hs_codes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `journal_entries`
--
ALTER TABLE `journal_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `journal_entry_items`
--
ALTER TABLE `journal_entry_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `manufacturers`
--
ALTER TABLE `manufacturers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `medicines`
--
ALTER TABLE `medicines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `medicine_batches`
--
ALTER TABLE `medicine_batches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `medicine_categories`
--
ALTER TABLE `medicine_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `medicine_units`
--
ALTER TABLE `medicine_units`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `patient_visits`
--
ALTER TABLE `patient_visits`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payment_allocations`
--
ALTER TABLE `payment_allocations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=519;

--
-- AUTO_INCREMENT for table `purchase_invoices`
--
ALTER TABLE `purchase_invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `purchase_items`
--
ALTER TABLE `purchase_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `purchase_returns`
--
ALTER TABLE `purchase_returns`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `purchase_return_items`
--
ALTER TABLE `purchase_return_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `sales_invoices`
--
ALTER TABLE `sales_invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `sale_returns`
--
ALTER TABLE `sale_returns`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sale_return_items`
--
ALTER TABLE `sale_return_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tax_profiles`
--
ALTER TABLE `tax_profiles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `warehouses`
--
ALTER TABLE `warehouses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`),
  ADD CONSTRAINT `accounts_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `accounts` (`id`);

--
-- Constraints for table `app_settings`
--
ALTER TABLE `app_settings`
  ADD CONSTRAINT `app_settings_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`);

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `branches`
--
ALTER TABLE `branches`
  ADD CONSTRAINT `branches_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`);

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`);

--
-- Constraints for table `doctors`
--
ALTER TABLE `doctors`
  ADD CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`),
  ADD CONSTRAINT `doctors_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`);

--
-- Constraints for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD CONSTRAINT `journal_entries_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`);

--
-- Constraints for table `journal_entry_items`
--
ALTER TABLE `journal_entry_items`
  ADD CONSTRAINT `journal_entry_items_ibfk_1` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `journal_entry_items_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`);

--
-- Constraints for table `manufacturers`
--
ALTER TABLE `manufacturers`
  ADD CONSTRAINT `manufacturers_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`);

--
-- Constraints for table `medicines`
--
ALTER TABLE `medicines`
  ADD CONSTRAINT `medicines_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`),
  ADD CONSTRAINT `medicines_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `medicine_categories` (`id`),
  ADD CONSTRAINT `medicines_ibfk_3` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers` (`id`),
  ADD CONSTRAINT `medicines_ibfk_4` FOREIGN KEY (`unit_id`) REFERENCES `medicine_units` (`id`),
  ADD CONSTRAINT `medicines_ibfk_5` FOREIGN KEY (`tax_profile_id`) REFERENCES `tax_profiles` (`id`),
  ADD CONSTRAINT `medicines_ibfk_6` FOREIGN KEY (`hs_code_id`) REFERENCES `hs_codes` (`id`);

--
-- Constraints for table `medicine_batches`
--
ALTER TABLE `medicine_batches`
  ADD CONSTRAINT `medicine_batches_ibfk_1` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`);

--
-- Constraints for table `medicine_categories`
--
ALTER TABLE `medicine_categories`
  ADD CONSTRAINT `medicine_categories_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`);

--
-- Constraints for table `medicine_units`
--
ALTER TABLE `medicine_units`
  ADD CONSTRAINT `medicine_units_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`);

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`);

--
-- Constraints for table `patient_visits`
--
ALTER TABLE `patient_visits`
  ADD CONSTRAINT `patient_visits_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `patient_visits_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  ADD CONSTRAINT `patient_visits_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Constraints for table `purchase_invoices`
--
ALTER TABLE `purchase_invoices`
  ADD CONSTRAINT `purchase_invoices_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`),
  ADD CONSTRAINT `purchase_invoices_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`);

--
-- Constraints for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD CONSTRAINT `purchase_items_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchase_invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_items_ibfk_2` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `purchase_items_ibfk_3` FOREIGN KEY (`batch_id`) REFERENCES `medicine_batches` (`id`);

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sales_invoices`
--
ALTER TABLE `sales_invoices`
  ADD CONSTRAINT `sales_invoices_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`),
  ADD CONSTRAINT `sales_invoices_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `sales_invoices_ibfk_3` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`);

--
-- Constraints for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales_invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `sale_items_ibfk_3` FOREIGN KEY (`batch_id`) REFERENCES `medicine_batches` (`id`);

--
-- Constraints for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  ADD CONSTRAINT `stock_transactions_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`),
  ADD CONSTRAINT `stock_transactions_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  ADD CONSTRAINT `stock_transactions_ibfk_3` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `stock_transactions_ibfk_4` FOREIGN KEY (`batch_id`) REFERENCES `medicine_batches` (`id`);

--
-- Constraints for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD CONSTRAINT `suppliers_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`);

--
-- Constraints for table `tax_profiles`
--
ALTER TABLE `tax_profiles`
  ADD CONSTRAINT `tax_profiles_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD CONSTRAINT `warehouses_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`),
  ADD CONSTRAINT `warehouses_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
