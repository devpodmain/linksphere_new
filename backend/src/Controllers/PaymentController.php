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

        $paymentId = $input['razorpay_payment_id'] ?? $input['payment_id'] ?? '';
        $orderId = $input['razorpay_order_id'] ?? $input['order_id'] ?? '';
        $signature = $input['razorpay_signature'] ?? $input['signature'] ?? '';

        if (!$paymentId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Missing payment ID'
            ]);
            return;
        }

        try {
            // First, try to find payment record in database by payment_id
            // This will give us the order_id we stored when creating the order
            $stmt = $this->db->prepare("SELECT * FROM payments WHERE razorpay_payment_id = ? AND user_id = ?");
            $stmt->execute([$paymentId, $user['id']]);
            $payment = $stmt->fetch();

            // If not found by payment_id, try by order_id (if provided)
            if (!$payment && $orderId) {
                $stmt = $this->db->prepare("SELECT * FROM payments WHERE razorpay_order_id = ? AND user_id = ?");
                $stmt->execute([$orderId, $user['id']]);
                $payment = $stmt->fetch();
            }

            // If still not found, try to find any payment for this user that might match
            // (in case payment_id was updated but order_id exists)
            if (!$payment) {
                $stmt = $this->db->prepare("SELECT * FROM payments WHERE user_id = ? AND status = 'created' ORDER BY created_at DESC LIMIT 1");
                $stmt->execute([$user['id']]);
                $payment = $stmt->fetch();
            }

            // Now fetch payment details from Razorpay to verify payment status
            $razorpayPayment = $this->razorpay->payment->fetch($paymentId);
            
            // Verify payment status
            $paymentStatus = $razorpayPayment['status'] ?? '';
            if (!in_array($paymentStatus, ['authorized', 'captured'], true)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Payment not completed. Status: ' . $paymentStatus
                ]);
                return;
            }

            // Get order_id - prioritize database, then input, then Razorpay response
            if (!$orderId && $payment) {
                $orderId = $payment['razorpay_order_id'] ?? '';
            }
            
            // Try to get from Razorpay payment object if still not found
            if (!$orderId) {
                // Razorpay payment might have order_id in different formats
                $orderId = $razorpayPayment['order_id'] ?? 
                          ($razorpayPayment['order'] ?? null)['id'] ?? 
                          '';
            }

            if (!$orderId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unable to retrieve order ID. Payment ID: ' . $paymentId
                ]);
                return;
            }

            // If we still don't have a payment record, create error
            if (!$payment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Payment order not found in database'
                ]);
                return;
            }

            // Use order_id from database (most reliable)
            $dbOrderId = $payment['razorpay_order_id'] ?? $orderId;
            
            // Generate signature if not provided
            if (!$signature) {
                $signature = hash_hmac('sha256', $dbOrderId . '|' . $paymentId, Config::get('razorpay_key_secret'));
            }
            
            // Verify signature
            $generatedSignature = hash_hmac('sha256', $dbOrderId . '|' . $paymentId, Config::get('razorpay_key_secret'));
            if (!$signature || !hash_equals($generatedSignature, $signature)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid payment signature'
                ]);
                return;
            }

            $this->db->beginTransaction();

            // Update payment record with payment_id, order_id (if missing), signature, and status
            $updatePayment = $this->db->prepare("
                UPDATE payments
                SET razorpay_payment_id = ?,
                    razorpay_order_id = COALESCE(razorpay_order_id, ?),
                    razorpay_signature = ?,
                    status = 'paid',
                    response_payload = ?
                WHERE id = ?
            ");
            $updatePayment->execute([
                $paymentId,
                $dbOrderId,
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
            if (isset($this->db) && $this->db->inTransaction()) {
                $this->db->rollBack();
            }
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

