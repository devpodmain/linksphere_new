<?php
// ============================================================
// ✅ GLOBAL CORS CONFIGURATION (must come before any output)
// ============================================================
$allowed_origins = [
    'http://localhost',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://qr.dzyte.com' // Production domain
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Dynamically set CORS headers only for allowed origins
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Default to production domain if no valid origin
    header('Access-Control-Allow-Origin: https://qr.dzyte.com');
}

// Allow credentials (for cookies)
header('Access-Control-Allow-Credentials: true');

// Allowed HTTP methods
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

// Allowed headers
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests early
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ============================================================
// ✅ AUTOLOADING & ENVIRONMENT SETUP
// ============================================================
require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Router;
use App\Core\Database;
use App\Core\Config;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Set default response type
header('Content-Type: application/json');

// ============================================================
// ✅ MAIN APPLICATION HANDLER
// ============================================================
try {
    // Initialize DB connection
    Database::getInstance();
    
    // Initialize router
    $router = new Router();
    
    // Include API routes
    require_once __DIR__ . '/../routes/api.php';
    
    // Dispatch current request
    $router->dispatch();
    
} catch (Exception $e) {
    // Log the actual error for debugging (production-safe)
    error_log("API Error: " . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error',
        'error' => $e->getMessage()
    ]);
}
