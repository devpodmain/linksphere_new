<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\JWTManager;
use App\Core\Config;

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
            
            $stmt = $this->db->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
            $stmt->execute([$input['name'], $input['email'], $passwordHash]);
            $userId = $this->db->lastInsertId();

            // Create profile
            $profileUrl = $this->generateUniqueProfileUrl($input['name']);
            $stmt = $this->db->prepare("INSERT INTO user_profiles (user_id, name, profile_url) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $input['name'], $profileUrl]);

            $this->db->commit();

            // Generate tokens
            $tokens = JWTManager::generateTokens($userId, $input['email']);
            JWTManager::setTokenCookies($tokens['access_token'], $tokens['refresh_token']);

            echo json_encode([
                'success' => true,
                'message' => 'Registration successful',
                'user' => [
                    'id' => $userId,
                    'name' => $input['name'],
                    'email' => $input['email']
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
            $stmt = $this->db->prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?");
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

            // Generate tokens
            $tokens = JWTManager::generateTokens($user['id'], $user['email']);
            JWTManager::setTokenCookies($tokens['access_token'], $tokens['refresh_token']);

            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email']
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
}

