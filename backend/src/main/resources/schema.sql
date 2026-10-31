-- =====================================================================
-- DATABASE: subscription_management
-- Shared Subscription Management System - Unified Schema
-- Includes Module 1 (Auth/Customer), Module 2 (Product/Subscription),
-- and Module 3 (Billing, Invoicing, Tax, Discounts, Payments, Recurring Cycles)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `subscription_management` 
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `subscription_management`;

-- ---------------------------------------------------------------------
-- 1. Shared Models from Module 1 & Module 2
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `customers` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `phone` VARCHAR(50),
    `billing_address` VARCHAR(255) NOT NULL,
    `country` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100),
    `tax_number` VARCHAR(100),
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `products` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `sku` VARCHAR(100) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `billing_interval` VARCHAR(30) NOT NULL DEFAULT 'MONTHLY',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `subscription_number` VARCHAR(100) NOT NULL UNIQUE,
    `customer_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `billing_interval` VARCHAR(30) NOT NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `start_date` DATE NOT NULL,
    `end_date` DATE,
    `next_billing_date` DATE NOT NULL,
    `auto_renew` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_sub_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
    CONSTRAINT `fk_sub_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2. Module 3: Tax Rules & Discounts
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `tax_rules` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `rule_name` VARCHAR(100) NOT NULL,
    `rate_percentage` DECIMAL(6, 2) NOT NULL,
    `country` VARCHAR(100),
    `state` VARCHAR(100),
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `description` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `discounts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255),
    `discount_type` VARCHAR(30) NOT NULL, -- 'FIXED_AMOUNT' or 'PERCENTAGE'
    `discount_value` DECIMAL(12, 2) NOT NULL,
    `min_purchase_amount` DECIMAL(12, 2),
    `min_quantity` INT,
    `start_date` DATE,
    `end_date` DATE,
    `max_usage_count` INT,
    `current_usage_count` INT NOT NULL DEFAULT 0,
    `applicable_product_id` BIGINT,
    `applicable_subscription_id` BIGINT,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `version` BIGINT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_discount_product` FOREIGN KEY (`applicable_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_discount_sub` FOREIGN KEY (`applicable_subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 3. Module 3: Invoices & Invoice Lines
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `invoices` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `invoice_number` VARCHAR(100) NOT NULL UNIQUE,
    `subscription_id` BIGINT,
    `customer_id` BIGINT NOT NULL,
    `customer_name` VARCHAR(150) NOT NULL,
    `customer_email` VARCHAR(150) NOT NULL,
    `billing_address` VARCHAR(255) NOT NULL,
    `invoice_date` DATE NOT NULL,
    `due_date` DATE NOT NULL,
    `billing_period_start` DATE,
    `billing_period_end` DATE,
    `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `tax_rate` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `tax_rule_name` VARCHAR(100),
    `discount_code` VARCHAR(50),
    `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `amount_paid` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `outstanding_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, CONFIRMED, PAID, CANCELLED
    `payment_status` VARCHAR(30) NOT NULL DEFAULT 'UNPAID', -- UNPAID, PARTIALLY_PAID, PAID
    `sent_at` DATETIME,
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_inv_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_inv_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
    INDEX `idx_inv_status` (`status`),
    INDEX `idx_inv_due_date` (`due_date`),
    INDEX `idx_inv_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invoice_lines` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `invoice_id` BIGINT NOT NULL,
    `product_id` BIGINT,
    `product_name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(255),
    `quantity` INT NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `tax_rate` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `line_total` DECIMAL(12, 2) NOT NULL,
    CONSTRAINT `fk_line_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_line_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 4. Module 3: Discount Usage Tracking
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `discount_usages` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `discount_id` BIGINT NOT NULL,
    `invoice_id` BIGINT NOT NULL,
    `customer_id` BIGINT NOT NULL,
    `amount_deducted` DECIMAL(12, 2) NOT NULL,
    `used_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_du_discount` FOREIGN KEY (`discount_id`) REFERENCES `discounts` (`id`),
    CONSTRAINT `fk_du_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_du_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 5. Module 3: Billing-Period Tracking (Duplicate billing prevention)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `billing_period_records` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `subscription_id` BIGINT NOT NULL,
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `invoice_id` BIGINT NOT NULL,
    `billing_date` DATE NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'GENERATED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_bpr_sub` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_bpr_inv` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
    -- Strictly prevents duplicate invoices for the same subscription and billing period:
    CONSTRAINT `uk_sub_period` UNIQUE (`subscription_id`, `period_start`, `period_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 6. Module 3: Payments & Payment Allocations
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `payments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `payment_reference` VARCHAR(100) NOT NULL UNIQUE,
    `invoice_id` BIGINT NOT NULL,
    `payment_method` VARCHAR(50) NOT NULL, -- CREDIT_CARD, BANK_TRANSFER, CASH, CHECK, ONLINE_GATEWAY, OTHER
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_date` DATETIME NOT NULL,
    `notes` TEXT,
    `status` VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- COMPLETED, REFUNDED, FAILED
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pay_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
    INDEX `idx_pay_invoice` (`invoice_id`),
    INDEX `idx_pay_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payment_allocations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `payment_id` BIGINT NOT NULL,
    `invoice_id` BIGINT NOT NULL,
    `allocated_amount` DECIMAL(12, 2) NOT NULL,
    `allocated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_alloc_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_alloc_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 7. Seed Data for Testing and Verification
-- ---------------------------------------------------------------------

INSERT INTO `tax_rules` (`rule_name`, `rate_percentage`, `country`, `state`, `is_active`, `description`)
VALUES
('Standard VAT', 10.00, 'US', NULL, TRUE, 'Default standard sales tax'),
('EU Digital Services VAT', 20.00, 'UK', NULL, TRUE, 'Value-added tax on digital services'),
('State Sales Tax CA', 7.50, 'US', 'California', TRUE, 'California state sales tax');

INSERT INTO `discounts` (`code`, `description`, `discount_type`, `discount_value`, `min_purchase_amount`, `min_quantity`, `start_date`, `end_date`, `max_usage_count`, `current_usage_count`, `is_active`)
VALUES
('WELCOME10', '10% Welcome Discount for new subscribers', 'PERCENTAGE', 10.00, 20.00, 1, '2026-01-01', '2026-12-31', 100, 0, TRUE),
('FLAT25', '$25 off orders above $100', 'FIXED_AMOUNT', 25.00, 100.00, 1, '2026-01-01', '2026-12-31', 50, 0, TRUE),
('EXPIRED50', 'Expired discount test', 'PERCENTAGE', 50.00, 0.00, 1, '2025-01-01', '2025-12-31', 10, 0, FALSE);

INSERT INTO `customers` (`name`, `email`, `phone`, `billing_address`, `country`, `state`, `tax_number`, `status`)
VALUES
('Acme Corporation', 'billing@acme.com', '+1-555-0199', '100 Enterprise Way, Suite 400, San Francisco, CA', 'US', 'California', 'US-94829104', 'ACTIVE'),
('Nexus Dynamics', 'finance@nexusdynamics.io', '+1-555-0144', '42 Innovation Parkway, Austin, TX', 'US', 'Texas', 'US-82736152', 'ACTIVE'),
('Global Tech Ltd', 'accounts@globaltech.co.uk', '+44-20-7946-0912', '10 Finsbury Square, London', 'UK', NULL, 'GB-99281726', 'ACTIVE');

INSERT INTO `products` (`sku`, `name`, `description`, `unit_price`, `billing_interval`, `is_active`)
VALUES
('PROD-STARTER-MO', 'Starter SaaS Tier', 'Basic tier subscription for small teams', 49.00, 'MONTHLY', TRUE),
('PROD-ENTERPRISE-YR', 'Enterprise SaaS Tier', 'Full enterprise tier with dedicated support', 1200.00, 'YEARLY', TRUE),
('PROD-ADDON-SEATS', 'Additional 5 User Seats', 'Seat expansion add-on pack', 25.00, 'MONTHLY', TRUE);

INSERT INTO `subscriptions` (`subscription_number`, `customer_id`, `product_id`, `status`, `billing_interval`, `unit_price`, `quantity`, `start_date`, `end_date`, `next_billing_date`, `auto_renew`)
VALUES
('SUB-2026-0001', 1, 1, 'ACTIVE', 'MONTHLY', 49.00, 2, '2026-10-01', '2027-10-01', '2026-11-01', TRUE),
('SUB-2026-0002', 2, 2, 'ACTIVE', 'YEARLY', 1200.00, 1, '2025-11-01', '2026-11-01', '2026-11-01', TRUE),
('SUB-2026-0003', 3, 1, 'CANCELLED', 'MONTHLY', 49.00, 1, '2026-01-01', '2026-06-01', '2026-07-01', FALSE);
