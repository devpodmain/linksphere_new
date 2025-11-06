-- Migration: Add UPI payment fields to user_profiles table
-- Run this script if you already have an existing database

USE linksphere;

-- Add UPI ID column to existing user_profiles table
ALTER TABLE user_profiles ADD COLUMN upi_id VARCHAR(255) NULL AFTER bio;

-- Add UPI QR code column to existing user_profiles table
ALTER TABLE user_profiles ADD COLUMN upi_qr VARCHAR(500) NULL AFTER upi_id;

