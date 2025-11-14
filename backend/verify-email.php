<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Core\Config;
use App\Core\Database;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$connection = Database::getInstance()->getConnection();
$token = $_GET['token'] ?? '';
$success = false;
$message = 'Invalid or expired verification link.';

if (!empty($token)) {
    $stmt = $connection->prepare("
        SELECT id, email_verified
        FROM users
        WHERE email_verification_token = :token
        LIMIT 1
    ");
    $stmt->execute([':token' => $token]);
    $user = $stmt->fetch();

    if ($user && (int)$user['email_verified'] !== 1) {
        $update = $connection->prepare("
            UPDATE users
            SET email_verified = 1,
                email_verification_token = NULL,
                updated_at = NOW()
            WHERE id = :id
        ");
        $update->execute([':id' => $user['id']]);

        $success = true;
        $message = 'Email verified successfully! You can now log in.';
    } elseif ($user && (int)$user['email_verified'] === 1) {
        $success = true;
        $message = 'Email already verified. You can log in.';
    }
}

$frontendUrl = Config::get('frontend_url') ?: null;

if ($frontendUrl) {
    $redirectUrl = rtrim($frontendUrl, '/');
    $redirectUrl .= '/login?verified=' . ($success ? '1' : '0');
    $redirectUrl .= '&message=' . urlencode($message);
    header('Location: ' . $redirectUrl, true, 302);
    exit;
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f9fafb; color: #111827; margin: 0; padding: 0; }
        .wrapper { max-width: 480px; margin: 80px auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 20px 45px -20px rgba(15, 23, 42, 0.35); text-align: center; }
        h1 { font-size: 1.75rem; margin-bottom: 16px; }
        p { font-size: 1rem; line-height: 1.5; }
        .success { color: #047857; }
        .error { color: #b91c1c; }
        a.button { display: inline-block; margin-top: 24px; padding: 12px 20px; background: #4f46e5; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; }
        a.button:hover { background: #4338ca; }
    </style>
</head>
<body>
    <div class="wrapper">
        <h1><?= $success ? 'Email Verified' : 'Verification Failed'; ?></h1>
        <p class="<?= $success ? 'success' : 'error'; ?>"><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8'); ?></p>
    </div>
</body>
</html>





