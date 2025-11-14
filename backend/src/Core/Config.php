<?php

namespace App\Core;

class Config
{
    private static $config = [];

    public static function get($key, $default = null)
    {
        if (empty(self::$config)) {
            self::load();
        }
        
        return self::$config[$key] ?? $default;
    }

    private static function load()
    {
        self::$config = [
            'db_host' => $_ENV['DB_HOST'] ?? 'localhost',
            'db_name' => $_ENV['DB_NAME'] ?? 'linksphere',
            'db_user' => $_ENV['DB_USER'] ?? 'root',
            'db_pass' => $_ENV['DB_PASS'] ?? '',
            'jwt_secret' => $_ENV['JWT_SECRET'] ?? 'default-secret-key',
            'jwt_algorithm' => $_ENV['JWT_ALGORITHM'] ?? 'HS256',
            'jwt_access_expiry' => (int)($_ENV['JWT_ACCESS_EXPIRY'] ?? 3600),
            'jwt_refresh_expiry' => (int)($_ENV['JWT_REFRESH_EXPIRY'] ?? 604800),
            'upload_path' => $_ENV['UPLOAD_PATH'] ?? 'uploads/',
            'max_file_size' => (int)($_ENV['MAX_FILE_SIZE'] ?? 5242880),
            'allowed_image_types' => explode(',', $_ENV['ALLOWED_IMAGE_TYPES'] ?? 'jpg,jpeg,png,gif'),
            'razorpay_key_id' => $_ENV['RAZORPAY_KEY_ID'] ?? null,
            'razorpay_key_secret' => $_ENV['RAZORPAY_KEY_SECRET'] ?? null,
            'smtp_host' => $_ENV['SMTP_HOST'] ?? '',
            'smtp_port' => (int)($_ENV['SMTP_PORT'] ?? 587),
            'smtp_user' => $_ENV['SMTP_USER'] ?? '',
            'smtp_pass' => $_ENV['SMTP_PASS'] ?? '',
            'mail_from' => $_ENV['MAIL_FROM'] ?? '',
            'mail_from_name' => $_ENV['MAIL_FROM_NAME'] ?? 'Linksphere',
            'app_base_url' => rtrim($_ENV['APP_BASE_URL'] ?? $_ENV['API_URL'] ?? '', '/'),
            'frontend_url' => rtrim($_ENV['FRONTEND_URL'] ?? $_ENV['APP_URL'] ?? '', '/'),
        ];
    }
}


