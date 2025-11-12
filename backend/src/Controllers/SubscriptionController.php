<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Middleware\RoleMiddleware;
use App\Services\SubscriptionManager;
use DateTimeImmutable;
use PDO;

class SubscriptionController
{
    private PDO $db;

    private const PLAN_FEATURES = [
        'free' => ['basic_profile', 'public_profile'],
        'trial' => ['basic_profile', 'social_links', 'custom_links', 'payment'],
        'basic' => ['basic_profile', 'social_links', 'custom_links'],
        'premium' => ['basic_profile', 'social_links', 'custom_links', 'payment'],
    ];

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function me(): void
    {
        $current = Auth::getCurrentUser();
        $userId = (int) ($current['id'] ?? 0);

        if ($userId <= 0) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorised']);
            return;
        }

        SubscriptionManager::autoExpireIfNeeded($userId);

        $subscription = $this->fetchSubscription($userId);

        echo json_encode([
            'success' => true,
            'subscription' => $subscription,
        ]);
    }

    public function access(): void
    {
        $current = Auth::getCurrentUser();
        $userId = (int) ($current['id'] ?? 0);

        if ($userId <= 0) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorised']);
            return;
        }

        SubscriptionManager::autoExpireIfNeeded($userId);
        $subscription = $this->fetchSubscription($userId);
        $plan = $subscription['plan'] ?? 'free';

        echo json_encode([
            'success' => true,
            'plan' => $plan,
            'features' => self::PLAN_FEATURES[$plan] ?? self::PLAN_FEATURES['free'],
        ]);
    }

    public function update(string $userId): void
    {
        $actor = RoleMiddleware::ensureRole('admin');
        $id = (int) $userId;

        $payload = json_decode(file_get_contents('php://input'), true) ?? [];

        if (!$this->userExists($id)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            return;
        }

        try {
            $result = SubscriptionManager::updatePlanManually($id, $payload, $actor['email'] ?? null);
            echo json_encode([
                'success' => true,
                'subscription' => $result,
            ]);
        } catch (\Throwable $exception) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $exception->getMessage(),
            ]);
        }
    }

    public function expire(string $userId): void
    {
        $actor = RoleMiddleware::ensureRole('admin');
        $id = (int) $userId;

        if (!$this->userExists($id)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            return;
        }

        try {
            $result = SubscriptionManager::expirePlan($id, $actor['email'] ?? null);
            echo json_encode([
                'success' => true,
                'subscription' => $result,
            ]);
        } catch (\Throwable $exception) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $exception->getMessage(),
            ]);
        }
    }

    private function fetchSubscription(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT subscription_plan, subscription_status, subscription_period, subscription_expires_at
            FROM users
            WHERE id = :id
        ");
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();

        if (!$row) {
            return [
                'plan' => 'free',
                'status' => 'active',
                'period' => null,
                'expires_at' => null,
                'remaining_days' => null,
            ];
        }

        $expiresAt = $row['subscription_expires_at'] ?? null;
        $remaining = null;

        if (!empty($expiresAt)) {
            try {
                $expiry = new DateTimeImmutable($expiresAt);
                $now = new DateTimeImmutable();
                $diff = $expiry->diff($now);
                $remaining = $expiry >= $now ? (int) $diff->format('%a') : 0;
            } catch (\Throwable) {
                $remaining = null;
            }
        }

        return [
            'plan' => $row['subscription_plan'] ?? 'free',
            'status' => $row['subscription_status'] ?? 'active',
            'period' => $row['subscription_period'] ?? null,
            'expires_at' => $expiresAt,
            'remaining_days' => $remaining,
        ];
    }

    private function userExists(int $userId): bool
    {
        $stmt = $this->db->prepare("SELECT id FROM users WHERE id = :id");
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        return (bool) $stmt->fetchColumn();
    }
}



