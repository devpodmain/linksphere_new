-- Migration: extend subscription_status enum to include paused

ALTER TABLE users
MODIFY COLUMN subscription_status ENUM('active', 'expired', 'paused') NOT NULL DEFAULT 'active';

