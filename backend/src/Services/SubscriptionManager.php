<?php

namespace App\Services;

use App\Core\Database;
use DateTimeImmutable;
use DateTimeInterface;
use PDO;
use Throwable;

class SubscriptionManager
{
    private const SUPPORTED_PLANS = ['trial', 'free', 'basic', 'premium'];
    private const SUPPORTED_PERIODS = ['trial', 'monthly', 'yearly'];
    private const SUPPORTED_STATUSES = ['active', 'expired', 'paused'];

    /**
     * Manually update a subscription based on dashboard actions.
     *
     * @param int $userId
     * @param array $payload
     * @param string|null $changedBy
     * @return array{plan:string,status:string,period:?string,expires_at:?string}
     */
    public static function updatePlanManually(int $userId, array $payload, ?string $changedBy = null): array
    {
        $previous = self::getSnapshot($userId);
        if ($previous === null) {
            throw new \RuntimeException('User not found for subscription update');
        }

        $plan = strtolower($payload['plan'] ?? $previous['plan']);
        if (!in_array($plan, self::SUPPORTED_PLANS, true)) {
            throw new \InvalidArgumentException('Unsupported subscription plan.');
        }

        $status = strtolower($payload['status'] ?? $previous['status']);
        if (!in_array($status, self::SUPPORTED_STATUSES, true)) {
            throw new \InvalidArgumentException('Unsupported subscription status.');
        }

        $period = $payload['period'] ?? $previous['period'];
        if ($plan === 'trial') {
            $period = 'trial';
        } elseif ($plan === 'free') {
            $period = null;
        } elseif (!in_array($period, ['monthly', 'yearly'], true)) {
            $period = 'monthly';
        }

        $expiresInput = $payload['expires_at'] ?? $payload['subscription_expires_at'] ?? $previous['expires_at'];

        if ($status === 'expired') {
            return self::expirePlan($userId, $changedBy, $previous);
        }

        // Treat paused like active for storage but preserve status
        $effectiveStatus = $status === 'paused' ? 'paused' : 'active';
        return self::activatePlan(
            $userId,
            $plan,
            $period,
            $expiresInput,
            $changedBy,
            $previous,
            $effectiveStatus
        );
    }

    /**
     * Activate or update a user's subscription plan.
     *
     * @param int $userId
     * @param string $plan
     * @param string|null $period
     * @param DateTimeInterface|string|null $customExpiry
     * @param string|null $changedBy
     * @param array|null $previousState
     * @param string $status
     * @return array{plan:string,status:string,period:?string,expires_at:?string}
     */
    public static function activatePlan(
        int $userId,
        string $plan,
        ?string $period = null,
        DateTimeInterface|string|null $customExpiry = null,
        ?string $changedBy = null,
        ?array $previousState = null,
        string $status = 'active'
    ): array {
        $plan = strtolower($plan);
        if (!in_array($plan, self::SUPPORTED_PLANS, true)) {
            throw new \InvalidArgumentException('Unsupported subscription plan.');
        }

        if (!in_array($status, self::SUPPORTED_STATUSES, true)) {
            throw new \InvalidArgumentException('Unsupported subscription status.');
        }

        if ($plan === 'trial') {
            $period = 'trial';
        } elseif ($plan === 'free') {
            $period = null;
        } elseif ($period === null) {
            $period = 'monthly';
        }

        if ($period !== null) {
            $period = strtolower($period);
            if (!in_array($period, self::SUPPORTED_PERIODS, true)) {
                throw new \InvalidArgumentException('Unsupported subscription period.');
            }
        }

        $previous = $previousState ?? self::getSnapshot($userId);
        if ($previous === null) {
            throw new \RuntimeException('User not found for subscription update');
        }

        $expiresAt = self::resolveExpiry($plan, $period, $customExpiry);

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            UPDATE users
            SET subscription_plan = :plan,
                subscription_status = :status,
                subscription_period = :period,
                subscription_expires_at = :expires_at,
                updated_at = NOW()
            WHERE id = :id
        ");
        $stmt->bindValue(':plan', $plan);
        $stmt->bindValue(':status', $status);
        if ($period !== null) {
            $stmt->bindValue(':period', $period);
        } else {
            $stmt->bindValue(':period', null, PDO::PARAM_NULL);
        }
        if ($expiresAt !== null) {
            $stmt->bindValue(':expires_at', $expiresAt->format('Y-m-d H:i:s'));
        } else {
            $stmt->bindValue(':expires_at', null, PDO::PARAM_NULL);
        }
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $current = [
            'plan' => $plan,
            'status' => $status,
            'period' => $period,
            'expires_at' => $expiresAt?->format('Y-m-d H:i:s'),
        ];

        self::recordHistory($userId, $previous, $current, $changedBy);

        return $current;
    }

