<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Auth;

class SupportController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getFAQ()
    {
        $faq = [
            [
                'question' => 'How do I create my profile?',
                'answer' => 'After signing up, go to your dashboard and click on the Profile section. You can add your basic information, profile image, and customize your links.'
            ],
            [
                'question' => 'Can I customize my profile URL?',
                'answer' => 'Your profile URL is automatically generated based on your name, but you can request a custom URL by contacting support.'
            ],
            [
                'question' => 'How many links can I add?',
                'answer' => 'Free users can add up to 10 links, while premium users have unlimited links and additional features.'
            ],
            [
                'question' => 'How do I share my profile?',
                'answer' => 'You can share your profile using the generated QR code or by sharing your profile URL directly.'
            ],
            [
                'question' => 'Can I change my subscription plan?',
                'answer' => 'Yes, you can upgrade or downgrade your subscription plan at any time from your account settings.'
            ]
        ];

        echo json_encode([
            'success' => true,
            'faq' => $faq
        ]);
    }

    public function createTicket()
    {
        $user = Auth::getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['subject']) || empty($input['message'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Subject and message are required'
            ]);
            return;
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO support_tickets (user_id, subject, message) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$user['id'], $input['subject'], $input['message']]);

            echo json_encode([
                'success' => true,
                'message' => 'Support ticket created successfully'
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create support ticket',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function getMyTickets()
    {
        $user = Auth::getCurrentUser();
        
        try {
            $stmt = $this->db->prepare("
                SELECT id, subject, status, created_at, updated_at 
                FROM support_tickets 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            ");
            $stmt->execute([$user['id']]);
            $tickets = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'tickets' => $tickets
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch support tickets',
                'error' => $e->getMessage()
            ]);
        }
    }
}


