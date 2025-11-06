-- Linksphere Database Schema
CREATE DATABASE IF NOT EXISTS linksphere;
USE linksphere;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_plan ENUM('free', 'premium') DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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


