<?php
// Set CORS headers for cross-origin requests
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://qr.dzyte.com' // Production domain
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Set CORS headers - MUST be specific origin when credentials are enabled
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // For development, default to localhost:5174 if no origin or invalid origin
    header('Access-Control-Allow-Origin: http://localhost:5174');
}

// Required headers for credentials
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With,Accept');
header('Content-Type: application/json');

header('Access-Control-Allow-Origin: https://qr.dzyte.com');


// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


// Include required files
require_once __DIR__ . '/vendor/autoload.php';

use App\Core\Router;
use App\Core\Database;
use App\Core\Config;

try {
    // Load environment variables
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
    
    // Initialize database connection
    Database::getInstance();
    
    // Initialize router
    $router = new Router();
    
    // Define routes
    require_once __DIR__ . '/routes/api.php';
    
    // Handle the request
    $router->dispatch();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error',
        'error' => $e->getMessage()
    ]);
}
?>

