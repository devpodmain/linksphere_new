<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Config;
use App\Core\Database;
use Razorpay\Api\Api;
use App\Services\SystemSettings;
use App\Services\SubscriptionManager;

class PaymentController
{
    private \PDO $db;
    private Api $razorpay;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        $keyId = Config::get('razorpay_key_id');
        $keySecret = Config::get('razorpay_key_secret');

        if (!$keyId || !$keySecret) {
            throw new \Exception('Razorpay credentials not configured');
        }

        $this->razorpay = new Api($keyId, $keySecret);
    }

    public function createOrder(): void
    {
        $user = Auth::getCurrentUser();

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $plan = $input['plan'] ?? '';
        $period = $input['period'] ?? '';

        $pricing = $this->getPlanPricing($plan, $period);
        if ($pricing === null) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid plan or billing period'
            ]);
            return;
        }

        [$amount, $duration] = $pricing;

        try {
            $order = $this->razorpay->order->create([
                'amount' => (int) ($amount * 100),
                'currency' => 'INR',
                'receipt' => 'order_' . uniqid(),
                'notes' => [
                    'user_id' => $user['id'],
                    'plan' => $plan,
                    'period' => $period
                ]
            ]);

            $stmt = $this->db->prepare("
                INSERT INTO payments (user_id, razorpay_order_id, plan, period, amount, currency)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $user['id'],
                $order['id'],
                $plan,
                $period,
                $amount,
                'INR'
            ]);

            echo json_encode([
                'success' => true,
                'order' => $order,
                'key_id' => Config::get('razorpay_key_id'),
                'plan' => $plan,
                'period' => $period,
                'amount' => $amount,
                'expires_in_days' => $duration
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Unable to create payment order',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function verify(): void
    {
        $user = Auth::getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $orderId = $input['razorpay_order_id'] ?? '';
        $paymentId = $input['razorpay_payment_id'] ?? '';
        $signature = $input['razorpay_signature'] ?? '';

        if (!$orderId || !$paymentId || !$signature) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Missing payment details'
            ]);
            return;
        }

        $stmt = $this->db->prepare("SELECT * FROM payments WHERE razorpay_order_id = ? AND user_id = ?");
        $stmt->execute([$orderId, $user['id']]);
        $payment = $stmt->fetch();

        if (!$payment) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Payment order not found'
            ]);
            return;
        }

        try {
            $generatedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, Config::get('razorpay_key_secret'));
            if (!hash_equals($generatedSignature, $signature)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid payment signature'
                ]);
                return;
            }

            $this->db->beginTransaction();

            $updatePayment = $this->db->prepare("
                UPDATE payments
                SET razorpay_payment_id = ?, razorpay_signature = ?, status = 'paid', response_payload = ?
                WHERE id = ?
            ");
            $updatePayment->execute([
                $paymentId,
                $signature,
                json_encode($input),
                $payment['id']
            ]);

            $subscription = SubscriptionManager::activatePlan(
                (int) $user['id'],
                (string) $payment['plan'],
                (string) $payment['period']
            );

            $this->db->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Payment verified and subscription updated',
                'subscription' => $subscription
            ]);
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to verify payment',
                'error' => $e->getMessage()
            ]);
        }
    }

    private function getPlanPricing(string $plan, string $period): ?array
    {
        $pricing = SystemSettings::getPricing();
        $durations = [
            'monthly' => 30,
            'yearly' => 365
        ];

        if ($plan === 'free') {
            return [0.0, $durations[$period] ?? 30];
        }

        if (!isset($pricing[$plan][$period])) {
            return null;
        }

        $amount = (float) $pricing[$plan][$period];
        $duration = $durations[$period] ?? null;

        if ($duration === null) {
            return null;
        }
        return [$amount, $duration];
    }

}

