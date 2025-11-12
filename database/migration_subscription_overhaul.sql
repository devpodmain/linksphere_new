-- Migration: subscription lifecycle overhaul
-- Adds trial support and simplifies subscription status handling

ALTER TABLE users
    MODIFY subscription_plan ENUM('trial', 'free', 'basic', 'premium') NOT NULL DEFAULT 'free',
    MODIFY subscription_status ENUM('active', 'expired') NOT NULL DEFAULT 'active',
    MODIFY subscription_period ENUM('trial', 'monthly', 'yearly') NULL;

-- Clean up legacy values that are no longer valid
UPDATE users
SET subscription_status = 'expired'
WHERE subscription_status NOT IN ('active', 'expired');

-- Ensure free plans have no period/expiry
UPDATE users
SET subscription_period = NULL,
    subscription_expires_at = NULL
WHERE subscription_plan = 'free';

-- Optional: mark any missing expiry for active paid plans to 30 days from now
UPDATE users
SET subscription_expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY)
WHERE subscription_status = 'active'
  AND subscription_plan IN ('trial', 'basic', 'premium')
  AND subscription_expires_at IS NULL;

-- Cron helper snippet (run daily) to expire overdue plans
-- UPDATE users
-- SET subscription_plan = 'free',
--     subscription_status = 'expired',
--     subscription_period = NULL,
--     subscription_expires_at = NOW()
-- WHERE subscription_status = 'active'
--   AND subscription_plan IN ('trial', 'basic', 'premium')
--   AND subscription_expires_at < NOW();


