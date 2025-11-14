CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    ('support_phone', '+91-0000-000000')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);







