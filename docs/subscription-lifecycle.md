# Subscription Lifecycle Guide

## Plan Overview

| Plan     | Access Level                                                          | Expiry Behaviour                       |
|----------|------------------------------------------------------------------------|----------------------------------------|
| Trial    | Full feature access (same as Premium) for the first 15 days            | Auto-downgrades to Free after 15 days  |
| Free     | Basic profile + public profile                                         | Never expires                          |
| Basic    | Profile + social links + custom links                                  | Auto-downgrades to Free after expiry   |
| Premium  | All features (Basic + payments)                                        | Auto-downgrades to Free after expiry   |

## Automatic Flow

1. **First Login Trial**
   - `AuthController@login` upgrades first-time users to the trial plan.
   - Trial duration is enforced via `SubscriptionManager::activatePlan`.

2. **Middleware Enforcement**
   - `Auth::middleware()` invokes `SubscriptionManager::autoExpireIfNeeded()` on every protected request.
   - Any expired trial/basic/premium plan is downgraded to Free immediately.

3. **Daily Cron**
   - A SQL-based safety net keeps data consistent.
   - Schedule the script `backend/scripts/expire_subscriptions.php`:

     ```bash
     # Example crontab entry (runs at 02:00 server time)
     0 2 * * * /usr/bin/php /path/to/project/backend/scripts/expire_subscriptions.php >> /var/log/linksphere-cron.log 2>&1
     ```

## Manual Controls

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/subscriptions/update/{userId}` | PUT | Admin / Super Admin | Activate or edit plan/period/expiry |
| `/api/subscriptions/expire/{userId}` | PUT | Admin / Super Admin | Force expire & downgrade to Free |
| `/api/subscriptions/me` | GET | Authenticated User | Current plan details + remaining days |
| `/api/subscriptions/access` | GET | Authenticated User | Feature flags for the active plan |

All endpoints use `SubscriptionManager`, ensuring consistent business rules.

## Testing Checklist

1. **Trial Activation**
   - Register a new user → first login should show Trial plan with 15 days remaining.
   - Verify `/api/subscriptions/me` returns `plan: "trial"` and `status: "active"`.

2. **Auto-Expiry**
   - Manually set `subscription_expires_at` to a past date for a trial/basic/premium user.
   - Hit any protected endpoint → middleware should downgrade to Free with `status: "expired"`.

3. **Cron Safety Net**
   - Run the cron script manually:  
     `php backend/scripts/expire_subscriptions.php`
   - Confirm rows with past expiry are downgraded.

4. **Manual Admin Actions**
   - From the Admin/Super Admin UI (or via API), upgrade a user to Basic/Premium and verify `/api/subscriptions/me`.
   - Use the Expire action → confirm downgrade banner appears on the account page.

5. **Feature Gating**
   - With Free plan, the dashboard hides Social Links / Custom Links / UPI sections and shows upgrade prompts.
   - Upgrade to Premium → gated sections become active immediately after refresh.

6. **Payment Flow**
   - Complete a Razorpay checkout for Basic or Premium.
   - Ensure the payment handler verifies, plan upgrades, and the account page reflects the new tier.

## Notes

- `SubscriptionManager` is the single source of truth for plan/expiry logic.
- Every controller that mutates subscriptions calls the helper to avoid divergence.
- Frontend uses shared `PLAN_FEATURES` mapping for feature gating and user messaging.


