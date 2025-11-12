<?php

namespace App\Core;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTManager
{
    private static $secret;
    private static $algorithm;

    public static function init()
    {
        self::$secret = Config::get('jwt_secret');
        self::$algorithm = Config::get('jwt_algorithm');
    }

    public static function generateTokens($userId, $email, $role)
    {
        self::init();
        
        $now = time();
        
        // Access token payload
        $accessPayload = [
            'iss' => 'linksphere',
            'aud' => 'linksphere-users',
            'iat' => $now,
            'exp' => $now + Config::get('jwt_access_expiry'),
            'sub' => $userId,
            'email' => $email,
            'role' => $role,
            'type' => 'access'
        ];

        // Refresh token payload
        $refreshPayload = [
            'iss' => 'linksphere',
            'aud' => 'linksphere-users',
            'iat' => $now,
            'exp' => $now + Config::get('jwt_refresh_expiry'),
            'sub' => $userId,
            'email' => $email,
            'role' => $role,
            'type' => 'refresh'
        ];

        $accessToken = JWT::encode($accessPayload, self::$secret, self::$algorithm);
        $refreshToken = JWT::encode($refreshPayload, self::$secret, self::$algorithm);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken
        ];
    }

    public static function validateToken($token)
    {
        self::init();
        
        try {
            $decoded = JWT::decode($token, new Key(self::$secret, self::$algorithm));
            return (array) $decoded;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function refreshAccessToken($refreshToken)
    {
        self::init();
        
        $decoded = self::validateToken($refreshToken);
        if (!$decoded || $decoded['type'] !== 'refresh') {
            return false;
        }

        return self::generateTokens($decoded['sub'], $decoded['email'], $decoded['role'] ?? 'user');
    }

    public static function setTokenCookies(string $accessToken, string $refreshToken): void
    {
        // ✅ Detect HTTPS or Proxy HTTPS
        $isSecure = (
            (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
            (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
            (!empty($_SERVER['REQUEST_SCHEME']) && $_SERVER['REQUEST_SCHEME'] === 'https') ||
            $_SERVER['SERVER_PORT'] == 443
        );

        // ✅ Determine cookie domain based on environment
        $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';
        $isLocalhost = (
            strpos($host, 'localhost') !== false ||
            strpos($host, '127.0.0.1') !== false ||
            strpos($host, '::1') !== false
        );
        
        // For localhost, don't set domain (null). For production, use .dzyte.com
        $cookieDomain = $isLocalhost ? null : '.dzyte.com';
        
        // For localhost, use 'Lax' samesite. For production with HTTPS, use 'None'
        $sameSite = ($isLocalhost || !$isSecure) ? 'Lax' : 'None';

        // ✅ Access token cookie
        $accessCookieOptions = [
            'expires' => time() + Config::get('jwt_access_expiry'),
            'path' => '/',
            'secure' => $isSecure,
            'httponly' => true,
            'samesite' => $sameSite
        ];
        
        if ($cookieDomain !== null) {
            $accessCookieOptions['domain'] = $cookieDomain;
        }
        
        setcookie('access_token', $accessToken, $accessCookieOptions);

        // ✅ Refresh token cookie
        $refreshCookieOptions = [
            'expires' => time() + Config::get('jwt_refresh_expiry'),
            'path' => '/',
            'secure' => $isSecure,
            'httponly' => true,
            'samesite' => $sameSite
        ];
        
        if ($cookieDomain !== null) {
            $refreshCookieOptions['domain'] = $cookieDomain;
        }
        
        setcookie('refresh_token', $refreshToken, $refreshCookieOptions);
    }

    public static function clearTokenCookies()
    {
        $isSecure = (
            (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
            (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
            (!empty($_SERVER['REQUEST_SCHEME']) && $_SERVER['REQUEST_SCHEME'] === 'https') ||
            $_SERVER['SERVER_PORT'] == 443
        );

        // ✅ Determine cookie domain based on environment (same logic as setTokenCookies)
        $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';
        $isLocalhost = (
            strpos($host, 'localhost') !== false ||
            strpos($host, '127.0.0.1') !== false ||
            strpos($host, '::1') !== false
        );
        
        $cookieDomain = $isLocalhost ? null : '.dzyte.com';

        $accessCookieOptions = [
            'expires' => time() - 3600,
            'path' => '/',
            'secure' => $isSecure,
            'httponly' => true,
            'samesite' => 'Lax'
        ];
        
        if ($cookieDomain !== null) {
            $accessCookieOptions['domain'] = $cookieDomain;
        }
        
        setcookie('access_token', '', $accessCookieOptions);

        $refreshCookieOptions = [
            'expires' => time() - 3600,
            'path' => '/',
            'secure' => $isSecure,
            'httponly' => true,
            'samesite' => 'Lax'
        ];
        
        if ($cookieDomain !== null) {
            $refreshCookieOptions['domain'] = $cookieDomain;
        }
        
        setcookie('refresh_token', '', $refreshCookieOptions);
    }
}
