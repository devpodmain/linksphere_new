<?php

namespace App\Core;

use App\Services\SubscriptionManager;

class Auth
{
    public static function middleware()
    {
        // --------------------------
        // ✅ Step 1: Read Access Token
        // --------------------------
        $accessToken = $_COOKIE['access_token'] ?? null;
        
         

        if (!$accessToken) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Access token required'
            ]);
            exit;
        }

        // --------------------------
        // ✅ Step 2: Validate Access Token
        // --------------------------
        $decoded = JWTManager::validateToken($accessToken);

        if (!$decoded || ($decoded['type'] ?? '') !== 'access') {
            // Try refreshing with refresh token
            $refreshToken = $_COOKIE['refresh_token'] ?? null;

            if ($refreshToken) {
                $newTokens = JWTManager::refreshAccessToken($refreshToken);

                if ($newTokens) {
                    // Reissue secure cookies
                    JWTManager::setTokenCookies(
                        $newTokens['access_token'],
                        $newTokens['refresh_token']
                    );

                    // Decode and return the new access token payload
                    $decoded = JWTManager::validateToken($newTokens['access_token']);
                    if ($decoded && ($decoded['type'] ?? '') === 'access') {
                        return $decoded;
                    }
                }
            }

            // Still invalid
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid or expired token'
            ]);
            exit;
        }

        $userId = (int) ($decoded['sub'] ?? 0);
        if ($userId > 0) {
            SubscriptionManager::autoExpireIfNeeded($userId);
        }

        // --------------------------
        // ✅ Step 3: Return Decoded User Payload
        // --------------------------
        return $decoded;
    }

    public static function getCurrentUser()
    {
       
        $decoded = self::middleware();
    
        return [
            'id' => $decoded['sub'] ?? null,
            'email' => $decoded['email'] ?? null,
            'role' => $decoded['role'] ?? 'user'
        ];
    }
}
