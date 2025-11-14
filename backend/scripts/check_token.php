<?php

require_once __DIR__ . '/../vendor/autoload.php';

Dotenv\Dotenv::createImmutable(__DIR__ . '/..')->load();

$token = $argv[1] ?? null;

$dsn = sprintf(
    'mysql:host=%s;dbname=%s;charset=utf8mb4',
    App\Core\Config::get('db_host'),
    App\Core\Config::get('db_name')
);

$pdo = new PDO($dsn, App\Core\Config::get('db_user'), App\Core\Config::get('db_pass'), [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

if ($token === null) {
    $stmt = $pdo->query('SELECT id, email, reset_token, reset_expires_at FROM users WHERE reset_token IS NOT NULL ORDER BY reset_expires_at DESC LIMIT 5');
    var_export($stmt->fetchAll(PDO::FETCH_ASSOC));
    echo PHP_EOL;
    exit(0);
}

$stmt = $pdo->prepare('SELECT id, email, reset_token, reset_expires_at FROM users WHERE reset_token = :token LIMIT 1');
$stmt->execute([':token' => $token]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user === false) {
    echo "No user found for token\n";
} else {
    var_export($user);
    echo PHP_EOL;
}

