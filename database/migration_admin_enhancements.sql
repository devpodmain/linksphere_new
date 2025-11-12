ALTER TABLE users
    MODIFY COLUMN role ENUM('super_admin','admin','user') NOT NULL DEFAULT 'user',
    MODIFY COLUMN subscription_plan ENUM('free','basic','premium') NOT NULL DEFAULT 'free';

ALTER TABLE users
    ADD COLUMN status ENUM('active','disabled') NOT NULL DEFAULT 'active' AFTER subscription_plan,
    ADD COLUMN subscription_status ENUM('active','expired','paused') NOT NULL DEFAULT 'active' AFTER status,
    ADD COLUMN subscription_period ENUM('monthly','yearly') NULL AFTER subscription_status,
    ADD COLUMN subscription_expires_at DATETIME NULL AFTER subscription_period;


