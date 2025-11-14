<?php

namespace App\Services;

use App\Core\Database;

class SystemSettings
{
    private static ?array $cache = null;

    private static function load(): void
    {
        if (self::$cache !== null) {
            return;
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->query("SELECT setting_key, setting_value FROM system_settings");
        $settings = [];
        foreach ($stmt->fetchAll() as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        self::$cache = $settings;
    }

    public static function clearCache(): void
    {
        self::$cache = null;
    }

    public static function getAll(): array
    {
        self::load();
        return self::$cache ?? [];
    }

    public static function getPricing(): array
    {
        $settings = self::getAll();

        $get = static function (string $key, float $default) use ($settings): float {
            if (!isset($settings[$key]) || $settings[$key] === '') {
                return $default;
            }
            return (float) $settings[$key];
        };

        return [
            'basic' => [
                'monthly' => $get('pricing_basic_monthly', 249.0),
                'yearly' => $get('pricing_basic_yearly', 2499.0),
            ],
            'premium' => [
                'monthly' => $get('pricing_premium_monthly', 350.0),
                'yearly' => $get('pricing_premium_yearly', 3500.0),
            ],
        ];
    }
}







