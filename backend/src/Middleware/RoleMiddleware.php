<?php

namespace App\Middleware;

use App\Core\Auth;

class RoleMiddleware
{
    private const ROLE_HIERARCHY = [
        'user' => 1,
        'admin' => 2,
        'super_admin' => 3,
    ];

    public static function ensureRole(string $requiredRole): array
    {
        $user = Auth::getCurrentUser();
        $currentRole = $user['role'] ?? 'user';

        $requiredLevel = self::ROLE_HIERARCHY[$requiredRole] ?? null;
        $currentLevel = self::ROLE_HIERARCHY[$currentRole] ?? null;

        if ($requiredLevel === null) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Server misconfiguration: Unknown required role'
            ]);
            exit;
        }

        if ($currentLevel === null || $currentLevel < $requiredLevel) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Forbidden: insufficient privileges'
            ]);
            exit;
        }

        return $user;
    }
}



