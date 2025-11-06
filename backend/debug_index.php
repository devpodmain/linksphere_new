<?php
echo "=== Frontend Debug ===\n\n";

$basePath = '/home/u159162192/domains/dzyte.com/public_html/00webapp/qr/';

echo "Base path: " . $basePath . "\n\n";

// Check frontend directory
$frontendPath = $basePath ;
echo "Frontend path: " . $frontendPath . "\n";
echo "Frontend exists: " . (is_dir($frontendPath) ? 'YES' : 'NO') . "\n";

if (is_dir($frontendPath)) {
    echo "Files in frontend:\n";
    $files = scandir($frontendPath);
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            echo "  - $file\n";
        }
    }
}

// Check index.html
$indexPath = $frontendPath . 'index.html';
echo "\nindex.html path: " . $indexPath . "\n";
echo "index.html exists: " . (file_exists($indexPath) ? 'YES' : 'NO') . "\n";

if (file_exists($indexPath)) {
    echo "index.html size: " . filesize($indexPath) . " bytes\n";
    echo "First 200 chars:\n";
    echo substr(file_get_contents($indexPath), 0, 200) . "...\n";
}

// Check .htaccess
$htaccessPath = $basePath . '.htaccess';
echo "\n.htaccess path: " . $htaccessPath . "\n";
echo ".htaccess exists: " . (file_exists($htaccessPath) ? 'YES' : 'NO') . "\n";

if (file_exists($htaccessPath)) {
    echo ".htaccess size: " . filesize($htaccessPath) . " bytes\n";
}
?>