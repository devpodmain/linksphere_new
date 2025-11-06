<?php
// Simple image serving script
$filename = $_GET['file'] ?? '';
$type = $_GET['type'] ?? 'profiles';

if (empty($filename)) {
    http_response_code(400);
    echo json_encode(['error' => 'No filename provided']);
    exit;
}

$filePath = __DIR__ . '/../uploads/' . $type . '/' . $filename;

if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
    exit;
}

$mimeType = mime_content_type($filePath);
header('Access-Control-Allow-Origin: *'); // Allow cross-origin requests
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($filePath));
readfile($filePath);
?>
