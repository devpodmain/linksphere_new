<?php

namespace App\Controllers;

use App\Core\Database;
use App\Middleware\RoleMiddleware;
use App\Services\SubscriptionManager;
use PDO;

class AdminController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getUsers(): void
    {
        $actor = RoleMiddleware::ensureRole('admin');

        $search = trim($_GET['search'] ?? '');
        $statusFilter = $_GET['status'] ?? '';
        $planFilter = $_GET['plan'] ?? '';
        $roleFilter = $_GET['role'] ?? '';
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($_GET['per_page'] ?? 10)));
        $offset = ($page - 1) * $perPage;

        $params = [];
        $conditions = [];

        if ($search !== '') {
            $conditions[] = "(u.name LIKE :search OR u.email LIKE :search)";
            $params[':search'] = '%' . $search . '%';
        }

        if (in_array($statusFilter, ['active', 'disabled'], true)) {
            $conditions[] = 'u.status = :status';
            $params[':status'] = $statusFilter;
        }

        if (in_array($planFilter, ['trial', 'free', 'basic', 'premium'], true)) {
            $conditions[] = 'u.subscription_plan = :plan';
            $params[':plan'] = $planFilter;
        }

        if (in_array($roleFilter, ['user', 'admin'], true)) {
            $conditions[] = 'u.role = :role';
            $params[':role'] = $roleFilter;
        }

        if (($actor['role'] ?? 'user') !== 'super_admin') {
            $conditions[] = "u.role <> 'super_admin'";
        }

        $whereSql = '';
        if (!empty($conditions)) {
            $whereSql = 'WHERE ' . implode(' AND ', $conditions);
        }

        $countSql = "SELECT COUNT(*) AS total FROM users u {$whereSql}";
        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) ($countStmt->fetch()['total'] ?? 0);

        $sql = "
            SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                u.status,
                u.subscription_plan,
                u.subscription_status,
                u.subscription_period,
                u.subscription_expires_at,
                u.created_at,
                u.updated_at
            FROM users u
            {$whereSql}
            ORDER BY u.created_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }

        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $users = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $users,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => $perPage > 0 ? (int) ceil($total / $perPage) : 1
            ]
        ]);
    }

    public function getUser(string $id): void
    {
        $actor = RoleMiddleware::ensureRole('admin');

        $userId = (int) $id;

        $stmt = $this->db->prepare("
            SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                u.status,
                u.subscription_plan,
                u.subscription_status,
                u.subscription_period,
                u.subscription_expires_at,
                u.created_at,
                u.updated_at
            FROM users u
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'User not found'
            ]);
            return;
        }

        if (($actor['role'] ?? 'user') !== 'super_admin' && $user['role'] === 'super_admin') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Forbidden: cannot access super admin details'
            ]);
            return;
        }

        $profileStmt = $this->db->prepare("
            SELECT *
            FROM user_profiles
            WHERE user_id = ?
        ");
        $profileStmt->execute([$userId]);
        $profile = $profileStmt->fetch();

        echo json_encode([
            'success' => true,
            'user' => [
                ...$user,
                'profile' => $profile ?: null
            ]
        ]);
    }

    public function updateUserStatus(string $id): void
    {
        $admin = RoleMiddleware::ensureRole('admin');
        $userId = (int) $id;

        if ($admin['id'] === $userId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Admins cannot change their own status'
            ]);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = $input['status'] ?? '';

        $allowedStatus = ['active', 'disabled'];
        if (!in_array($status, $allowedStatus, true)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid status value'
            ]);
            return;
        }

        $stmt = $this->db->prepare("SELECT id, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $target = $stmt->fetch();
        if (!$target) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'User not found'
            ]);
            return;
        }

        if (($admin['role'] ?? 'user') !== 'super_admin' && $target['role'] === 'super_admin') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Forbidden: cannot change super admin status'
            ]);
            return;
        }

        $updateStmt = $this->db->prepare("UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?");
        $updateStmt->execute([$status, $userId]);

        echo json_encode([
            'success' => true,
            'message' => 'User status updated',
            'status' => $status
        ]);
    }

    public function deleteUser(string $id): void
    {
        $admin = RoleMiddleware::ensureRole('admin');
        $userId = (int) $id;

        if ($admin['id'] === $userId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Admins cannot delete their own account'
            ]);
            return;
        }

        $stmt = $this->db->prepare("SELECT id, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $target = $stmt->fetch();
        if (!$target) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'User not found'
            ]);
            return;
        }

        if (($admin['role'] ?? 'user') !== 'super_admin' && $target['role'] === 'super_admin') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Forbidden: cannot delete super admin account'
            ]);
            return;
        }

        $deleteStmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
        $deleteStmt->execute([$userId]);

        echo json_encode([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }

    public function getSubscriptions(): void
    {
        RoleMiddleware::ensureRole('admin');

        $plan = $_GET['plan'] ?? '';
        $status = $_GET['status'] ?? '';
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($_GET['per_page'] ?? 10)));
        $offset = ($page - 1) * $perPage;

        $conditions = [];
        $params = [];

        if ($plan !== '' && in_array($plan, ['trial', 'free', 'basic', 'premium'], true)) {
            $conditions[] = 'u.subscription_plan = :plan';
            $params[':plan'] = $plan;
        }

        if ($status !== '' && in_array($status, ['active', 'expired', 'paused'], true)) {
            $conditions[] = 'u.subscription_status = :status';
            $params[':status'] = $status;
        }

        $whereSql = '';
        if (!empty($conditions)) {
            $whereSql = 'WHERE ' . implode(' AND ', $conditions);
        }

        $countSql = "SELECT COUNT(*) AS total FROM users u {$whereSql}";
        $countStmt = $this->db->prepare($countSql);
        foreach ($params as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $total = (int) ($countStmt->fetch()['total'] ?? 0);

        $sql = "
            SELECT 
                u.id,
                u.name,
                u.email,
                u.subscription_plan,
                u.subscription_status,
                u.subscription_period,
                u.subscription_expires_at,
                u.status AS account_status
            FROM users u
            {$whereSql}
            ORDER BY u.updated_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $subscriptions = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $subscriptions,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => $perPage > 0 ? (int) ceil($total / $perPage) : 1
            ]
        ]);
    }

    public function updateUserSubscription(string $userId): void
    {
        RoleMiddleware::ensureRole('admin');

        $id = (int) $userId;
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $plan = strtolower((string) ($input['plan'] ?? ''));
        $period = $input['period'] ?? null;
        $expiresAt = $input['expires_at'] ?? null;
        $status = $input['status'] ?? null;

        $allowedPlans = ['trial', 'free', 'basic', 'premium'];
        if (!in_array($plan, $allowedPlans, true)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid plan'
            ]);
            return;
        }

        $allowedPeriods = ['trial', 'monthly', 'yearly', null, ''];
        if (!in_array($period, $allowedPeriods, true)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid period'
            ]);
            return;
        }

        $allowedStatuses = ['active', 'expired', 'paused', null, ''];
        if (!in_array($status, $allowedStatuses, true)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid subscription status'
            ]);
            return;
        }

        $existsStmt = $this->db->prepare("SELECT id, role FROM users WHERE id = ?");
        $existsStmt->execute([$id]);
        $target = $existsStmt->fetch();
        if (!$target) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'User not found'
            ]);
            return;
        }

        if ($target['role'] === 'super_admin') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Forbidden: cannot edit super admin subscription'
            ]);
            return;
        }

        if ($status === 'expired' || $plan === 'free') {
            $result = SubscriptionManager::expirePlan($id);
        } else {
            $result = SubscriptionManager::activatePlan(
                $id,
                $plan,
                $period ?: null,
                $expiresAt ?: null
            );
        }

        echo json_encode([
            'success' => true,
            'message' => 'Subscription updated successfully',
            'subscription' => $result,
        ]);
    }
}

