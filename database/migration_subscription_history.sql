-- Migration: subscription history log

CREATE TABLE IF NOT EXISTS subscription_history (
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

