-- Linksphere Database Schema
CREATE DATABASE IF NOT EXISTS linksphere;
USE linksphere;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'user') NOT NULL DEFAULT 'user',
    subscription_plan ENUM('trial', 'free', 'basic', 'premium') NOT NULL DEFAULT 'free',
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    subscription_status ENUM('active', 'expired', 'paused') NOT NULL DEFAULT 'active',
    subscription_period ENUM('trial', 'monthly', 'yearly') NULL,
    subscription_expires_at DATETIME NULL,
    email_verified TINYINT(1) NOT NULL DEFAULT 0,
    email_verification_token VARCHAR(255) NULL,
    reset_token VARCHAR(255) NULL,
    reset_expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- User profiles table
CREATE TABLE user_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    profile_image VARCHAR(500) NULL,
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(500) NULL,
    location VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    email VARCHAR(255) NULL,
    bio TEXT NULL,
    profile_url VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Social links table
CREATE TABLE social_links (
    id INT PRIMARY KEY AUTO_INCREMENT,
    profile_id INT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Custom links table
CREATE TABLE custom_links (
    id INT PRIMARY KEY AUTO_INCREMENT,
    profile_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    icon VARCHAR(100) NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Collaborations table
CREATE TABLE collaborations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    profile_id INT NOT NULL,
    logo VARCHAR(500) NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    url VARCHAR(500) NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Support tickets table
CREATE TABLE support_tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_profiles_url ON user_profiles(profile_url);
CREATE INDEX idx_social_links_profile_id ON social_links(profile_id);
CREATE INDEX idx_custom_links_profile_id ON custom_links(profile_id);
CREATE INDEX idx_collaborations_profile_id ON collaborations(profile_id);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);


-- System settings table
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO system_settings (setting_key, setting_value) VALUES
    ('pricing_basic_monthly', '249'),
    ('pricing_basic_yearly', '2499'),
    ('pricing_premium_monthly', '350'),
    ('pricing_premium_yearly', '3500'),
    ('support_email', 'support@linksphere.com'),
    ('support_phone', '+91-0000-000000');

-- Payments table
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    razorpay_order_id VARCHAR(191) NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(191) NULL,
    razorpay_signature VARCHAR(255) NULL,
    plan ENUM('free', 'basic', 'premium') NOT NULL,
    period ENUM('monthly', 'yearly') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status ENUM('created', 'paid', 'failed') NOT NULL DEFAULT 'created',
    response_payload JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subscription history table
CREATE TABLE subscription_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    previous_plan ENUM('trial', 'free', 'basic', 'premium') NULL,
    new_plan ENUM('trial', 'free', 'basic', 'premium') NOT NULL,
    status ENUM('active', 'expired', 'paused') NOT NULL DEFAULT 'active',
    period ENUM('trial', 'monthly', 'yearly') NULL,
    expires_at DATETIME NULL,
    changed_by VARCHAR(191) NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_subscription_history_user_id ON subscription_history(user_id, changed_at DESC);

-- Email logs table
CREATE TABLE email_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    email VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);

