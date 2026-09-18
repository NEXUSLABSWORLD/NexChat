<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NotchPayService
{
    protected string $apiUrl;
    protected string $publicKey;
    protected string $secretKey;
    protected string $webhookHash;
    protected string $defaultCurrency;

    /**
     * Pricing tiers in XAF.
     */
    public const TIER_PRICING = [
        'obsidian_pro' => [
            'amount' => 5500,
            'currency' => 'XAF',
            'name' => 'Obsidian Pro',
            'description' => 'Abonnement NexChat Obsidian Pro (1 mois)',
        ],
        'elite_digital' => [
            'amount' => 15000,
            'currency' => 'XAF',
            'name' => 'Elite Digital',
            'description' => 'Abonnement NexChat Elite Digital (1 mois)',
        ],
    ];

    public function __construct()
    {
        $this->apiUrl = config('services.notchpay.url', 'https://api.notchpay.co');
        $this->publicKey = config('services.notchpay.public_key');
        $this->secretKey = config('services.notchpay.secret_key');
        $this->webhookHash = config('services.notchpay.webhook_hash');
        $this->defaultCurrency = config('services.notchpay.currency', 'XAF');
    }

    /**
     * Initialize a payment and get the authorization URL for checkout.
     *
     * @param User $user The user subscribing
     * @param string $tier 'obsidian_pro' or 'elite_digital'
     * @param string $callbackUrl URL to redirect user after payment
     * @return array{success: bool, authorization_url?: string, reference?: string, error?: string}
     */
    public function initializePayment(User $user, string $tier, string $callbackUrl): array
    {
        if (!isset(self::TIER_PRICING[$tier])) {
            return ['success' => false, 'error' => 'Invalid subscription tier.'];
        }

        $tierInfo = self::TIER_PRICING[$tier];
        $reference = 'NEX_SUB_' . Str::upper(Str::random(20)) . '_' . time();

        try {
            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => $this->publicKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->post("{$this->apiUrl}/payments", [
                'amount' => $tierInfo['amount'],
                'currency' => $tierInfo['currency'],
                'email' => $user->email,
                'name' => $user->username,
                'description' => $tierInfo['description'],
                'reference' => $reference,
                'callback' => $callbackUrl,
            ]);

            $data = $response->json();

            Log::info('NotchPay: Initialize payment response', [
                'status' => $response->status(),
                'body' => $data,
            ]);

            if ($response->successful() && isset($data['authorization_url'])) {
                $trx = is_array($data['transaction'] ?? null) ? $data['transaction'] : [];
                $trxRef = $trx['reference'] ?? ($data['reference'] ?? $reference);

                return [
                    'success' => true,
                    'authorization_url' => $data['authorization_url'],
                    'reference' => $reference,
                    'transaction_reference' => $trxRef,
                ];
            }

            Log::error('NotchPay: Payment initialization failed', [
                'status' => $response->status(),
                'response' => $data,
                'user_id' => $user->id,
                'tier' => $tier,
            ]);

            return [
                'success' => false,
                'error' => $data['message'] ?? 'Payment initialization failed.',
            ];
        } catch (\Exception $e) {
            Log::error('NotchPay: Exception during payment initialization', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return ['success' => false, 'error' => 'Service de paiement temporairement indisponible.'];
        }
    }

    /**
     * Verify a payment transaction by its reference.
     *
     * @param string $reference The unique payment reference or NotchPay transaction reference
     * @return array{success: bool, data?: array, error?: string}
     */
    public function verifyPayment(string $reference): array
    {
        try {
            // NotchPay requires the public key for transaction retrieval
            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => $this->publicKey,
                'Accept' => 'application/json',
            ])->get("{$this->apiUrl}/payments/{$reference}");

            $data = $response->json();

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $data,
                ];
            }

            Log::error('NotchPay: Payment verification failed', [
                'status' => $response->status(),
                'response' => $data,
                'reference' => $reference,
            ]);

            return [
                'success' => false,
                'error' => $data['message'] ?? 'Payment verification failed.',
            ];
        } catch (\Exception $e) {
            Log::error('NotchPay: Exception during payment verification', [
                'error' => $e->getMessage(),
                'reference' => $reference,
            ]);

            return ['success' => false, 'error' => 'Unable to verify payment.'];
        }
    }

    /**
     * Verify the webhook signature using HMAC SHA-256.
     *
     * @param string $rawPayload The raw request body
     * @param string $signature The x-notch-signature header value
     * @return bool
     */
    public function verifyWebhookSignature(string $rawPayload, string $signature): bool
    {
        $expectedSignature = hash_hmac('sha256', $rawPayload, $this->webhookHash);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Get pricing info for a specific tier.
     */
    public function getTierPricing(string $tier): ?array
    {
        return self::TIER_PRICING[$tier] ?? null;
    }
}
