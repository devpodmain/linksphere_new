<?php

use App\Core\Router;
use App\Core\Auth;

$router = new Router();

// Root route
$router->get('/', function() {
    echo json_encode([
        'success' => true,
        'message' => 'LinkSphere API is running!',
        'version' => '1.0.0',
        'endpoints' => [
            'auth' => [
                'POST /auth/register' => 'Register new user',
                'POST /auth/login' => 'Login user',
                'POST /auth/logout' => 'Logout user',
                'POST /auth/refresh' => 'Refresh token',
                'POST /auth/forgot-password' => 'Send password reset link',
                'POST /auth/reset-password' => 'Reset password with token'
            ],
            'profiles' => [
                'GET /profiles/me' => 'Get my profile',
                'PUT /profiles/me' => 'Update my profile',
                'GET /profiles/{profile_url}' => 'Get public profile'
            ],
            'account' => [
                'GET /account' => 'Get account info',
                'PUT /account' => 'Update account',
                'DELETE /account' => 'Delete account'
            ],
            'support' => [
                'GET /support/faq' => 'Get FAQ',
                'POST /support/ticket' => 'Create support ticket',
                'GET /support/tickets' => 'Get my tickets'
            ],
            'upload' => [
                'POST /upload/profile-image' => 'Upload profile image',
                'POST /upload/collaboration-logo' => 'Upload collaboration logo'
            ]
        ]
    ]);
});



// Auth routes
$router->post('/auth/register', 'AuthController@register');
$router->post('/auth/login', 'AuthController@login');
$router->post('/auth/logout', 'AuthController@logout');
$router->post('/auth/refresh', 'AuthController@refresh');
$router->post('/auth/forgot-password', 'AuthController@forgotPassword');
$router->post('/auth/reset-password', 'AuthController@resetPassword');

$router->get('/subscriptions/me', 'SubscriptionController@me');
$router->get('/subscriptions/access', 'SubscriptionController@access');
$router->put('/subscriptions/update/{userId}', 'SubscriptionController@update');
$router->put('/subscriptions/expire/{userId}', 'SubscriptionController@expire');

// Profile routes (protected)
$router->get('/profiles/me', 'ProfileController@getMyProfile');
$router->post('/profiles/me', 'ProfileController@updateProfile');
$router->put('/profiles/me/update', 'ProfileController@updateProfile');

// Public profile route (unprotected)
$router->get('/profiles/{profile_url}', 'ProfileController@getPublicProfile');

// Account routes (protected)
$router->get('/account', 'AccountController@getAccount');
$router->put('/account', 'AccountController@updateAccount');
$router->delete('/account', 'AccountController@deleteAccount');

// Support routes
$router->get('/support/faq', 'SupportController@getFAQ');
$router->post('/support/ticket', 'SupportController@createTicket');
$router->get('/support/tickets', 'SupportController@getMyTickets');

// File upload routes (protected)
$router->post('/upload/profile-image', 'UploadController@uploadProfileImage');
$router->post('/upload/collaboration-logo', 'UploadController@uploadCollaborationLogo');
$router->post('/upload/upi-qr', 'UploadController@uploadUpiQR');

// Admin routes (protected, admin only)
$router->get('/admin/users', 'AdminController@getUsers');
$router->get('/admin/users/{id}', 'AdminController@getUser');
$router->put('/admin/users/{id}/status', 'AdminController@updateUserStatus');
$router->delete('/admin/users/{id}', 'AdminController@deleteUser');
$router->get('/admin/subscriptions', 'AdminSubscriptionController@index');
$router->put('/admin/subscriptions/{userId}', 'AdminSubscriptionController@update');
$router->put('/admin/subscriptions/expire/{userId}', 'AdminSubscriptionController@expire');
$router->get('/admin/subscriptions/history/{userId}', 'AdminSubscriptionController@history');

// Super admin routes (protected, super admin only)
$router->get('/superadmin/stats', 'SuperAdminController@getStats');
$router->get('/superadmin/users', 'SuperAdminController@getUsers');
$router->post('/superadmin/admins', 'SuperAdminController@createOrPromoteAdmin');
$router->post('/superadmin/users/create', 'SuperAdminController@createUser');
$router->put('/superadmin/users/{id}/status', 'SuperAdminController@updateUserStatus');
$router->get('/superadmin/config', 'SuperAdminController@getConfig');
$router->put('/superadmin/config', 'SuperAdminController@updateConfig');
$router->get('/superadmin/subscriptions', 'SuperAdminSubscriptionController@list');
$router->put('/superadmin/subscriptions/{userId}', 'SuperAdminSubscriptionController@update');
$router->put('/superadmin/subscriptions/expire/{userId}', 'SuperAdminSubscriptionController@expire');
$router->get('/superadmin/subscriptions/history/{userId}', 'SuperAdminSubscriptionController@history');

// Public config routes
$router->get('/config/pricing', 'ConfigController@getPricing');

// Payment routes (protected)
$router->post('/payments/create-order', 'PaymentController@createOrder');
$router->post('/payments/verify', 'PaymentController@verify');

// Static file serving for uploads (using image.php script instead)
// This is handled by the image.php script in the public directory

$router->get('/uploads/collaborations/{filename}', function() {
    $filename = $_GET['filename'] ?? '';
    $filePath = __DIR__ . '/../uploads/collaborations/' . $filename;
    if (file_exists($filePath)) {
        $mimeType = mime_content_type($filePath);
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
    }
});
