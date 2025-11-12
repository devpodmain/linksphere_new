<?php

namespace App\Controllers;

use App\Core\Database;
use App\Middleware\RoleMiddleware;
use App\Services\SystemSettings;
use PDO;

class SuperAdminController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getStats(): void
    {
        RoleMiddleware::ensureRole('super_admin');

        $totalUsers = (int) $this->db->query("SELECT COUNT(*) AS total FROM users")->fetch()['total'];
        $activeSubscriptions = (int) $this->db
            ->query("SELECT COUNT(*) AS total FROM users WHERE subscription_status = 'active' AND subscription_plan <> 'free'")
            ->fetch()['total'];

        $pricing = $this->getPricingConfig();

        $subscriptionStmt = $this->db->prepare("
            SELECT subscription_plan, subscription_period
            FROM users
            WHERE subscription_status = 'active' AND subscription_plan IN ('basic','premium')
        ");
        $subscriptionStmt->execute();
        $subscriptions = $subscriptionStmt->fetchAll();

        $revenue = 0.0;
        foreach ($subscriptions as $row) {
            $plan = $row['subscription_plan'];
            $period = $row['subscription_period'] ?: 'monthly';
            $key = sprintf('pricing_%s_%s', $plan, $period);
            $revenue += (float) ($pricing[$key] ?? 0);
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'active_subscriptions' => $activeSubscriptions,
                'estimated_monthly_revenue' => $revenue,
            ],
        ]);
    }

    public function getUsers(): void
    {
        RoleMiddleware::ensureRole('super_admin');

        $search = trim((string) ($_GET['search'] ?? ''));
        $role = (string) ($_GET['role'] ?? '');
        $status = (string) ($_GET['status'] ?? '');
        $plan = (string) ($_GET['plan'] ?? '');
        $subscriptionStatus = (string) ($_GET['subscription_status'] ?? '');
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($_GET['per_page'] ?? 10)));
        $offset = ($page - 1) * $perPage;

        $conditions = [];
        $params = [];

        if ($search !== '') {
            $conditions[] = "(u.name LIKE :search OR u.email LIKE :search)";
            $params[':search'] = '%' . $search . '%';
        }

        if (in_array($role, ['user', 'admin', 'super_admin'], true)) {
            $conditions[] = 'u.role = :role';
            $params[':role'] = $role;
        }

        if (in_array($status, ['active', 'disabled'], true)) {
            $conditions[] = 'u.status = :status';
            $params[':status'] = $status;
        }

        if (in_array($plan, ['trial', 'free', 'basic', 'premium'], true)) {
            $conditions[] = 'u.subscription_plan = :plan';
            $params[':plan'] = $plan;
        }

        if (in_array($subscriptionStatus, ['active', 'expired', 'paused'], true)) {
            $conditions[] = 'u.subscription_status = :subscription_status';
            $params[':subscription_status'] = $subscriptionStatus;
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
            ");
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value, PDO::PARAM_STR);
            }
            $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            echo json_encode([
                'success' => true,
                'data' => $stmt->fetchAll(),
                'pagination' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'total_pages' => $perPage > 0 ? (int) ceil($total / $perPage) : 1
                ]
            ]);
        } catch (\Exception $e) {
            error_log('SuperAdminController@getUsers error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to load users'
            ]);
        }
    }

    public function createOrPromoteAdmin(): void
    {
        RoleMiddleware::ensureRole('super_admin');

        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        if (!empty($input['user_id'])) {
            $userId = (int) $input['user_id'];
            $stmt = $this->db->prepare("SELECT id, role FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            if (!$user) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'User not found']);
                return;
            }

            if ($user['role'] === 'super_admin') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'User is already super admin']);
                return;
            }

            $update = $this->db->prepare("UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = ?");
            $update->execute([$userId]);

            echo json_encode(['success' => true, 'message' => 'User promoted to admin']);
            return;
        }

        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if ($name === '' || $email === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Name, email, and password are required']);
            return;
        }

        $exists = $this->db->prepare("SELECT id FROM users WHERE email = ?");
        $exists->execute([$email]);
        if ($exists->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email already registered']);
            return;
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $this->db->beginTransaction();
        try {
            $insert = $this->db->prepare("
                INSERT INTO users (name, email, password_hash, role, subscription_plan)
                VALUES (?, ?, ?, 'admin', 'free')
            ");
            $insert->execute([$name, $email, $passwordHash]);
            $userId = (int) $this->db->lastInsertId();

            $profileInsert = $this->db->prepare("
                INSERT INTO user_profiles (user_id, name, profile_url)
                VALUES (?, ?, ?)
            ");
            $slug = $this->generateProfileSlug($name);
            $profileInsert->execute([$userId, $name, $slug]);

            $this->db->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Admin account created',
                'user_id' => $userId
            ]);
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create admin',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function createUser(): void
    {
        RoleMiddleware::ensureRole('super_admin');

        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if ($name === '' || $email === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Name, email, and password are required']);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid email address']);
            return;
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
            return;
        }

        $exists = $this->db->prepare("SELECT id FROM users WHERE email = ?");
        $exists->execute([$email]);
        if ($exists->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Email already in use.']);
            return;
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $this->db->beginTransaction();
        try {
            $insert = $this->db->prepare("
                INSERT INTO users (
                    name,
                    email,
                    password_hash,
                    role,
                    status,
                    subscription_plan,
                    subscription_status,
                    subscription_period,
                    subscription_expires_at,
                    created_at,
                    updated_at
                ) VALUES (
                    :name,
                    :email,
                    :password_hash,
                    'user',
                    'active',
                    'free',
                    'active',
                    NULL,
                    NULL,
                    NOW(),
                    NOW()
                )
            ");
            $insert->execute([
                ':name' => $name,
                ':email' => $email,
                ':password_hash' => $passwordHash,
            ]);
            $userId = (int) $this->db->lastInsertId();

            $profileInsert = $this->db->prepare("
                INSERT INTO user_profiles (user_id, name, profile_url)
                VALUES (:user_id, :name, :profile_url)
            ");
            $slug = $this->generateProfileSlug($name);
            $profileInsert->execute([
                ':user_id' => $userId,
                ':name' => $name,
                ':profile_url' => $slug,
            ]);

            $this->db->commit();

            echo json_encode([
                'success' => true,
                'message' => 'User created successfully.',
                'user_id' => $userId,
            ]);
        } catch (\Throwable $e) {
            $this->db->rollBack();
            error_log('SuperAdminController::createUser error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create user.',
            ]);
        }
    }

    public function updateUserStatus(string $id): void
    {
        $superAdmin = RoleMiddleware::ensureRole('super_admin');
        $userId = (int) $id;

        if ($superAdmin['id'] === $userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Cannot modify your own status']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = $input['status'] ?? null;
        $role = $input['role'] ?? null;

        $stmt = $this->db->prepare("SELECT id, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            return;
        }

        if ($status !== null && !in_array($status, ['active', 'disabled'], true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid status value']);
            return;
        }

        if ($role !== null && !in_array($role, ['user', 'admin', 'super_admin'], true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid role value']);
            return;
        }

        $updateParts = [];
        $updateValues = [];

        if ($status !== null) {
            $updateParts[] = 'status = ?';
            $updateValues[] = $status;
        }

        if ($role !== null) {
            $updateParts[] = 'role = ?';
            $updateValues[] = $role;
        }

        if (empty($updateParts)) {
            echo json_encode(['success' => true, 'message' => 'No changes applied']);
            return;
        }

        $updateValues[] = $userId;
        $sql = "UPDATE users SET " . implode(', ', $updateParts) . ", updated_at = NOW() WHERE id = ?";
        $updateStmt = $this->db->prepare($sql);
        $updateStmt->execute($updateValues);

        echo json_encode(['success' => true, 'message' => 'User updated']);
    }

    public function getConfig(): void
    {
        RoleMiddleware::ensureRole('super_admin');

        $config = SystemSettings::getAll();
        echo json_encode([
            'success' => true,
            'config' => $config
        ]);
    }

    public function updateConfig(): void
    {
        RoleMiddleware::ensureRole('super_admin');

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($input) || !is_array($input)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid payload']);
            return;
        }

        foreach ($input as $key => $value) {
            $stmt = $this->db->prepare("
                INSERT INTO system_settings (setting_key, setting_value)
                VALUES (:key, :value)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            ");
            $stmt->execute([
                ':key' => $key,
                ':value' => is_scalar($value) ? (string) $value : json_encode($value)
            ]);
        }

        SystemSettings::clearCache();

        echo json_encode(['success' => true, 'message' => 'Configuration updated']);
    }

    private function getPricingConfig(): array
    {
        $pricing = SystemSettings::getPricing();
        return [
            'pricing_basic_monthly' => $pricing['basic']['monthly'],
            'pricing_basic_yearly' => $pricing['basic']['yearly'],
            'pricing_premium_monthly' => $pricing['premium']['monthly'],
            'pricing_premium_yearly' => $pricing['premium']['yearly'],
        ];
    }

    private function generateProfileSlug(string $name): string
    {
        $base = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', trim($name))) ?: 'admin';
        $slug = $base;
        $counter = 1;
        while (true) {
            $stmt = $this->db->prepare("SELECT id FROM user_profiles WHERE profile_url = ?");
            $stmt->execute([$slug]);
            if (!$stmt->fetch()) {
                return $slug;
            }
            $slug = $base . '-' . $counter;
            $counter++;
        }
    }
}

