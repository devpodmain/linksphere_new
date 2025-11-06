<?php
// Debug script to check environment variables
require_once __DIR__ . '/vendor/autoload.php';

echo "=== Environment Variables Debug ===\n\n";

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "DB_HOST: " . ($_ENV['DB_HOST'] ?? 'NOT SET') . "\n";
echo "DB_NAME: " . ($_ENV['DB_NAME'] ?? 'NOT SET') . "\n";
echo "DB_USER: " . ($_ENV['DB_USER'] ?? 'NOT SET') . "\n";
echo "DB_PASS: " . ($_ENV['DB_PASS'] ?? 'NOT SET') . "\n";
echo "JWT_SECRET: " . ($_ENV['JWT_SECRET'] ?? 'NOT SET') . "\n\n";

// Test Config class
use App\Core\Config;

echo "=== Config Class Values ===\n";
echo "db_host: " . Config::get('db_host') . "\n";
echo "db_name: " . Config::get('db_name') . "\n";
echo "db_user: " . Config::get('db_user') . "\n";
echo "db_pass: " . Config::get('db_pass') . "\n\n";

// Test database connection
echo "=== Database Connection Test ===\n";
try {
    $host = Config::get('db_host');
    $dbname = Config::get('db_name');
    $username = Config::get('db_user');
    $password = Config::get('db_pass');
    
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    
    echo "✅ Database connection successful!\n";
    echo "Connected to: {$dbname} as {$username}\n";
    
} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    echo "DSN used: {$dsn}\n";
    echo "Username: {$username}\n";
    echo "Password: " . (empty($password) ? 'EMPTY' : 'SET') . "\n";
}
?>