<?php

namespace App\Core;

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

class Mailer
{
    private PHPMailer $mailer;

    public function __construct()
    {
        $this->mailer = new PHPMailer(true);

        $host = Config::get('smtp_host');
        $username = Config::get('smtp_user');
        $password = Config::get('smtp_pass');
        $port = Config::get('smtp_port', 587);
        $from = Config::get('mail_from', $username);
        $fromName = Config::get('mail_from_name', 'Linksphere');

        $this->mailer->isSMTP();
        $this->mailer->Host = $host;
        $this->mailer->SMTPAuth = true;
        $this->mailer->Username = $username;
        $this->mailer->Password = $password;
        $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $this->mailer->Port = $port;
        $this->mailer->CharSet = 'UTF-8';

        $this->mailer->setFrom($from, $fromName);
        $this->mailer->isHTML(true);
    }

    /**
     * @param string $to
     * @param string $subject
     * @param string $htmlBody
     * @param string|null $textBody
     * @return bool
     */
    public function send(string $to, string $subject, string $htmlBody, ?string $textBody = null): bool
    {
        try {
            $this->mailer->clearAllRecipients();
            $this->mailer->addAddress($to);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $htmlBody;

            if ($textBody !== null) {
                $this->mailer->AltBody = $textBody;
            } else {
                $this->mailer->AltBody = strip_tags($htmlBody);
            }

            $this->mailer->send();
            error_log(sprintf('[Mailer] Email sent to %s | Subject: %s', $to, $subject));
            return true;
        } catch (Exception $exception) {
            error_log(sprintf('[Mailer] Failed sending to %s: %s', $to, $exception->getMessage()));
            return false;
        }
    }
}





