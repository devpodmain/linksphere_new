<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Auth;

class AccountController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAccount()
    {
        $user = Auth::getCurrentUser();
        
        try {
            $stmt = $this->db->prepare("SELECT id, name, email, subscription_plan, created_at FROM users WHERE id = ?");
            $stmt->execute([$user['id']]);
            $account = $stmt->fetch();

            if (!$account) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Account not found'
                ]);
                return;
            }

            echo json_encode([
                'success' => true,
                'account' => $account
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch account',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function updateAccount()
    {
        $user = Auth::getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);

        try {
            $stmt = $this->db->prepare("UPDATE users SET name = ? WHERE id = ?");
            $stmt->execute([$input['name'], $user['id']]);

            echo json_encode([
                'success' => true,
                'message' => 'Account updated successfully'
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update account',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function deleteAccount()
    {
        $user = Auth::getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);

        // Verify password before deletion
        $stmt = $this->db->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $userData = $stmt->fetch();

        if (!password_verify($input['password'], $userData['password_hash'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid password'
            ]);
            return;
        }

        try {
            $this->db->beginTransaction();
            
            // Delete user (cascade will handle related records)
            $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$user['id']]);

            $this->db->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Account deleted successfully'
            ]);

        } catch (\Exception $e) {
            $this->db->rollback();
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete account',
                'error' => $e->getMessage()
            ]);
        }
    }
}


