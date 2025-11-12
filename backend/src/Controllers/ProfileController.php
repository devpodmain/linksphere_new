<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Auth;
use PDO;

class ProfileController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getMyProfile()
    {
        $user = Auth::getCurrentUser();
        
        try {
            // Get profile data
            $stmt = $this->db->prepare("
                SELECT p.*, u.subscription_plan, u.role
                FROM user_profiles p 
                JOIN users u ON p.user_id = u.id 
                WHERE p.user_id = ?
            ");
            $stmt->execute([$user['id']]);
            $profile = $stmt->fetch();

            if (!$profile) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Profile not found'
                ]);
                return;
            }

            // Get social links
            $stmt = $this->db->prepare("SELECT * FROM social_links WHERE profile_id = ? ORDER BY display_order");
            $stmt->execute([$profile['id']]);
            $socialLinks = $stmt->fetchAll();

            // Get custom links
            $stmt = $this->db->prepare("SELECT * FROM custom_links WHERE profile_id = ? ORDER BY display_order");
            $stmt->execute([$profile['id']]);
            $customLinks = $stmt->fetchAll();

            // Get collaborations
            $stmt = $this->db->prepare("SELECT * FROM collaborations WHERE profile_id = ? ORDER BY display_order");
            $stmt->execute([$profile['id']]);
            $collaborations = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'profile' => [
                    'id' => $profile['id'],
                    'name' => $profile['name'],
                    'tagline' => $profile['tagline'],
                    'location' => $profile['location'],
                    'phone' => $profile['phone'],
                    'email' => $profile['email'],
                    'bio' => $profile['bio'],
                    'profile_image' => $profile['profile_image'],
                    'profile_url' => $profile['profile_url'],
                    'upi_id' => $profile['upi_id'],
                    'upi_qr' => $profile['upi_qr'],
                    'subscription_plan' => $profile['subscription_plan'],
                    'role' => $profile['role'] ?? $user['role'],
                    'social_links' => $socialLinks,
                    'custom_links' => $customLinks,
                    'collaborations' => $collaborations
                ]
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch profile',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function updateProfile()
    {
        $user = Auth::getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);

        try {
            $this->db->beginTransaction();

            // First, check if profile exists and get profile ID
            $stmt = $this->db->prepare("SELECT id FROM user_profiles WHERE user_id = ?");
            $stmt->execute([$user['id']]);
            $profile = $stmt->fetch();
            
            if (!$profile) {
                $this->db->rollback();
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Profile not found. Please contact support.'
                ]);
                return;
            }
            
            $profileId = $profile['id'];

            // Update basic profile info
            // Check which columns exist in the database
            $stmt = $this->db->query("SHOW COLUMNS FROM user_profiles");
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $existingColumns = array_flip($columns);
            
            // Build the UPDATE query only with existing columns
            $updateFields = [];
            $updateValues = [];
            
            $fieldsToUpdate = [
                'name', 'tagline', 'location', 'phone', 'email', 
                'bio', 'profile_image'
            ];
            
            // Add UPI fields only if columns exist
            if (isset($existingColumns['upi_id'])) {
                $fieldsToUpdate[] = 'upi_id';
            }
            if (isset($existingColumns['upi_qr'])) {
                $fieldsToUpdate[] = 'upi_qr';
            }
            
            foreach ($fieldsToUpdate as $field) {
                if (isset($existingColumns[$field])) {
                    $updateFields[] = "$field = ?";
                    $updateValues[] = $input[$field] ?? '';
                }
            }
            
            if (empty($updateFields)) {
                $this->db->rollback();
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'No valid fields to update'
                ]);
                return;
            }
            
            // Add user_id for WHERE clause
            $updateValues[] = $user['id'];
            
            $updateSql = "UPDATE user_profiles SET " . implode(', ', $updateFields) . " WHERE user_id = ?";
            $stmt = $this->db->prepare($updateSql);
            $stmt->execute($updateValues);
            
            // Note: rowCount() can return 0 if values are unchanged (MySQL optimization)
            // We'll proceed anyway as long as no exception was thrown

            // Update social links
            if (isset($input['social_links'])) {
                $stmt = $this->db->prepare("DELETE FROM social_links WHERE profile_id = ?");
                $stmt->execute([$profileId]);

                if (!empty($input['social_links'])) {
                    $stmt = $this->db->prepare("
                        INSERT INTO social_links (profile_id, platform, url, display_order, created_at) 
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ");
                    foreach ($input['social_links'] as $index => $link) {
                        if (!empty($link['url'])) {
                            $stmt->execute([
                                $profileId, 
                                $link['platform'] ?? '', 
                                $link['url'], 
                                $link['display_order'] ?? $index
                            ]);
                        }
                    }
                }
            }

            // Update custom links
            if (isset($input['custom_links'])) {
                $stmt = $this->db->prepare("DELETE FROM custom_links WHERE profile_id = ?");
                $stmt->execute([$profileId]);

                if (!empty($input['custom_links'])) {
                    $stmt = $this->db->prepare("
                        INSERT INTO custom_links (profile_id, label, url, icon, display_order, created_at) 
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ");
                    foreach ($input['custom_links'] as $index => $link) {
                        if (!empty($link['url']) && !empty($link['label'])) {
                            $stmt->execute([
                                $profileId, 
                                $link['label'], 
                                $link['url'], 
                                $link['icon'] ?? 'link', 
                                $link['display_order'] ?? $index
                            ]);
                        }
                    }
                }
            }

            // Update collaborations
            if (isset($input['collaborations'])) {
                $stmt = $this->db->prepare("DELETE FROM collaborations WHERE profile_id = ?");
                $stmt->execute([$profileId]);

                if (!empty($input['collaborations'])) {
                    $stmt = $this->db->prepare("
                        INSERT INTO collaborations (profile_id, logo, name, description, url, display_order, created_at) 
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ");
                    foreach ($input['collaborations'] as $index => $collab) {
                        if (!empty($collab['name'])) {
                            $stmt->execute([
                                $profileId, 
                                $collab['logo'] ?? '', 
                                $collab['name'], 
                                $collab['description'] ?? '', 
                                $collab['url'] ?? '', 
                                $collab['display_order'] ?? $index
                            ]);
                        }
                    }
                }
            }

            $this->db->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);

        } catch (\Exception $e) {
            $this->db->rollback();
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function getPublicProfile()
    {
        $profileUrl = $_GET['profile_url'] ?? '';
        
        try {
            $stmt = $this->db->prepare("
                SELECT p.*, u.subscription_plan, u.subscription_status, u.subscription_period, u.subscription_expires_at 
                FROM user_profiles p 
                JOIN users u ON p.user_id = u.id 
                WHERE p.profile_url = ?
            ");
            $stmt->execute([$profileUrl]);
            $profile = $stmt->fetch();

            if (!$profile) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Profile not found'
                ]);
                return;
            }

            // Get social links
            $stmt = $this->db->prepare("SELECT * FROM social_links WHERE profile_id = ? ORDER BY display_order");
            $stmt->execute([$profile['id']]);
            $socialLinks = $stmt->fetchAll();

            // Get custom links
            $stmt = $this->db->prepare("SELECT * FROM custom_links WHERE profile_id = ? ORDER BY display_order");
            $stmt->execute([$profile['id']]);
            $customLinks = $stmt->fetchAll();

            // Get collaborations
            $stmt = $this->db->prepare("SELECT * FROM collaborations WHERE profile_id = ? ORDER BY display_order");
            $stmt->execute([$profile['id']]);
            $collaborations = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'profile' => [
                    'name' => $profile['name'],
                    'tagline' => $profile['tagline'],
                    'location' => $profile['location'],
                    'phone' => $profile['phone'],
                    'email' => $profile['email'],
                    'bio' => $profile['bio'],
                    'profile_image' => $profile['profile_image'],
                    'upi_id' => $profile['upi_id'],
                    'upi_qr' => $profile['upi_qr'],
                    'subscription_plan' => $profile['subscription_plan'] ?? 'free',
                    'subscription_status' => $profile['subscription_status'] ?? 'active',
                    'subscription_period' => $profile['subscription_period'],
                    'subscription_expires_at' => $profile['subscription_expires_at'],
                    'social_links' => $socialLinks,
                    'custom_links' => $customLinks,
                    'collaborations' => $collaborations
                ]
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch profile',
                'error' => $e->getMessage()
            ]);
        }
    }
}
