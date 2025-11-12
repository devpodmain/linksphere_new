<?php

namespace App\Controllers;

use App\Core\Database;
use App\Middleware\RoleMiddleware;
use App\Services\SubscriptionManager;
use PDO;

class SuperAdminSubscriptionController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function list(): void
    {
        RoleMiddleware::ensureRole('super_admin');

        $search = trim((string) ($_GET['search'] ?? ''));
        $plan = (string) ($_GET['plan'] ?? '');
        $status = (string) ($_GET['status'] ?? ($_GET['subscription_status'] ?? ''));
        $accountStatus = (string) ($_GET['account_status'] ?? '');
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($_GET['per_page'] ?? 10)));
        $offset = ($page - 1) * $perPage;

        $conditions = [];
        $params = [];

        if ($search !== '') {
            $conditions[] = "(u.name LIKE :search OR u.email LIKE :search)";
            $params[':search'] = '%' . $search . '%';
        }

        if (in_array($plan, ['trial', 'free', 'basic', 'premium'], true)) {
            $conditions[] = 'u.subscription_plan = :plan';
            $params[':plan'] = $plan;
        }

        if (in_array($status, ['active', 'expired', 'paused'], true)) {
            $conditions[] = 'u.subscription_status = :status';
            $params[':status'] = $status;
        }

        if (in_array($accountStatus, ['active', 'disabled'], true)) {
            $conditions[] = 'u.status = :account_status';
            $params[':account_status'] = $accountStatus;
        }

        $whereSql = '';
        if (!empty($conditions)) {
            $whereSql = 'WHERE ' . implode(' AND ', $conditions);
        }

        try {
            $countStmt = $this->db->prepare("SELECT COUNT(*) AS total FROM users u {$whereSql}");
            foreach ($params as $key => $value) {
                $countStmt->bindValue($key, $value, PDO::PARAM_STR);
            }
            $countStmt->execute();
            $total = (int) ($countStmt->fetch()['total'] ?? 0);

            $stmt = $this->db->prepare("
                SELECT
                    u.id,
                    u.name,
                    u.email,
                    u.role,
                    u.subscription_plan,
                    u.subscription_status,
                    u.subscription_period,
                    u.subscription_expires_at,
                    u.status AS account_status,
                    u.created_at,
                    u.updated_at
                FROM users u
                {$whereSql}
                ORDER BY u.updated_at DESC
                LIMIT :limit OFFSET :offset
            ");

            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value, PDO::PARAM_STR);
            }
            $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            $rows = $stmt->fetchAll();
            foreach ($rows as &$row) {
                $row['history'] = SubscriptionManager::getSubscriptionHistory((int) $row['id'], 3);
            }

            echo json_encode([
                'success' => true,
                'data' => $rows,
                'pagination' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'total_pages' => $perPage > 0 ? (int) ceil($total / $perPage) : 1
                ]
            ]);
        } catch (\Exception $e) {
            error_log('SuperAdminSubscriptionController@list error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to load subscriptions'
            ]);
        }
    }

    public function update(string $userId): void
    {
        $actor = RoleMiddleware::ensureRole('super_admin');

        $id = (int) $userId;
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $result = SubscriptionManager::updatePlanManually($id, $input, $actor['email'] ?? null);
            echo json_encode(['success' => true, 'message' => 'Subscription updated', 'subscription' => $result]);
        } catch (\Throwable $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function expire(string $userId): void
    {
        $actor = RoleMiddleware::ensureRole('super_admin');
        $id = (int) $userId;

        try {
            $result = SubscriptionManager::expirePlan($id, $actor['email'] ?? null);
            echo json_encode(['success' => true, 'message' => 'Subscription expired', 'subscription' => $result]);
        } catch (\Throwable $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function history(string $userId): void
    {
        RoleMiddleware::ensureRole('super_admin');
        $id = (int) $userId;
        $limit = (int) ($_GET['limit'] ?? 50);

        try {
            $history = SubscriptionManager::getSubscriptionHistory($id, $limit > 0 ? $limit : 50);
            echo json_encode(['success' => true, 'data' => $history]);
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to fetch subscription history']);
        }
    }
}

