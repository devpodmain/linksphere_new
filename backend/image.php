<?php
// Image serving script for profile and collaboration images
// Security: Prevent directory traversal and validate file types

$filename = $_GET['file'] ?? '';
$type = $_GET['type'] ?? 'profiles';

// Validate filename - prevent directory traversal
if (empty($filename) || strpos($filename, '..') !== false || strpos($filename, '/') !== false || strpos($filename, '\\') !== false) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Invalid filename']);
    exit;
}

// Validate type parameter - only allow specific types
$allowedTypes = ['profiles', 'collaborations','qr'];
if (!in_array($type, $allowedTypes)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Invalid type. Allowed: ' . implode(', ', $allowedTypes)]);
    exit;
}

// Construct file path - FIXED: removed the extra '../'
$filePath = __DIR__ . '/uploads/' . $type . '/' . $filename;

// Check if file exists
if (!file_exists($filePath)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'File not found: ' . $filePath]);
    exit;
}

// Get file info
$fileInfo = pathinfo($filePath);
$extension = strtolower($fileInfo['extension'] ?? '');

// Validate file extension
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
if (!in_array($extension, $allowedExtensions)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Invalid file type. Allowed: ' . implode(', ', $allowedExtensions)]);
    exit;
}

// Set appropriate headers
$mimeTypes = [
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'webp' => 'image/webp'
];

$mimeType = $mimeTypes[$extension] ?? mime_content_type($filePath);

// Set headers for image serving
header('Access-Control-Allow-Origin: *'); // Allow cross-origin requests
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: public, max-age=31536000'); // Cache for 1 year
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');

// Output the file
readfile($filePath);
exit;
?>