<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Core\Config;

use App\Core\Mailer;


var_dump(Config::get('smtp_user'));
var_dump(Config::get('mail_from'));

// Create instance — required because send() is NOT static
$mailer = new Mailer();

$success = $mailer->send(
    "info@dzyte.com",
    "Linksphere Test Email",
    "<p>This is a test email from Linksphere SMTP setup.</p>"
);

if ($success) {
    echo "Email sent successfully.";
} else {
    echo "Email failed. Check php_error_log.";
}
