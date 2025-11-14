<?php

namespace App\Controllers;

use App\Core\Config;
use App\Core\Database;
use App\Core\JWTManager;
use App\Core\Mailer;
use App\Services\SubscriptionManager;
use DateInterval;
use DateTimeImmutable;

class AuthController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        JWTManager::init();
    }

    public function register()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validation
        $errors = $this->validateRegistration($input);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $errors
            ]);
            return;
        }

        try {
            // Check if email already exists
            $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$input['email']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email already registered'
                ]);
                return;
            }

            // Hash password
            $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);

            // Create user
            $this->db->beginTransaction();
            
            $verificationToken = bin2hex(random_bytes(32));

            $stmt = $this->db->prepare("
                INSERT INTO users (name, email, password_hash, email_verification_token, email_verified)
                VALUES (?, ?, ?, ?, 0)
            ");
            $stmt->execute([$input['name'], $input['email'], $passwordHash, $verificationToken]);
            $userId = $this->db->lastInsertId();

            // Create profile
            $profileUrl = $this->generateUniqueProfileUrl($input['name']);
            $stmt = $this->db->prepare("INSERT INTO user_profiles (user_id, name, profile_url) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $input['name'], $profileUrl]);

            $this->db->commit();

            $verificationSent = $this->sendVerificationEmail((int) $userId, $input['email'], $input['name'], $verificationToken);

            echo json_encode([
                'success' => true,
                'message' => $verificationSent
                    ? 'Registration successful. Verification email sent to your inbox.'
                    : 'Registration successful, but we were unable to send the verification email. Please contact support.',
                'user' => [
                    'id' => $userId,
                    'name' => $input['name'],
                    'email' => $input['email'],
                    'role' => 'user',
                    'email_verified' => 0,
                ]
            ]);

        } catch (\Exception $e) {
            $this->db->rollback();
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function login()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['email']) || empty($input['password'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Email and password are required'
            ]);
            return;
        }

        try {
            $stmt = $this->db->prepare("
                SELECT id, name, email, password_hash, role,
                       subscription_plan, subscription_status, subscription_period, subscription_expires_at,
                       email_verified
                FROM users
                WHERE email = ?
            ");
            $stmt->execute([$input['email']]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($input['password'], $user['password_hash'])) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid email or password'
                ]);
                return;
            }

            if ((int)($user['email_verified'] ?? 0) !== 1) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Please verify your email first.'
                ]);
                return;
            }

            // Auto-expire overdue subscriptions before proceeding
            SubscriptionManager::autoExpireIfNeeded((int) $user['id']);

            // Activate trial on first login for regular users
            if (
                ($user['role'] ?? 'user') === 'user' &&
                ($user['subscription_plan'] ?? 'free') === 'free' &&
                ($user['subscription_status'] ?? 'active') === 'active' &&
                empty($user['subscription_expires_at'])
            ) {
                SubscriptionManager::activatePlan((int) $user['id'], 'trial', 'trial');
            }

            // Generate tokens
            $tokens = JWTManager::generateTokens($user['id'], $user['email'], $user['role'] ?? 'user');
            JWTManager::setTokenCookies($tokens['access_token'], $tokens['refresh_token']);

            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'] ?? 'user',
                    'email_verified' => (int)($user['email_verified'] ?? 0)
                ]
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function logout()
    {
        JWTManager::clearTokenCookies();
        echo json_encode([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    public function forgotPassword(): void
    {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = trim($input['email'] ?? '');

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'A valid email address is required.',
            ]);
            return;
        }

        // try {
            $rateLimitStmt = $this->db->prepare("
                SELECT COUNT(*) AS total
                FROM email_logs
                WHERE email = :email
                  AND type = 'password_reset'
                  AND sent_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ");
            $rateLimitStmt->execute([':email' => $email]);
            $count = (int)($rateLimitStmt->fetch()['total'] ?? 0);

            if ($count >= 10) {
                http_response_code(429);
                echo json_encode([
                    'success' => false,
                    'message' => 'Too many reset requests. Please try again later.',
                ]);
                return;
            }

            $stmt = $this->db->prepare("SELECT id, name FROM users WHERE email = :email LIMIT 1");
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();

            if ($user) {
                $resetToken = bin2hex(random_bytes(32));

                $update = $this->db->prepare("
                    UPDATE users
                    SET reset_token = :token,
                        reset_expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR),
                        updated_at = NOW()
                    WHERE id = :id
                ");
                $update->execute([
                    ':token' => $resetToken,
                    ':id' => $user['id'],
                ]);

                $this->sendPasswordResetEmail((int)$user['id'], $email, $user['name'] ?? '', $resetToken);
            }

            echo json_encode([
                'success' => true,
                'message' => 'If the email exists in our system, a reset link has been sent.',
            ]);
        // } catch (\Throwable $exception) {
        //     error_log('[ForgotPassword] ' . $exception->getMessage());
        //     http_response_code(500);
        //     echo json_encode([
        //         'success' => false,
        //         'message' => 'Unable to process password reset request.',
        //     ]);
        // }
    }

    public function resetPassword(): void
    {
        $input = json_decode(file_get_contents('php://input'), true);
        $token = trim($input['token'] ?? '');
        $password = $input['new_password'] ?? $input['password'] ?? '';

        if ($token === '' || $password === '') {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Token and new password are required.',
            ]);
            return;
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Password must be at least 6 characters.',
            ]);
            return;
        }

        try {
            $stmt = $this->db->prepare("
                SELECT id
                FROM users
                WHERE reset_token = :token
                  AND reset_expires_at IS NOT NULL
                  AND reset_expires_at > NOW()
                LIMIT 1
            ");
            $stmt->execute([':token' => $token]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid or expired reset token.',
                ]);
                return;
            }

            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            $update = $this->db->prepare("
                UPDATE users
                SET password_hash = :password,
                    reset_token = NULL,
                    reset_expires_at = NULL,
                    updated_at = NOW()
                WHERE id = :id
            ");
            $update->execute([
                ':password' => $passwordHash,
                ':id' => $user['id'],
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Password reset successful. Please login with your new password.',
            ]);
        } catch (\Throwable $exception) {
            error_log('[ResetPassword] ' . $exception->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Unable to reset password at this time.',
            ]);
        }
    }

    public function refresh()
    {
        $refreshToken = $_COOKIE['refresh_token'] ?? null;
        
        if (!$refreshToken) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Refresh token required'
            ]);
            return;
        }

        $newTokens = JWTManager::refreshAccessToken($refreshToken);
        
        if (!$newTokens) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid refresh token'
            ]);
            return;
        }

        JWTManager::setTokenCookies($newTokens['access_token'], $newTokens['refresh_token']);
        
        echo json_encode([
            'success' => true,
            'message' => 'Token refreshed successfully'
        ]);
    }

    private function validateRegistration($input)
    {
        $errors = [];

        // Name validation
        if (empty($input['name'])) {
            $errors['name'] = 'Name is required';
        } elseif (!preg_match('/^[a-zA-Z\s]+$/', $input['name'])) {
            $errors['name'] = 'Name can only contain letters and spaces';
        }

        // Email validation
        if (empty($input['email'])) {
            $errors['email'] = 'Email is required';
        } elseif (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email format';
        }

        // Password validation
        if (empty($input['password'])) {
            $errors['password'] = 'Password is required';
        } elseif (strlen($input['password']) < 8) {
            $errors['password'] = 'Password must be at least 8 characters';
        } elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/', $input['password'])) {
            $errors['password'] = 'Password must contain uppercase, lowercase, and number';
        }

        // Confirm password validation
        if (empty($input['confirm_password'])) {
            $errors['confirm_password'] = 'Confirm password is required';
        } elseif ($input['password'] !== $input['confirm_password']) {
            $errors['confirm_password'] = 'Passwords do not match';
        }

        return $errors;
    }

    private function generateUniqueProfileUrl($name)
    {
        $baseUrl = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', trim($name)));
        $url = $baseUrl;
        $counter = 1;

        while (true) {
            $stmt = $this->db->prepare("SELECT id FROM user_profiles WHERE profile_url = ?");
            $stmt->execute([$url]);
            if (!$stmt->fetch()) {
                break;
            }
            $url = $baseUrl . '-' . $counter;
            $counter++;
        }

        return $url;
    }

    private function sendVerificationEmail(int $userId, string $email, string $name, string $token): bool
    {
        $baseUrl = Config::get('app_base_url');

        if (empty($baseUrl)) {
            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $baseUrl = sprintf('%s://%s', $scheme, $host);
        }

        $verificationUrl = rtrim($baseUrl, '/') . '/verify-email.php?token=' . urlencode($token);

        $subject = 'Verify your Linksphere account';
        $htmlBody = sprintf(
            '<p>Hello %s,</p>
            <p>Welcome to Linksphere! Please verify your email address by clicking the button below:</p>
            <p><a href="%s" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#ffffff;border-radius:6px;text-decoration:none;">Verify Email</a></p>
            <p>If the button does not work, copy and paste the following link into your browser:</p>
            <p><a href="%s">%s</a></p>
            <p>Thank you,<br/>The Linksphere Team</p>',
            htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
            $verificationUrl,
            $verificationUrl,
            $verificationUrl
        );

        $mailer = new Mailer();
        $sent = $mailer->send($email, $subject, $htmlBody);

        $this->logEmail($userId, $email, 'verification', $subject);

        return $sent;
    }

    private function sendPasswordResetEmail(int $userId, string $email, string $name, string $token): bool
    {
        $frontendUrl = Config::get('frontend_url');
        if (empty($frontendUrl)) {
            $frontendUrl = Config::get('app_base_url');
        }

        if (empty($frontendUrl)) {
            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $frontendUrl = sprintf('%s://%s', $scheme, $host);
        }

        $resetUrl = rtrim($frontendUrl, '/') . '/reset-password?token=' . urlencode($token);

        $subject = 'Linksphere password reset request';
        $htmlBody = sprintf(
            '<p>Hello %s,</p>
            <p>We received a request to reset your password. Click the button below to proceed:</p>
            <p><a href="%s" style="display:inline-block;padding:10px 16px;background:#f97316;color:#ffffff;border-radius:6px;text-decoration:none;">Reset Password</a></p>
            <p>If you did not request a reset, you can safely ignore this email.</p>
            <p>The link will expire in 1 hour for security reasons.</p>
            <p>Thanks,<br/>The Linksphere Team</p>',
            htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
            $resetUrl
        );

        $mailer = new Mailer();
        $sent = $mailer->send($email, $subject, $htmlBody);

        $this->logEmail($userId, $email, 'password_reset', $subject);

        return $sent;
    }

    private function logEmail(?int $userId, string $email, string $type, string $subject): void
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO email_logs (user_id, email, type, subject)
                VALUES (:user_id, :email, :type, :subject)
            ");
            $stmt->execute([
                ':user_id' => $userId,
                ':email' => $email,
                ':type' => $type,
                ':subject' => $subject,
            ]);
        } catch (\Throwable $exception) {
            error_log('[EmailLog] Failed to insert log: ' . $exception->getMessage());
        }
    }
}

