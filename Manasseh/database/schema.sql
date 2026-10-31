-- ============================================================================
-- Subscription Management System - Database Schema
-- Database: subscription_management
-- Module 2: Product, Variant, Plan, Quotation, and Subscription Management
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `subscription_management` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `subscription_management`;

-- ----------------------------------------------------------------------------
-- Shared Reference Tables (Maintained by Module 1: Auth & User Management)
-- Included here with IF NOT EXISTS for schema integrity and foreign keys.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `full_name` VARCHAR(150) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'STAFF',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `customers` (
    `customer_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `customer_code` VARCHAR(50) NOT NULL UNIQUE,
    `company_name` VARCHAR(200) NOT NULL,
    `contact_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `phone` VARCHAR(50),
    `billing_address` TEXT,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Module 2: Products
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
    `product_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL COMMENT 'PHYSICAL, DIGITAL, SERVICE',
    `sales_price` DECIMAL(12,2) NOT NULL,
    `cost_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `notes` TEXT,
    `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_product_name` (`name`),
    INDEX `idx_product_type` (`type`),
    INDEX `idx_product_available` (`is_available`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Module 2: Product Variants
-- Supports configurable price adjustments (e.g. Brand X adds 560.00)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_variants` (
    `variant_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT NOT NULL,
    `variant_name` VARCHAR(255) NOT NULL,
    `variant_type` VARCHAR(100) NOT NULL COMMENT 'BRAND, STORAGE, TIER, EDITION, etc.',
    `variant_value` VARCHAR(100) NOT NULL COMMENT 'e.g. Acme Pro, 1TB, Enterprise',
    `price_adjustment` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Configurable price addition/deduction',
    `sku` VARCHAR(100) UNIQUE,
    `stock_quantity` INT DEFAULT 0,
    `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE CASCADE,
    INDEX `idx_variant_product` (`product_id`),
    INDEX `idx_variant_type` (`variant_type`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Module 2: Subscription Plans
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `plans` (
    `plan_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `plan_name` VARCHAR(255) NOT NULL,
    `plan_code` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT,
    `price` DECIMAL(12,2) NOT NULL,
    `billing_interval` VARCHAR(50) NOT NULL COMMENT 'DAILY, WEEKLY, MONTHLY, YEARLY',
    `minimum_quantity` INT NOT NULL DEFAULT 1,
    `availability_start_date` DATE NOT NULL,
    `availability_end_date` DATE NOT NULL,
    `auto_close` BOOLEAN NOT NULL DEFAULT FALSE,
    `auto_close_after_cycles` INT DEFAULT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, INACTIVE, ARCHIVED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_plan_dates` (`availability_start_date`, `availability_end_date`),
    INDEX `idx_plan_status` (`status`),
    INDEX `idx_plan_interval` (`billing_interval`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Module 2: Plan-Product Association (Many-to-Many)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `plan_products` (
    `plan_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    PRIMARY KEY (`plan_id`, `product_id`),
    FOREIGN KEY (`plan_id`) REFERENCES `plans`(`plan_id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Module 2: Quotation Templates
-- Reusable templates for staff to quickly prepare standardized quotations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quotation_templates` (
    `template_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `template_name` VARCHAR(255) NOT NULL,
    `default_plan_id` BIGINT,
    `default_payment_terms` VARCHAR(50) NOT NULL DEFAULT 'NET_30',
    `default_tax_rate` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    `default_notes` TEXT,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`default_plan_id`) REFERENCES `plans`(`plan_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Module 2: Quotations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quotations` (
    `quotation_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `quotation_number` VARCHAR(100) NOT NULL UNIQUE,
    `customer_id` BIGINT NOT NULL,
    `customer_name` VARCHAR(255) NOT NULL,
    `customer_email` VARCHAR(255) NOT NULL,
    `plan_id` BIGINT NOT NULL,
    `quotation_date` DATE NOT NULL,
    `valid_until` DATE NOT NULL,
    `payment_terms` VARCHAR(50) NOT NULL DEFAULT 'NET_30' COMMENT 'IMMEDIATE, NET_15, NET_30, NET_60',
    `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED',
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`plan_id`) REFERENCES `plans`(`plan_id`),
    INDEX `idx_quotation_customer` (`customer_id`),
    INDEX `idx_quotation_status` (`status`),
    INDEX `idx_quotation_number` (`quotation_number`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Module 2: Quotation Lines
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quotation_lines` (
    `line_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `quotation_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `variant_id` BIGINT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(12,2) NOT NULL,
    `tax_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `line_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`quotation_id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`),
    FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`variant_id`) ON DELETE SET NULL,
    INDEX `idx_quote_lines_quote` (`quotation_id`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Module 2: Subscriptions
-- Lifecycle: DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED (+ PAUSED)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscriptions` (
    `subscription_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `subscription_number` VARCHAR(100) NOT NULL UNIQUE,
    `quotation_id` BIGINT NULL COMMENT 'Originating quotation if converted',
    `customer_id` BIGINT NOT NULL,
    `customer_name` VARCHAR(255) NOT NULL,
    `customer_email` VARCHAR(255) NOT NULL,
    `plan_id` BIGINT NOT NULL,
    `start_date` DATE NOT NULL,
    `expiry_date` DATE NOT NULL,
    `next_billing_date` DATE NOT NULL COMMENT 'Accurate billing dates for Module 3 invoice generation',
    `last_billing_date` DATE NULL,
    `payment_terms` VARCHAR(50) NOT NULL DEFAULT 'NET_30',
    `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `tax_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, QUOTATION, CONFIRMED, ACTIVE, PAUSED, CLOSED',
    `billing_cycles_completed` INT NOT NULL DEFAULT 0,
    `cancellation_reason` VARCHAR(500) NULL,
    `closed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`plan_id`) REFERENCES `plans`(`plan_id`),
    FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`quotation_id`) ON DELETE SET NULL,
    INDEX `idx_sub_customer` (`customer_id`),
    INDEX `idx_sub_status` (`status`),
    INDEX `idx_sub_next_billing` (`next_billing_date`),
    INDEX `idx_sub_expiry` (`expiry_date`),
    INDEX `idx_sub_number` (`subscription_number`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Module 2: Subscription Lines
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscription_lines` (
    `line_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `subscription_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `variant_id` BIGINT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(12,2) NOT NULL,
    `tax_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `line_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`subscription_id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`),
    FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`variant_id`) ON DELETE SET NULL,
    INDEX `idx_sub_lines_sub` (`subscription_id`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Module 2: Subscription Audit History
-- Tracks lifecycle status progression and reasons
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscription_history` (
    `history_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `subscription_id` BIGINT NOT NULL,
    `previous_status` VARCHAR(50) NULL,
    `new_status` VARCHAR(50) NOT NULL,
    `changed_by` VARCHAR(100) DEFAULT 'SYSTEM',
    `change_reason` VARCHAR(500) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`subscription_id`) ON DELETE CASCADE,
    INDEX `idx_history_subscription` (`subscription_id`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- SEED DATA FOR DEMO, TESTING, AND INTEGRATION
-- ----------------------------------------------------------------------------

-- Seed Shared Reference Customers
INSERT IGNORE INTO `customers` (`customer_id`, `customer_code`, `company_name`, `contact_name`, `email`, `phone`, `billing_address`) VALUES
(1, 'CUST-001', 'Acme Innovations Ltd', 'Alice Walker', 'alice@acmeinnovations.com', '+1-555-0192', '123 Tech Park, Suite 400, San Jose, CA'),
(2, 'CUST-002', 'Global Logistics Corp', 'Brian Miller', 'bmiller@globallogistics.io', '+1-555-0144', '742 Harbor Blvd, Boston, MA'),
(3, 'CUST-003', 'Apex Cloud Solutions', 'Clara Vance', 'clara@apexcloud.com', '+1-555-0178', '88 Innovation Way, Austin, TX');

-- Seed Products
INSERT IGNORE INTO `products` (`product_id`, `name`, `type`, `sales_price`, `cost_price`, `notes`, `is_available`) VALUES
(1, 'Enterprise Cloud Backup', 'DIGITAL', 1200.00, 450.00, 'Automated offsite backup with AES-256 encryption.', TRUE),
(2, 'Secure Router Edge Gateway', 'PHYSICAL', 2500.00, 1400.00, 'Hardware gateway for high-throughput enterprise network security.', TRUE),
(3, '24/7 Premium DevOps SLA', 'SERVICE', 800.00, 300.00, 'Guaranteed 15-minute response time for critical incidents.', TRUE),
(4, 'AI Document Intelligence API', 'DIGITAL', 1500.00, 500.00, 'Deep learning document parsing and metadata extraction.', TRUE);

-- Seed Product Variants (demonstrating configurable brand and tier adjustments, e.g. +560.00)
INSERT IGNORE INTO `product_variants` (`variant_id`, `product_id`, `variant_name`, `variant_type`, `variant_value`, `price_adjustment`, `sku`, `stock_quantity`, `is_available`) VALUES
(1, 1, 'Standard Storage Tier', 'TIER', 'Standard (5TB)', 0.00, 'ECB-5TB-STD', 9999, TRUE),
(2, 1, 'Enterprise Brand Storage (Custom Branding)', 'BRAND', 'Acme Enterprise Brand', 560.00, 'ECB-BRAND-560', 9999, TRUE),
(3, 1, 'Ultra Storage Tier', 'TIER', 'Ultra (20TB)', 850.00, 'ECB-20TB-ULTRA', 9999, TRUE),
(4, 2, 'Rackmount Form Factor - Brand Pro', 'BRAND', 'Cisco-Compatible Pro', 560.00, 'SREG-PRO-BRAND', 45, TRUE),
(5, 2, 'Desktop Form Factor - Standard', 'HARDWARE', 'Desktop Small Form', 0.00, 'SREG-DESK-STD', 60, TRUE),
(6, 3, 'Multi-region Coverage', 'SERVICE_REGION', 'Americas & EMEA', 400.00, 'SLA-GLOBAL-400', 9999, TRUE);

-- Seed Plans
INSERT IGNORE INTO `plans` (`plan_id`, `plan_name`, `plan_code`, `description`, `price`, `billing_interval`, `minimum_quantity`, `availability_start_date`, `availability_end_date`, `auto_close`, `auto_close_after_cycles`, `status`) VALUES
(1, 'Professional Monthly SaaS', 'PLAN-PRO-M', 'Complete monthly subscription covering cloud backup and 24/7 SLA.', 1999.00, 'MONTHLY', 1, '2026-01-01', '2027-12-31', FALSE, NULL, 'ACTIVE'),
(2, 'Enterprise Annual Suite', 'PLAN-ENT-Y', 'Discounted yearly plan with hardware edge router and unlimited AI API calls.', 18999.00, 'YEARLY', 1, '2026-01-01', '2027-12-31', TRUE, 3, 'ACTIVE'),
(3, 'Weekly Growth Accelerator', 'PLAN-GRW-W', 'Weekly flexible plan for high-velocity teams needing dynamic burst capacity.', 650.00, 'WEEKLY', 2, '2026-01-01', '2027-12-31', FALSE, NULL, 'ACTIVE'),
(4, 'Daily High-Compute Sandbox', 'PLAN-SND-D', 'Daily pay-as-you-go sandbox environment.', 120.00, 'DAILY', 1, '2026-01-01', '2027-12-31', TRUE, 30, 'ACTIVE'),
(5, 'Legacy Starter Plan (Retired)', 'PLAN-LEG-OLD', 'Retired legacy plan for archived reference.', 499.00, 'MONTHLY', 1, '2024-01-01', '2025-12-31', TRUE, 12, 'INACTIVE');

-- Link Products to Plans
INSERT IGNORE INTO `plan_products` (`plan_id`, `product_id`) VALUES
(1, 1),
(1, 3),
(2, 1),
(2, 2),
(2, 4),
(3, 1),
(3, 4),
(4, 1);

-- Seed Quotation Templates
INSERT IGNORE INTO `quotation_templates` (`template_id`, `template_name`, `default_plan_id`, `default_payment_terms`, `default_tax_rate`, `default_notes`, `is_active`) VALUES
(1, 'Standard Enterprise Cloud Template', 1, 'NET_30', 10.00, 'Standard commercial quotation valid for 30 calendar days.', TRUE),
(2, 'Government & Regulated Entity Template', 2, 'NET_60', 5.00, 'Includes high-assurance compliance guarantee and audit trails.', TRUE);

-- Seed Quotations
INSERT IGNORE INTO `quotations` (`quotation_id`, `quotation_number`, `customer_id`, `customer_name`, `customer_email`, `plan_id`, `quotation_date`, `valid_until`, `payment_terms`, `subtotal`, `tax_amount`, `total_amount`, `status`, `notes`) VALUES
(1, 'QT-2026-0001', 1, 'Acme Innovations Ltd', 'alice@acmeinnovations.com', 1, '2026-10-15', '2026-11-15', 'NET_30', 1760.00, 176.00, 1936.00, 'ACCEPTED', 'Customer accepted terms, awaiting subscription provisioning.'),
(2, 'QT-2026-0002', 2, 'Global Logistics Corp', 'bmiller@globallogistics.io', 2, '2026-10-20', '2026-11-20', 'NET_60', 3060.00, 306.00, 3366.00, 'SENT', 'Sent for approval to executive board.');

INSERT IGNORE INTO `quotation_lines` (`line_id`, `quotation_id`, `product_id`, `variant_id`, `quantity`, `unit_price`, `tax_rate`, `tax_amount`, `line_total`) VALUES
(1, 1, 1, 2, 1, 1760.00, 10.00, 176.00, 1936.00),
(2, 2, 2, 4, 1, 3060.00, 10.00, 306.00, 3366.00);

-- Seed Subscriptions (showing status progression states)
INSERT IGNORE INTO `subscriptions` (`subscription_id`, `subscription_number`, `quotation_id`, `customer_id`, `customer_name`, `customer_email`, `plan_id`, `start_date`, `expiry_date`, `next_billing_date`, `last_billing_date`, `payment_terms`, `subtotal`, `tax_total`, `total_amount`, `status`, `billing_cycles_completed`) VALUES
(1, 'SUB-2026-0001', 1, 1, 'Acme Innovations Ltd', 'alice@acmeinnovations.com', 1, '2026-10-01', '2027-10-01', '2026-11-01', '2026-10-01', 'NET_30', 1760.00, 176.00, 1936.00, 'ACTIVE', 1),
(2, 'SUB-2026-0002', NULL, 2, 'Global Logistics Corp', 'bmiller@globallogistics.io', 2, '2026-11-01', '2027-11-01', '2026-11-01', NULL, 'NET_60', 3060.00, 306.00, 3366.00, 'CONFIRMED', 0),
(3, 'SUB-2026-0003', NULL, 3, 'Apex Cloud Solutions', 'clara@apexcloud.com', 3, '2026-09-01', '2026-12-01', '2026-11-05', '2026-10-29', 'IMMEDIATE', 1300.00, 130.00, 1430.00, 'PAUSED', 8);

INSERT IGNORE INTO `subscription_lines` (`line_id`, `subscription_id`, `product_id`, `variant_id`, `quantity`, `unit_price`, `tax_rate`, `tax_amount`, `line_total`) VALUES
(1, 1, 1, 2, 1, 1760.00, 10.00, 176.00, 1936.00),
(2, 2, 2, 4, 1, 3060.00, 10.00, 306.00, 3366.00),
(3, 3, 1, 1, 1, 1200.00, 10.00, 120.00, 1320.00);

-- Seed Subscription History (Lifecycle Audit Log)
INSERT IGNORE INTO `subscription_history` (`history_id`, `subscription_id`, `previous_status`, `new_status`, `changed_by`, `change_reason`) VALUES
(1, 1, NULL, 'DRAFT', 'STAFF_USER', 'Created draft subscription from Quotation QT-2026-0001'),
(2, 1, 'DRAFT', 'CONFIRMED', 'STAFF_USER', 'Verified and confirmed customer agreement'),
(3, 1, 'CONFIRMED', 'ACTIVE', 'SYSTEM', 'Activated upon start date 2026-10-01'),
(4, 2, NULL, 'DRAFT', 'STAFF_USER', 'Draft created manually for enterprise client'),
(5, 2, 'DRAFT', 'CONFIRMED', 'STAFF_USER', 'Customer signed enterprise contract'),
(6, 3, 'ACTIVE', 'PAUSED', 'STAFF_USER', 'Customer requested temporary pause during infrastructure migration');
