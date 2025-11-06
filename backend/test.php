<?php
// Simple test script to verify backend setup
echo "Linksphere Backend Test\n";
echo "======================\n\n";

echo $_SERVER['REQUEST_METHOD']; 

// Test PHP version
echo "PHP Version: " . PHP_VERSION . "\n";

// Test required extensions
$required_extensions = ['pdo', 'pdo_mysql', 'json', 'openssl'];
echo "\nRequired Extensions:\n";
foreach ($required_extensions as $ext) {
    $status = extension_loaded($ext) ? '✓' : '✗';
    echo "  $ext: $status\n";
}



// Test database connection
echo "\nDatabase Connection Test:\n";
try {
    $pdo = new PDO('mysql:host=localhost;dbname=linksphere', 'root', '');
    echo "  Database: ✓ Connected\n";
} catch (PDOException $e) {
    echo "  Database: ✗ " . $e->getMessage() . "\n";
}

// Test JWT library
echo "\nJWT Library Test:\n";
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    echo "  Composer: ✓ Installed\n";
    require_once __DIR__ . '/vendor/autoload.php';
    if (class_exists('Firebase\JWT\JWT')) {
        echo "  JWT Library: ✓ Available\n";
    } else {
        echo "  JWT Library: ✗ Not found\n";
    }
} else {
    echo "  Composer: ✗ Not installed\n";
}

echo "\nBackend setup test completed!\n";
?>


