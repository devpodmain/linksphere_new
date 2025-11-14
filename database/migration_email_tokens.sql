-- Migration: add email verification and reset columns to users table

ALTER TABLE users
    ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER subscription_expires_at,
    ADD COLUMN email_verification_token VARCHAR(255) NULL AFTER email_verified,
    ADD COLUMN reset_token VARCHAR(255) NULL AFTER email_verification_token,
    ADD COLUMN reset_expires_at DATETIME NULL AFTER reset_token;

CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_reset_token ON users(reset_token);





