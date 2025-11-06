-- Migration: Add phone column to user_profiles table
-- Run this script if you already have an existing database

USE linksphere;

-- Add phone column to existing user_profiles table
ALTER TABLE user_profiles ADD COLUMN phone VARCHAR(50) NULL AFTER location;

-- Add index for phone field (optional, for better performance)
CREATE INDEX idx_profiles_phone ON user_profiles(phone);
