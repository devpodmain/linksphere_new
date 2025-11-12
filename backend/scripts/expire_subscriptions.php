<?php

declare(strict_types=1);

use App\Core\Database;

require __DIR__ . '/../vendor/autoload.php';

$db = Database::getInstance()->getConnection();

$stmt = $db->prepare("
    UPDATE users
    SET subscription_plan = 'free',
        subscription_status = 'expired',
        subscription_period = NULL,
        subscription_expires_at = NOW(),
        updated_at = NOW()
    WHERE subscription_status = 'active'
      AND subscription_plan IN ('trial', 'basic', 'premium')
      AND subscription_expires_at IS NOT NULL
      AND subscription_expires_at < NOW()
");

$stmt->execute();

$affected = $stmt->rowCount();

if (PHP_SAPI === 'cli') {
    echo sprintf("[%s] Expired %d subscriptions.\n", date('c'), $affected);
} else {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'expired' => $affected,
    ]);
}


