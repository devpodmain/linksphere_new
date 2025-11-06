<?php
// Set CORS headers for cross-origin requests
// CORS headers are handled by main index.php
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include required files
require_once __DIR__ . '/../src/Core/Config.php';
require_once __DIR__ . '/../src/Core/Auth.php';
require_once __DIR__ . '/../src/Core/Database.php';

use App\Core\Config;
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
        // Production Hostinger environment
        $uploadDir = __DIR__ . '/../public/uploads/profiles/';
        $webPath = '/public/uploads/profiles/';
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
    
    // Check if GD extension is available for image processing
    if (extension_loaded('gd')) {
        // Move uploaded file and process with GD
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            throw new Exception('Failed to move uploaded file');
        }
        
        // Optimize image (convert to JPEG, resize, circular crop)
        optimizeProfileImage($filepath);
    } else {
        // Simple file move without processing
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            throw new Exception('Failed to move uploaded file');
        }
    }
    
    // Update database with new image URL
    $db = Database::getInstance()->getConnection();
    $imageUrl = $webPath . $filename;
    
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
        'message' => 'Profile image uploaded successfully',
        'url' => $imageUrl
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Upload failed: ' . $e->getMessage()
    ]);
}

/**
 * Optimize profile image: resize, convert to JPEG, and apply circular crop
 */
function optimizeProfileImage($filepath) {
    // Get image info
    $imageInfo = getimagesize($filepath);
    if (!$imageInfo) {
        throw new Exception('Invalid image file');
    }
    
    $sourceWidth = $imageInfo[0];
    $sourceHeight = $imageInfo[1];
    $mimeType = $imageInfo['mime'];
    
    // Create source image resource
    switch ($mimeType) {
        case 'image/jpeg':
            $sourceImage = imagecreatefromjpeg($filepath);
            break;
        case 'image/png':
            $sourceImage = imagecreatefrompng($filepath);
            break;
        case 'image/webp':
            $sourceImage = imagecreatefromwebp($filepath);
            break;
        default:
            throw new Exception('Unsupported image type');
    }
    
    if (!$sourceImage) {
        throw new Exception('Failed to create image resource');
    }
    
    // Target size for profile images
    $targetSize = 400;
    
    // Calculate dimensions to maintain aspect ratio and fit in square
    $ratio = min($targetSize / $sourceWidth, $targetSize / $sourceHeight);
    $newWidth = (int)($sourceWidth * $ratio);
    $newHeight = (int)($sourceHeight * $ratio);
    
    // Create destination image (square for circular cropping)
    $destinationImage = imagecreatetruecolor($targetSize, $targetSize);
    
    // Fill with white background
    $white = imagecolorallocate($destinationImage, 255, 255, 255);
    imagefill($destinationImage, 0, 0, $white);
    
    // Resize and center the image
    imagecopyresampled(
        $destinationImage, $sourceImage,
        ($targetSize - $newWidth) / 2, ($targetSize - $newHeight) / 2,
        0, 0,
        $newWidth, $newHeight,
        $sourceWidth, $sourceHeight
    );
    
    // Create circular mask
    $mask = imagecreatetruecolor($targetSize, $targetSize);
    $transparent = imagecolorallocatealpha($mask, 0, 0, 0, 127);
    imagefill($mask, 0, 0, $transparent);
    imagesavealpha($mask, true);
    
    // Draw white circle
    $white = imagecolorallocate($mask, 255, 255, 255);
    imagefilledellipse($mask, $targetSize / 2, $targetSize / 2, $targetSize, $targetSize, $white);
    
    // Apply circular mask
    imagealphablending($destinationImage, false);
    for ($x = 0; $x < $targetSize; $x++) {
        for ($y = 0; $y < $targetSize; $y++) {
            $maskPixel = imagecolorat($mask, $x, $y);
            if ($maskPixel == 0) { // Black pixel (outside circle)
                imagesetpixel($destinationImage, $x, $y, $white);
            }
        }
    }
    
    // Save as JPEG
    if (!imagejpeg($destinationImage, $filepath, 90)) {
        throw new Exception('Failed to save optimized image');
    }
    
    // Clean up
    imagedestroy($sourceImage);
    imagedestroy($destinationImage);
    imagedestroy($mask);
}
?>