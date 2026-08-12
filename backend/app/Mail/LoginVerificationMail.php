<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $token;
    public $loginUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, $token)
    {
        $this->user = $user;
        $this->token = $token;
        // Assume frontend URL from env or fallback to localhost:5173
        $frontendUrl = env('VITE_APP_URL', 'http://localhost:5173');
        $this->loginUrl = rtrim($frontendUrl, '/') . '/?verify_token=' . $token . '&email=' . urlencode($user->email);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Vérification de connexion - NexChat',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: '
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
                <h2 style="color: #333;">Bonjour ' . htmlspecialchars($this->user->username) . ',</h2>
                <p style="color: #555; line-height: 1.5;">Vous avez demandé à vous connecter à votre compte NexChat. Pour des raisons de sécurité, veuillez valider votre connexion en cliquant sur le bouton ci-dessous :</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="' . $this->loginUrl . '" style="background-color: #a855f7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Valider ma connexion</a>
                </div>
                
                <p style="color: #555; line-height: 1.5;">Ce lien est valable pendant 15 minutes.</p>
                <p style="color: #555; line-height: 1.5;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur : <br>
                <a href="' . $this->loginUrl . '" style="color: #a855f7; word-break: break-all;">' . $this->loginUrl . '</a></p>
                
                <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">Si vous n\'avez pas essayé de vous connecter à NexChat, veuillez ignorer cet e-mail.</p>
            </div>
            '
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
