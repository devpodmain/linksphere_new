<?php

namespace App\Controllers;

use App\Core\Database;
use App\Middleware\RoleMiddleware;
use App\Services\SubscriptionManager;
use PDO;

class AdminSubscriptionController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    private function ensureManageableUser(int $userId): array
    {
        $stmt = $this->db->prepare("SELECT id, role FROM users WHERE id = :id");
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $target = $stmt->fetch();

        if (!$target) {
            throw new \RuntimeException('User not found');
        }

        if ($target['role'] !== 'user') {
            throw new \RuntimeException('Forbidden: cannot modify this subscription');
        }

        return $target;
    }

    public function index(): void
    {
        RoleMiddleware::ensureRole('admin');

        $search = trim((string) ($_GET['search'] ?? ''));
        $plan = (string) ($_GET['plan'] ?? '');
        $status = (string) ($_GET['status'] ?? ($_GET['subscription_status'] ?? ''));
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($_GET['per_page'] ?? ($_GET['limit'] ?? 10))));
        $offset = ($page - 1) * $perPage;

        $conditions = ["u.role = 'user'"];
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

        $whereSql = 'WHERE ' . implode(' AND ', $conditions);

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
        } catch (\Throwable $e) {
            error_log('AdminSubscriptionController@index error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to load subscriptions'
            ]);
        }
    }

    public function update(string $userId): void
    {
        $actor = RoleMiddleware::ensureRole('admin');

        $id = (int) $userId;
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $this->ensureManageableUser($id);
            $result = SubscriptionManager::updatePlanManually($id, $input, $actor['email'] ?? null);
            echo json_encode([
                'success' => true,
                'message' => 'Subscription updated',
                'subscription' => $result,
            ]);
        } catch (\RuntimeException $e) {
            $status = $e->getMessage() === 'User not found' ? 404 : 403;
            http_response_code($status);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        } catch (\Throwable $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function expire(string $userId): void
    {
        $actor = RoleMiddleware::ensureRole('admin');
        $id = (int) $userId;

        try {
            $this->ensureManageableUser($id);
            $result = SubscriptionManager::expirePlan($id, $actor['email'] ?? null);
            echo json_encode([
                'success' => true,
                'message' => 'Subscription expired',
                'subscription' => $result,
            ]);
        } catch (\RuntimeException $e) {
            $status = $e->getMessage() === 'User not found' ? 404 : 403;
            http_response_code($status);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        } catch (\Throwable $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function history(string $userId): void
    {
        RoleMiddleware::ensureRole('admin');
        $id = (int) $userId;
        $limit = (int) ($_GET['limit'] ?? 50);

        try {
            $this->ensureManageableUser($id);
            $history = SubscriptionManager::getSubscriptionHistory($id, $limit > 0 ? $limit : 50);
            echo json_encode([
                'success' => true,
                'data' => $history,
            ]);
        } catch (\RuntimeException $e) {
            $status = $e->getMessage() === 'User not found' ? 404 : 403;
            http_response_code($status);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch subscription history',
            ]);
        }
    }
}


