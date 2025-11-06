<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Auth;
use App\Core\Config;

class UploadController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function uploadProfileImage()
    {
        $user = Auth::getCurrentUser();
        
        if (!isset($_FILES['image'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'No image file provided'
            ]);
            return;
        }

        $file = $_FILES['image'];
        
        // Validate file
        $errors = $this->validateProfileImageFile($file);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid file',
                'errors' => $errors
            ]);
            return;
        }

        try {
            // Determine upload directory based on environment
            $isLocal = isset($_SERVER['HTTP_HOST']) && (
                strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || 
                strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false ||
                strpos($_SERVER['HTTP_HOST'], 'xampp') !== false
            );
            
            // Generate filename as profile_<userid>_<timestamp>.jpg
            $filename = 'profile_' . $user['id'] . '_' . time() . '.jpg';
            
            if ($isLocal) {
                // Local XAMPP environment
                $uploadDir = __DIR__ . '/../../uploads/profiles/';
                $imageUrl = '/uploads/profiles/' . $filename;
            } else {
                // Production qr.dzyte.com environment with Hostinger path structure
               $uploadDir = __DIR__ . '/../../uploads/profiles/';
                $imageUrl = '/backend/image.php?file=' . $filename . '&type=profiles';
            }
            
            // Create upload directory if it doesn't exist
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $filepath = $uploadDir . $filename;

            // Process and optimize image
            $this->optimizeImage($file['tmp_name'], $filepath);
            
            // Update database with new image URL
            $stmt = $this->db->prepare("
                UPDATE user_profiles 
                SET profile_image = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE user_id = ?
            ");
            
            if (!$stmt->execute([$imageUrl, $user['id']])) {
                throw new \Exception('Failed to update profile in database');
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Profile image uploaded and optimized successfully',
                'image_url' => $imageUrl
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to upload image',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function uploadCollaborationLogo()
    {
        $user = Auth::getCurrentUser();
        
        if (!isset($_FILES['logo'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'No logo file provided'
            ]);
            return;
        }

        $file = $_FILES['logo'];
        
        // Validate file
        $errors = $this->validateCollaborationLogoFile($file);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid file',
                'errors' => $errors
            ]);
            return;
        }

        try {
            // Determine upload directory based on environment
            $isLocal = isset($_SERVER['HTTP_HOST']) && (
                strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || 
                strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false ||
                strpos($_SERVER['HTTP_HOST'], 'xampp') !== false
            );
            
            // Generate unique filename
            $filename = 'logo_' . $user['id'] . '_' . time() . '.jpg';
            
            if ($isLocal) {
                // Local XAMPP environment
                $uploadDir = __DIR__ . '/../../uploads/collaborations/';
                $logoUrl = '/api/uploads/collaborations/' . $filename;
            } else {
                // Production qr.dzyte.com environment with Hostinger path structure
               $uploadDir = __DIR__ . '/../../uploads/collaborations/';
                $logoUrl = '/backend/image.php?file=' . $filename . '&type=collaborations';
            }
            
            // Create upload directory if it doesn't exist
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $filepath = $uploadDir . $filename;

            // Process and optimize image (smaller size for logos) - use cover mode to fill circle
            $this->optimizeImage($file['tmp_name'], $filepath, 200, 200, 'cover');
            
            echo json_encode([
                'success' => true,
                'message' => 'Logo uploaded and optimized successfully',
                'logo_url' => $logoUrl
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to upload logo',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function uploadUpiQR()
    {
        $user = Auth::getCurrentUser();
        
        if (!isset($_FILES['qr'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'No QR code file provided'
            ]);
            return;
        }

        $file = $_FILES['qr'];
        
        // Validate file
        $errors = $this->validateCollaborationLogoFile($file);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid file',
                'errors' => $errors
            ]);
            return;
        }

        try {
            // Determine upload directory based on environment
            $isLocal = isset($_SERVER['HTTP_HOST']) && (
                strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || 
                strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false ||
                strpos($_SERVER['HTTP_HOST'], 'xampp') !== false
            );
            
            // Generate unique filename
            $filename = 'upi_qr_' . $user['id'] . '_' . time() . '.jpg';
            
            if ($isLocal) {
                // Local XAMPP environment
                $uploadDir = __DIR__ . '/../../uploads/qr/';
                $qrUrl = '/uploads/qr/' . $filename;
            } else {
                // Production qr.dzyte.com environment with Hostinger path structure
                $uploadDir = __DIR__ . '/../../uploads/qr/';
                $qrUrl = '/backend/image.php?file=' . $filename . '&type=qr';
            }
            
            // Create upload directory if it doesn't exist
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $filepath = $uploadDir . $filename;

            // Process and optimize image for QR code (512x512 for better scanning)
            $this->optimizeImage($file['tmp_name'], $filepath, 512, 512, 'contain');
            
            echo json_encode([
                'success' => true,
                'message' => 'UPI QR code uploaded and optimized successfully',
                'qr_url' => $qrUrl
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to upload QR code',
                'error' => $e->getMessage()
            ]);
        }
    }

    private function validateProfileImageFile($file)
    {
        $errors = [];

        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = 'File upload error';
            return $errors;
        }

        // Check file size (2MB max for profile images)
        if ($file['size'] > 2 * 1024 * 1024) {
            $errors[] = 'File size too large. Maximum size: 2MB';
        }

        // Check file type
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];
        if (!in_array($extension, $allowedTypes)) {
            $errors[] = 'Invalid file type. Allowed types: JPG, JPEG, PNG, WEBP';
        }

        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!in_array($mimeType, $allowedMimeTypes)) {
            $errors[] = 'Invalid file type detected';
        }

        return $errors;
    }

    private function validateCollaborationLogoFile($file)
    {
        $errors = [];

        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = 'File upload error';
            return $errors;
        }

        // Check file size (1MB max for logos)
        if ($file['size'] > 1 * 1024 * 1024) {
            $errors[] = 'File size too large. Maximum size: 1MB';
        }

        // Check file type
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];
        if (!in_array($extension, $allowedTypes)) {
            $errors[] = 'Invalid file type. Allowed types: JPG, JPEG, PNG, WEBP';
        }

        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!in_array($mimeType, $allowedMimeTypes)) {
            $errors[] = 'Invalid file type detected';
        }

        return $errors;
    }

    private function optimizeImage($sourcePath, $destinationPath, $maxWidth = 400, $maxHeight = 400, $cropMode = 'contain')
    {
        // Check if GD extension is available
        if (!extension_loaded('gd')) {
            // Fallback: just copy the file without processing
            error_log('GD extension not available - using simple file copy for image upload');
            if (!copy($sourcePath, $destinationPath)) {
                throw new \Exception('Failed to copy image file (GD extension not available)');
            }
            return;
        }

        // Get image info
        $imageInfo = getimagesize($sourcePath);
        if (!$imageInfo) {
            throw new \Exception('Invalid image file');
        }

        $sourceWidth = $imageInfo[0];
        $sourceHeight = $imageInfo[1];
        $mimeType = $imageInfo['mime'];

        // Create source image resource
        switch ($mimeType) {
            case 'image/jpeg':
                $sourceImage = imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $sourceImage = imagecreatefrompng($sourcePath);
                break;
            case 'image/webp':
                $sourceImage = imagecreatefromwebp($sourcePath);
                break;
            default:
                throw new \Exception('Unsupported image type');
        }

        if (!$sourceImage) {
            throw new \Exception('Failed to create image resource');
        }

        // Calculate dimensions based on crop mode
        if ($cropMode === 'cover') {
            // Fill entire area, crop excess
            $ratio = max($maxWidth / $sourceWidth, $maxHeight / $sourceHeight);
        } else {
            // Fit entire image, add transparent borders
            $ratio = min($maxWidth / $sourceWidth, $maxHeight / $sourceHeight);
        }
        $newWidth = (int)($sourceWidth * $ratio);
        $newHeight = (int)($sourceHeight * $ratio);

        // Create destination image (square for circular cropping)
        $size = $maxWidth; // Use maxWidth as the square size
        $destinationImage = imagecreatetruecolor($size, $size);

        // Fill with transparent background
        imagealphablending($destinationImage, false);
        $transparent = imagecolorallocatealpha($destinationImage, 0, 0, 0, 127);
        imagefill($destinationImage, 0, 0, $transparent);
        imagesavealpha($destinationImage, true);

        // Resize and center/crop the image based on mode
        if ($cropMode === 'cover') {
            // Crop from center for cover mode
            $srcX = (int)(($sourceWidth - $maxWidth / $ratio) / 2);
            $srcY = (int)(($sourceHeight - $maxHeight / $ratio) / 2);
            $srcW = (int)($maxWidth / $ratio);
            $srcH = (int)($maxHeight / $ratio);
            
            imagecopyresampled(
                $destinationImage, $sourceImage,
                0, 0,
                $srcX, $srcY,
                $size, $size,
                $srcW, $srcH
            );
        } else {
            // Center the image for contain mode
            imagecopyresampled(
                $destinationImage, $sourceImage,
                ($size - $newWidth) / 2, ($size - $newHeight) / 2,
                0, 0,
                $newWidth, $newHeight,
                $sourceWidth, $sourceHeight
            );
        }

        // Create circular mask
        $mask = imagecreatetruecolor($size, $size);
        imagealphablending($mask, false);
        $transparent = imagecolorallocatealpha($mask, 0, 0, 0, 127);
        imagefill($mask, 0, 0, $transparent);
        imagesavealpha($mask, true);

        // Draw white circle
        $white = imagecolorallocate($mask, 255, 255, 255);
        imagefilledellipse($mask, $size / 2, $size / 2, $size, $size, $white);

        // Apply circular mask
        imagealphablending($destinationImage, false);
        for ($x = 0; $x < $size; $x++) {
            for ($y = 0; $y < $size; $y++) {
                $maskPixel = imagecolorat($mask, $x, $y);
                if ($maskPixel == 0) { // Black pixel (outside circle)
                    imagesetpixel($destinationImage, $x, $y, $transparent);
                }
            }
        }

        // Save as JPEG
        $result = imagejpeg($destinationImage, $destinationPath, 90);

        // Clean up
        imagedestroy($sourceImage);
        imagedestroy($destinationImage);
        imagedestroy($mask);

        if (!$result) {
            throw new \Exception('Failed to save optimized image');
        }
    }
}

