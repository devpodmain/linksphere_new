<?php

namespace App\Controllers;

use App\Services\SystemSettings;

class ConfigController
{
    public function getPricing(): void
    {
        $pricing = SystemSettings::getPricing();

        echo json_encode([
            'success' => true,
            'pricing' => $pricing,
        ]);
    }
}







