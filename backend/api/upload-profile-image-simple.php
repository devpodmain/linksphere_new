<?php
header('Content-Type: application/json');
// CORS headers are handled by main index.php
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Include required files
require_once __DIR__ . '/../src/Core/Auth.php';
require_once __DIR__ . '/../src/Core/Database.php';

use App\Core\Auth;
use App\Core\Database;

// Check if user is authenticated
$user = Auth::getCurrentUser();
if (!$user) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Authentication required'
    ]);
    exit;
}

// Check if file was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'No image file provided or upload error'
    ]);
    exit;
}

$file = $_FILES['image'];

// Validate file type
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
$fileType = mime_content_type($file['tmp_name']);

if (!in_array($fileType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid file type. Only JPG, JPEG, PNG, and WEBP files are allowed.'
    ]);
    exit;
}

// Validate file size (2MB max)
$maxSize = 2 * 1024 * 1024; // 2MB in bytes
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'File size too large. Maximum size is 2MB.'
    ]);
    exit;
}

try {
    // Determine upload directory based on environment
    $isLocal = isset($_SERVER['HTTP_HOST']) && (
        strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || 
        strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false ||
        strpos($_SERVER['HTTP_HOST'], 'xampp') !== false
    );
    
    if ($isLocal) {
        // Local XAMPP environment
        $uploadDir = __DIR__ . '/../uploads/profiles/';
        $webPath = '/backend/uploads/profiles/';
    } else {
        // Production qr.dzyte.com environment with Hostinger path structure
        $uploadDir = __DIR__ . '/../uploads/profiles/';
$webPath = '/00webapp/qr/backend/image.php?file=';
    }
    
    // Create upload directory if it doesn't exist
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            throw new Exception('Failed to create upload directory');
        }
    }
    
    // Generate filename: profile_<userid>_<timestamp>.jpg
    $filename = 'profile_' . $user['id'] . '_' . time() . '.jpg';
    $filepath = $uploadDir . $filename;
    
    // Move uploaded file (simple version without image processing)
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to move uploaded file');
    }
    
    // Update database with new image URL
    $db = Database::getInstance()->getConnection();
    $imageUrl = $webPath . $filename . '&type=profiles';
    // Update user profile with new image URL
    $stmt = $db->prepare("
        UPDATE user_profiles 
        SET profile_image = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
    ");
    
    if (!$stmt->execute([$imageUrl, $user['id']])) {
        throw new Exception('Failed to update profile in database');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Profile image uploaded successfully (simple version)',
        'url' => $imageUrl
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Upload failed: ' . $e->getMessage()
    ]);
}
?>
