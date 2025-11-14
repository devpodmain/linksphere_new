# Razorpay Payment & Subscription Setup Guide

This guide covers setting up Razorpay payments for local development and production, testing payment flows, and understanding subscription management.

---

## Table of Contents

1. [Razorpay Account Setup](#razorpay-account-setup)
2. [Local Development Setup](#local-development-setup)
3. [Production Setup](#production-setup)
4. [Subscription Plans - Important Note](#subscription-plans-important-note)
5. [Payment Flow Testing](#payment-flow-testing)
6. [Subscription Activation Flows](#subscription-activation-flows)
7. [Admin Manual Plan Activation](#admin-manual-plan-activation)
8. [Troubleshooting](#troubleshooting)

---

## Razorpay Account Setup

### Step 1: Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Sign up for a new account (or log in if you have one)
3. Complete business verification (required for production)

### Step 2: Get API Keys

#### For Local Development (Test Mode):

1. Log in to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. You'll see two sets of keys:
   - **Test Mode Keys** (for development)
   - **Live Mode Keys** (for production)
4. For local development, use **Test Mode**:
   - Click "Generate Test Key" if not already generated
   - Copy the **Key ID** and **Key Secret**
   - These keys start with `rzp_test_` prefix

#### For Production (Live Mode):

1. Complete business verification in Razorpay Dashboard
2. Switch to **Live Mode** in API Keys section
3. Generate Live keys (if not already done)
4. Copy the **Key ID** and **Key Secret**
   - Live keys start with `rzp_live_` prefix

### Step 3: Configure Webhook (Optional but Recommended)

For production, set up webhooks to handle payment events:

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/backend/webhooks/razorpay`
3. Select events: `payment.captured`, `payment.failed`
4. Save webhook secret for verification

---

## Local Development Setup

### Prerequisites

- XAMPP installed and running
- Node.js and npm
- Composer (for PHP dependencies)
- Razorpay test account with test API keys

### Step 1: Database Setup

1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Create database: `linksphere`
4. Import schema: `database/schema.sql`

### Step 2: Backend Configuration

1. Navigate to backend directory:
   cd backend
   2. Install PHP dependencies:
   composer install
   3. Create environment file:
   copy env.example .env
   4. Update `.env` file with Razorpay test keys:
  
   DB_HOST=localhost
   DB_NAME=linksphere
   DB_USER=root
   DB_PASS=
   
   JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
   
   # Razorpay Test Mode Keys (for local development)
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_test_key_secret_here
   
   # Email Configuration (optional for local)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=youremail@gmail.com
   SMTP_PASS=yourapppassword
   MAIL_FROM=youremail@gmail.com
   MAIL_FROM_NAME=Linksphere
   
   APP_BASE_URL=http://localhost/linksphere/backend/public
   FRONTEND_URL=http://localhost:5173
   5. Configure pricing in database (optional - defaults will be used):
  
   INSERT INTO system_settings (setting_key, setting_value) VALUES
   ('pricing_basic_monthly', '249'),
   ('pricing_basic_yearly', '2499'),
   ('pricing_premium_monthly', '350'),
   ('pricing_premium_yearly', '3500')
   ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
   6. Start backend server:
   # Using XAMPP (Apache)
   # Place project in htdocs folder
   # Access via: http://localhost/linksphere/backend/public
   
   # OR using PHP built-in server:
   php -S localhost:8000 -t public
   ### Step 3: Frontend Configuration

1. Navigate to frontend directory:
   cd frontend
   2. Install dependencies:h
   npm install
   3. Ensure Razorpay Checkout script is loaded in `index.html`:tml
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   
4. Update API configuration in `src/config/api.ts` if needed:ript
   export const API_CONFIG = {
     BASE_URL: 'http://localhost/linksphere/backend/public'
   };
   5. Start development server:ash
   npm run dev
   ### Step 4: Verify Setup

1. Frontend should be running on: `http://localhost:5173`
2. Backend API should be accessible at: `http://localhost/linksphere/backend/public`
3. Test API endpoint: `http://localhost/linksphere/backend/public/`
   - Should return API information JSON

---

## Production Setup

### Step 1: Server Requirements

- PHP 8.0 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- SSL certificate (HTTPS required for Razorpay)

### Step 2: Backend Configuration

1. Upload backend files to server
2. Create `.env` file from `env.production.example`:
   cp env.production.example .env
   3. Update `.env` with production values:
   DB_HOST=localhost
   DB_NAME=your_production_db
   DB_USER=your_db_user
   DB_PASS=your_secure_db_password
   
   JWT_SECRET=your-super-secure-random-jwt-secret-minimum-32-characters
   
   # Razorpay Live Mode Keys (for production)
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_live_key_secret_here
   
   # Production URLs
   APP_BASE_URL=https://yourdomain.com/backend/public
   FRONTEND_URL=https://yourdomain.com
   
   # Production Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-production-email@gmail.com
   SMTP_PASS=your-app-password
   MAIL_FROM=your-production-email@gmail.com
   MAIL_FROM_NAME=Linksphere
   
   APP_ENV=production
   4. Set proper file permissions:
   chmod 755 backend/uploads
   chmod 755 backend/public/uploads
   5. Configure web server (Apache example):
   <VirtualHost *:80>
       ServerName yourdomain.com
       DocumentRoot /var/www/html/frontend/dist
       
       <Directory /var/www/html/frontend/dist>
           AllowOverride All
           Require all granted
       </Directory>
       
       Alias /backend /var/www/html/backend/public
       <Directory /var/www/html/backend/public>
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ### Step 3: Database Setup

1. Create production database
2. Import schema: `database/schema.sql`
3. Configure pricing:l
   INSERT INTO system_settings (setting_key, setting_value) VALUES
   ('pricing_basic_monthly', '249'),
   ('pricing_basic_yearly', '2499'),
   ('pricing_premium_monthly', '350'),
   ('pricing_premium_yearly', '3500')
   ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
   ### Step 4: Frontend Build

1. Build for production:h
   cd frontend
   npm run build
   
2. Upload `dist` folder contents to web server

3. Ensure Razorpay script is in production HTML

### Step 5: Setup Cron Job

For automatic subscription expiry:

# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /usr/bin/php /path/to/project/backend/scripts/expire_subscriptions.php >> /var/log/linksphere-cron.log 2>&1---

## Subscription Plans - Important Note

### ❌ NO Need to Create Plans in Razorpay Dashboard

**Important:** This system manages subscription plans internally. You do NOT need to create subscription plans in the Razorpay Dashboard.

### How It Works:

1. **Plans are defined in the application**, not in Razorpay
2. **Razorpay is used only for payment processing** (one-time payments)
3. **Subscription management** (plan activation, expiry, features) is handled by the application
4. **Pricing is stored** in the `system_settings` database table

### Plan Structure:

- **Free Plan**: No payment, no expiry
- **Trial Plan**: Auto-activated on first login, 15 days, no payment
- **Basic Plan**: Paid plan (₹249/month or ₹2,499/year)
- **Premium Plan**: Paid plan (₹350/month or ₹3,500/year)

### Payment Flow:

1. User selects plan (Basic/Premium) and period (Monthly/Yearly)
2. System creates a Razorpay **Order** (not subscription)
3. User pays via Razorpay Checkout
4. Payment is verified
5. System activates the plan internally for the selected duration
6. Plan expires automatically after the period ends

---

## Payment Flow Testing

### Test Cards (Razorpay Test Mode)

Use these test cards in Razorpay test mode:

| Card Number | CVV | Expiry | Result |
|------------|-----|--------|--------|
| 4111 1111 1111 1111 | Any 3 digits | Any future date | Success |
| 5555 5555 5555 4444 | Any 3 digits | Any future date | Success |
| 5104 0600 0000 0008 | Any 3 digits | Any future date | Success |

**Note:** In test mode, any CVV and future expiry date will work.

### Testing Steps

1. **Register a new user**
   - Go to signup page
   - Complete registration
   - Verify email

2. **First Login (Trial Activation)**
   - Login with new account
   - Check Account page
   - Should see "Trial" plan with 15 days remaining
   - All features should be accessible

3. **Test Payment Flow**

   a. **Initiate Payment:**
      - Go to Account/Subscription page
      - Select "Premium" plan
      - Choose "Monthly" or "Yearly"
      - Click "Upgrade" or "Subscribe"
      - Razorpay checkout should open

   b. **Complete Payment:**
      - Enter test card: `4111 1111 1111 1111`
      - Enter any CVV (e.g., `123`)
      - Enter any future expiry (e.g., `12/25`)
      - Enter cardholder name
      - Click "Pay"

   c. **Verify Success:**
      - Payment should complete
      - Success message should appear
      - Account page should show new plan
      - Subscription should be active
      - Check database:
 
        SELECT * FROM payments WHERE user_id = [your_user_id];
        SELECT subscription_plan, subscription_status, subscription_expires_at 
        FROM users WHERE id = [your_user_id];
        4. **Test Payment Failure:**
   - Close Razorpay checkout without paying
   - Should show error message
   - Payment record should remain with status 'created'

5. **Test Expiry:**
   - Manually set expiry to past date:
   
     UPDATE users 
     SET subscription_expires_at = '2024-01-01 00:00:00' 
     WHERE id = [user_id];
        - Make any API request (e.g., refresh account page)
   - Subscription should auto-expire to Free

---

## Subscription Activation Flows

### Flow 1: User Subscription via Payment

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User selects plan (Basic/Premium) and period (M/Y)      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend calls: POST /payments/create-order              │
│    - Validates plan & period                                │
│    - Gets pricing from system_settings                      │
│    - Creates Razorpay Order                                 │
│    - Stores payment record (status: 'created')               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Razorpay Checkout opens                                  │
│    - User enters payment details                            │
│    - Razorpay processes payment                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Payment Success → Handler callback                       │
│    - Frontend receives payment_id                           │
│    - Sends to: POST /payments/verify                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend Verification:                                    │
│    - Fetches payment from Razorpay API                      │
│    - Verifies payment status (authorized/captured)          │
│    - Validates signature                                    │
│    - Updates payment record (status: 'paid')                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Subscription Activation:                                 │
│    - SubscriptionManager.activatePlan()                     │
│    - Updates user: plan, status='active', period, expiry   │
│    - Records in subscription_history                        │
│    - Returns success                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Frontend Updates:                                        │
│    - Shows success message                                  │
│    - Refreshes account/subscription data                    │
│    - User sees new plan active                              │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: Automatic Trial Activation

```
┌─────────────────────────────────────────────────────────────┐
│ 1. New user registers                                        │
│    - Account created with plan='free', status='active'      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. User verifies email                                      │
│    - Account remains on Free plan                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User logs in for first time                              │
│    - AuthController@login checks conditions:               │
│      • User role = 'user'                                   │
│      • Current plan = 'free'                                │
│      • Status = 'active'                                    │
│      • No expiry date set                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Auto-activate Trial:                                      │
│    - SubscriptionManager.activatePlan('trial', 'trial')    │
│    - Plan: free → trial                                     │
│    - Period: 'trial'                                        │
│    - Expiry: current_date + 15 days                        │
│    - Status: 'active'                                       │
│    - History recorded                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. User sees Trial plan active                              │
│    - All Premium features accessible                        │
│    - 15 days remaining shown                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Admin Manual Plan Activation

### Flow: Admin Manually Activates Plan

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin logs into admin panel                              │
│    - Navigates to user management                           │
│    - Selects user to modify                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Admin updates subscription:                              │
│    - Selects plan (free/trial/basic/premium)                │
│    - Selects period (monthly/yearly) - if applicable        │
│    - Sets status (active/expired/paused)                     │
│    - Optionally sets custom expiry date                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend calls: PUT /subscriptions/update/{userId}       │
│    - Requires admin/super_admin role                         │
│    - Sends plan, period, status, expiry                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend Processing:                                      │
│    - SubscriptionManager.updatePlanManually()                │
│    - Validates plan, period, status                          │
│    - Gets previous state                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│ If status =      │          │ If status =      │
│ 'expired':       │          │ 'active' or      │
│                  │          │ 'paused':        │
│ expirePlan()     │          │ activatePlan()   │
│ - Plan → free    │          │ - Updates plan   │
│ - Status →      │          │ - Sets expiry    │
│   expired        │          │ - Records history│
└──────────────────┘          └──────────────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. History Recorded:                                        │
│    - Previous plan → New plan                              │
│    - changed_by = admin email                               │
│    - Timestamp recorded                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Response returned:                                       │
│    - Updated subscription details                           │
│    - Admin sees confirmation                                │
│    - User's plan updated immediately                        │
└─────────────────────────────────────────────────────────────┘
```

### Admin API Endpoints

| Endpoint | Method | Role Required | Description |
|----------|--------|---------------|-------------|
| `/subscriptions/update/{userId}` | PUT | Admin/Super Admin | Update user's subscription plan |
| `/subscriptions/expire/{userId}` | PUT | Admin/Super Admin | Force expire user's subscription |
| `/subscriptions/history/{userId}` | GET | Admin/Super Admin | View subscription history |

### Example: Admin Activates Premium for User

**Request:**
```json
PUT /subscriptions/update/123
{
  "plan": "premium",
  "period": "yearly",
  "status": "active"
}
```

**Process:**
1. System validates: plan='premium', period='yearly', status='active'
2. Calculates expiry: current_date + 365 days
3. Updates user record
4. Records history: previous_plan → premium
5. Returns updated subscription

---

## Troubleshooting

### Payment Issues

**Problem:** Payment verification fails with "Missing payment details"
- **Solution:** Ensure Razorpay checkout script is loaded in HTML
- **Check:** Browser console for Razorpay errors
- **Verify:** RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env

**Problem:** "Invalid payment signature"
- **Solution:** Ensure you're using correct key secret (test vs live)
- **Check:** Key ID and Secret match (both test or both live)

**Problem:** Payment succeeds but subscription not activated
- **Solution:** Check backend logs for errors
- **Verify:** Payment record in database has status='paid'
- **Check:** SubscriptionManager.activatePlan() is being called

### Subscription Issues

**Problem:** Trial not activating on first login
- **Solution:** Check user conditions:
  - Role must be 'user' (not admin)
  - Current plan must be 'free'
  - Status must be 'active'
  - No expiry date set
- **Check:** AuthController login method

**Problem:** Subscription not expiring automatically
- **Solution:** Ensure autoExpireIfNeeded() is called in middleware
- **Check:** Expiry date format in database
- **Verify:** Cron job is running (for production)

**Problem:** Admin can't update subscriptions
- **Solution:** Verify admin role in database
- **Check:** RoleMiddleware is working
- **Verify:** Admin has 'admin' or 'super_admin' role

### Configuration Issues

**Problem:** Pricing not showing correctly
- **Solution:** Check system_settings table:
  ```sql
  SELECT * FROM system_settings WHERE setting_key LIKE 'pricing_%';
  ```
- **Update:** If missing, insert default values

**Problem:** Razorpay checkout not opening
- **Solution:** Check Razorpay script is loaded
- **Verify:** API key is correct
- **Check:** Browser console for JavaScript errors

### Database Issues

**Problem:** Payment record not found during verification
- **Solution:** Check payment was created before checkout
- **Verify:** User ID matches in payment record
- **Check:** Order ID is stored correctly

---

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use different keys** for test and production
3. **Keep JWT_SECRET** long and random (minimum 32 characters)
4. **Enable HTTPS** in production (required for Razorpay)
5. **Validate webhook signatures** if using webhooks
6. **Set proper file permissions** on upload directories
7. **Use strong database passwords**
8. **Regularly update dependencies**

---

## Support

For issues or questions:
- Check Razorpay documentation: https://razorpay.com/docs/
- Review application logs
- Check database records
- Test with Razorpay test mode first

---

## Quick Reference

### Environment Variables

```env
# Required for Payments
RAZORPAY_KEY_ID=rzp_test_xxxxx (local) / rzp_live_xxxxx (production)
RAZORPAY_KEY_SECRET=your_key_secret

# Required for App
DB_HOST=localhost
DB_NAME=linksphere
DB_USER=root
DB_PASS=
JWT_SECRET=your-secret-key

# URLs
APP_BASE_URL=http://localhost/linksphere/backend/public
FRONTEND_URL=http://localhost:5173
```

### Test Card Numbers

- Success: `4111 1111 1111 1111`
- Any CVV and future expiry works in test mode

### Default Pricing

- Basic Monthly: ₹249
- Basic Yearly: ₹2,499
- Premium Monthly: ₹350
- Premium Yearly: ₹3,500

---

**Last Updated:** [Current Date]
**Version:** 1.0
```

This README covers:
1. Razorpay setup (local and production)
2. Payment testing with test cards
3. Subscription flows (user payment and admin manual)
4. No need to create plans in Razorpay (managed internally)
5. Troubleshooting
6. Security practices

Should I create this as a new file, or would you prefer to integrate it into the existing README?
