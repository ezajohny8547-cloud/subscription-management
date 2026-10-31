-- ==============================================================================
-- Module 1: Authentication and User Management Database Schema
-- Database: subscription_management
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `subscription_management`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `subscription_management`;

-- ------------------------------------------------------------------------------
-- Table: users
-- Stores all system accounts (ADMIN, STAFF, CUSTOMER)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'STAFF', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table: password_reset_tokens
-- Stores time-limited cryptographically secure tokens for password resets
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(100) NOT NULL,
    `user_id` BIGINT NOT NULL,
    `expiry_date` TIMESTAMP NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_prt_token` (`token`),
    INDEX `idx_prt_user_id` (`user_id`),
    INDEX `idx_prt_expiry_date` (`expiry_date`),
    CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Initial Seed Data
-- Default Administrator Account:
-- Email: admin@subscription.com
-- Password: Admin@12345
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`full_name`, `email`, `password_hash`, `role`, `status`)
SELECT 'System Administrator', 'admin@subscription.com', '$2a$10$iW3G4a/xK9FwV8wIqL3mE.z9v0s8h4qLgEw9sLpGq0vN8sF8V7t9K', 'ADMIN', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM `users` WHERE `email` = 'admin@subscription.com'
);