    /**
     * Expire a user's subscription and downgrade to the free plan.
     */
    public static function expirePlan(int $userId, ?string $changedBy = null, ?array $previousState = null): array
    {
        $previous = $previousState ?? self::getSnapshot($userId);
        if ($previous === null) {
            throw new \RuntimeException('User not found for subscription update');
        }

        $db = Database::getInstance()->getConnection();
        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');

        $stmt = $db->prepare("
            UPDATE users
            SET subscription_plan = 'free',
                subscription_status = 'expired',
                subscription_period = NULL,
                subscription_expires_at = :now,
                updated_at = NOW()
            WHERE id = :id
        ");
        $stmt->bindValue(':now', $now);
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $current = [
            'plan' => 'free',
            'status' => 'expired',
            'period' => null,
            'expires_at' => $now,
        ];

        self::recordHistory($userId, $previous, $current, $changedBy);

        return $current;
    }

    /**
     * Auto-expire the user's subscription if the stored expiry has passed.
     *
     * @return bool true when an expiry was applied
     */
    public static function autoExpireIfNeeded(int $userId): bool
    {
        $previous = self::getSnapshot($userId);
        if ($previous === null) {
            return false;
        }

        if ($previous['status'] !== 'active') {
            return false;
        }

        if (!in_array($previous['plan'], ['trial', 'basic', 'premium'], true)) {
            return false;
        }

        if (empty($previous['expires_at'])) {
            return false;
        }

        try {
            $expiry = new DateTimeImmutable($previous['expires_at']);
        } catch (Throwable) {
            return false;
        }

        if ($expiry > new DateTimeImmutable()) {
            return false;
        }

        self::expirePlan($userId, 'system', $previous);
        return true;
    }

    public static function getSubscriptionHistory(int $userId, int $limit = 10): array
    {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT previous_plan, new_plan, status, period, expires_at, changed_by, changed_at
            FROM subscription_history
            WHERE user_id = :user_id
            ORDER BY changed_at DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    private static function getSnapshot(int $userId): ?array
    {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT subscription_plan, subscription_status, subscription_period, subscription_expires_at
            FROM users
            WHERE id = :id
        ");
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return [
            'plan' => $row['subscription_plan'] ?? 'free',
            'status' => $row['subscription_status'] ?? 'active',
            'period' => $row['subscription_period'] ?? null,
            'expires_at' => $row['subscription_expires_at'] ?? null,
        ];
    }

    private static function recordHistory(int $userId, array $previous, array $current, ?string $changedBy): void
    {
        if (
            $previous['plan'] === $current['plan']
            && $previous['status'] === $current['status']
            && ($previous['period'] ?? null) === ($current['period'] ?? null)
            && ($previous['expires_at'] ?? null) === ($current['expires_at'] ?? null)
        ) {
            return;
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            INSERT INTO subscription_history (
                user_id,
                previous_plan,
                new_plan,
                status,
                period,
                expires_at,
                changed_by
            ) VALUES (
                :user_id,
                :previous_plan,
                :new_plan,
                :status,
                :period,
                :expires_at,
                :changed_by
            )
        ");
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':previous_plan', $previous['plan'], PDO::PARAM_STR);
        $stmt->bindValue(':new_plan', $current['plan'], PDO::PARAM_STR);
        $stmt->bindValue(':status', $current['status'], PDO::PARAM_STR);
        if ($current['period'] !== null) {
            $stmt->bindValue(':period', $current['period'], PDO::PARAM_STR);
        } else {
            $stmt->bindValue(':period', null, PDO::PARAM_NULL);
        }
        if (!empty($current['expires_at'])) {
            $stmt->bindValue(':expires_at', $current['expires_at'], PDO::PARAM_STR);
        } else {
            $stmt->bindValue(':expires_at', null, PDO::PARAM_NULL);
        }
        $stmt->bindValue(':changed_by', $changedBy ?? 'system');
        $stmt->execute();
    }

    private static function resolveExpiry(string $plan, ?string $period, DateTimeInterface|string|null $customExpiry): ?DateTimeImmutable
    {
        if ($plan === 'free') {
            return null;
        }

        if ($customExpiry instanceof DateTimeInterface) {
            return DateTimeImmutable::createFromInterface($customExpiry);
        }

        if (is_string($customExpiry) && $customExpiry !== '') {
            try {
                return new DateTimeImmutable($customExpiry);
            } catch (Throwable) {
                // fall back to standard calculation
            }
        }

        $durations = [
            'trial' => 15,
            'monthly' => 30,
            'yearly' => 365,
        ];

        $periodKey = $period ?? 'monthly';
        $days = $durations[$periodKey] ?? 30;

        return new DateTimeImmutable("+{$days} days");
    }
}
