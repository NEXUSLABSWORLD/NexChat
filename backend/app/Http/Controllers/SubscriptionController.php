<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Services\NotchPayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SubscriptionController extends Controller
{
    protected NotchPayService $notchPay;

    public function __construct(NotchPayService $notchPay)
    {
        $this->notchPay = $notchPay;
    }

    /**
     * Initialize payment for a guest / landing page visitor.
     * Finds or creates the user by email, initializes the NotchPay checkout,
     * and returns the authorization_url.
     *
     * POST /api/subscription/initialize-public
     */
    public function initializePublic(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
            'username' => 'nullable|string|max:50',
            'tier' => 'required|string|in:obsidian_pro,elite_digital',
            'callback_url' => 'required|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Veuillez renseigner une adresse email valide.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));
        $username = $request->input('username') ?: explode('@', $email)[0];
        $tier = $request->input('tier');
        $callbackUrl = $request->input('callback_url');

        // Find or create the user
        $user = \App\Models\User::firstOrCreate(
            ['email' => $email],
            [
                'username' => $username,
                'password_hash' => bcrypt(\Illuminate\Support\Str::random(16)),
                'primary_language_code' => 'fr',
                'subscription_tier' => 'free',
            ]
        );

        // Initialize payment with NotchPay
        $result = $this->notchPay->initializePayment($user, $tier, $callbackUrl);

        if (!$result['success']) {
            return response()->json([
                'message' => $result['error'],
            ], 500);
        }

        $tierPricing = $this->notchPay->getTierPricing($tier);

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'tier' => $tier,
            'notchpay_reference' => $result['reference'],
            'notchpay_transaction_id' => $result['transaction_reference'] ?? null,
            'amount' => $tierPricing['amount'],
            'currency' => $tierPricing['currency'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Paiement initialisé avec succès.',
            'authorization_url' => $result['authorization_url'],
            'reference' => $result['reference'],
            'transaction_reference' => $result['transaction_reference'] ?? null,
            'subscription_id' => $subscription->id,
        ]);
    }

    /**
     * Initialize a subscription payment.
     * Creates a pending subscription record and returns the NotchPay checkout URL.
     *
     * POST /api/subscription/initialize
     */
    public function initialize(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'tier' => 'required|string|in:obsidian_pro,elite_digital',
            'callback_url' => 'required|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $tier = $request->input('tier');
        $callbackUrl = $request->input('callback_url');

        // Check if user already has an active subscription for this tier
        $existingActive = $user->subscriptions()
            ->active()
            ->forTier($tier)
            ->first();

        if ($existingActive) {
            return response()->json([
                'message' => 'Vous avez déjà un abonnement actif pour ce forfait.',
                'subscription' => $existingActive,
            ], 409);
        }

        // Initialize payment with NotchPay
        $result = $this->notchPay->initializePayment($user, $tier, $callbackUrl);

        if (!$result['success']) {
            return response()->json([
                'message' => $result['error'],
            ], 500);
        }

        // Create a pending subscription record
        $tierPricing = $this->notchPay->getTierPricing($tier);

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'tier' => $tier,
            'notchpay_reference' => $result['reference'],
            'notchpay_transaction_id' => $result['transaction_reference'] ?? null,
            'amount' => $tierPricing['amount'],
            'currency' => $tierPricing['currency'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Paiement initialisé avec succès.',
            'authorization_url' => $result['authorization_url'],
            'reference' => $result['reference'],
            'transaction_reference' => $result['transaction_reference'] ?? null,
            'subscription_id' => $subscription->id,
        ]);
    }

    /**
     * Verify a payment after the user returns from NotchPay checkout.
     *
     * GET /api/subscription/verify?reference=NEX_SUB_xxx or ?reference=trx.xxx
     */
    public function verify(Request $request): JsonResponse
    {
        $reference = $request->query('reference') ?: $request->query('trxref');

        if (!$reference) {
            return response()->json(['message' => 'Référence de paiement manquante.'], 400);
        }

        $subscription = Subscription::where('notchpay_reference', $reference)
            ->orWhere('notchpay_transaction_id', $reference)
            ->first();

        if (!$subscription) {
            return response()->json(['message' => 'Abonnement introuvable.'], 404);
        }

        // Query NotchPay with the transaction reference (trx.xxx) if available, or reference
        $lookupRef = $subscription->notchpay_transaction_id ?: $reference;
        $result = $this->notchPay->verifyPayment($lookupRef);

        if (!$result['success']) {
            return response()->json([
                'message' => 'Impossible de vérifier le paiement.',
                'error' => $result['error'],
            ], 500);
        }

        $paymentData = $result['data'];
        $transactionStatus = $paymentData['transaction']['status'] ?? ($paymentData['status'] ?? 'unknown');

        if ($transactionStatus === 'complete' || $transactionStatus === 'successful') {
            // Payment succeeded — activate the subscription
            $subscription->update([
                'notchpay_transaction_id' => $paymentData['transaction']['id'] ?? ($paymentData['id'] ?? null),
                'payment_method' => $paymentData['transaction']['channel'] ?? ($paymentData['channel'] ?? null),
            ]);

            $subscription->activate(30); // 30 days

            $user = $subscription->user;
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Abonnement activé avec succès !',
                'status' => 'active',
                'tier' => $subscription->tier,
                'expires_at' => $subscription->expires_at->toISOString(),
                'token' => $token,
                'user' => $user,
            ]);
        }

        // Payment not yet complete or failed
        if ($transactionStatus === 'failed' || $transactionStatus === 'cancelled') {
            $subscription->update(['status' => 'failed']);
        }

        return response()->json([
            'message' => 'Le paiement n\'a pas abouti.',
            'status' => $transactionStatus,
        ], 402);
    }

    /**
     * Get the current subscription status for the authenticated user.
     *
     * GET /api/subscription/status
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeSub = $user->activeSubscription();

        return response()->json([
            'subscription_tier' => $user->subscription_tier ?? 'free',
            'has_active_subscription' => $activeSub !== null,
            'subscription' => $activeSub ? [
                'tier' => $activeSub->tier,
                'status' => $activeSub->status,
                'starts_at' => $activeSub->starts_at?->toISOString(),
                'expires_at' => $activeSub->expires_at?->toISOString(),
                'payment_method' => $activeSub->payment_method,
                'amount' => $activeSub->amount,
                'currency' => $activeSub->currency,
            ] : null,
            'ai_quota' => [
                'words_used' => $user->ai_words_translated_count ?? 0,
                'words_limit' => $user->hasActiveTier('obsidian_pro') ? null : 5000,
                'can_translate' => $user->canUseAiTranslation(),
            ],
        ]);
    }

    /**
     * Handle NotchPay webhook notifications.
     * This route is PUBLIC (no auth:sanctum) but secured via HMAC signature.
     *
     * POST /api/webhooks/notchpay
     */
    public function webhook(Request $request): JsonResponse
    {
        $signature = $request->header('x-notch-signature', '');
        $rawPayload = $request->getContent();

        // Verify HMAC SHA-256 signature
        if (!$this->notchPay->verifyWebhookSignature($rawPayload, $signature)) {
            Log::warning('NotchPay Webhook: Invalid signature', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'Invalid signature.'], 403);
        }

        $payload = json_decode($rawPayload, true);
        $event = $payload['event'] ?? $payload['type'] ?? 'unknown';
        $data = $payload['data'] ?? $payload;

        Log::info('NotchPay Webhook received', ['event' => $event, 'reference' => $data['reference'] ?? 'N/A']);

        switch ($event) {
            case 'payment.complete':
            case 'payment.successful':
                $this->handlePaymentComplete($data);
                break;

            case 'payment.failed':
            case 'payment.cancelled':
                $this->handlePaymentFailed($data);
                break;

            default:
                Log::info('NotchPay Webhook: Unhandled event', ['event' => $event]);
                break;
        }

        return response()->json(['status' => 'ok'], 200);
    }

    /**
     * Handle a completed payment event from webhook.
     */
    protected function handlePaymentComplete(array $data): void
    {
        $reference = $data['reference'] ?? null;

        if (!$reference) {
            Log::error('NotchPay Webhook: Missing reference in payment.complete');
            return;
        }

        $subscription = Subscription::where('notchpay_reference', $reference)->first();

        if (!$subscription) {
            Log::warning('NotchPay Webhook: Subscription not found', ['reference' => $reference]);
            return;
        }

        if ($subscription->status === 'active') {
            Log::info('NotchPay Webhook: Subscription already active', ['reference' => $reference]);
            return;
        }

        // Verify the transaction amount server-side
        $verifyResult = $this->notchPay->verifyPayment($reference);

        if (!$verifyResult['success']) {
            Log::error('NotchPay Webhook: Verification failed', ['reference' => $reference]);
            return;
        }

        $subscription->update([
            'notchpay_transaction_id' => $data['id'] ?? null,
            'payment_method' => $data['channel'] ?? null,
        ]);

        $subscription->activate(30);

        Log::info('NotchPay Webhook: Subscription activated', [
            'user_id' => $subscription->user_id,
            'tier' => $subscription->tier,
            'reference' => $reference,
        ]);
    }

    /**
     * Handle a failed payment event from webhook.
     */
    protected function handlePaymentFailed(array $data): void
    {
        $reference = $data['reference'] ?? null;

        if (!$reference) {
            return;
        }

        $subscription = Subscription::where('notchpay_reference', $reference)->first();

        if ($subscription && $subscription->status === 'pending') {
            $subscription->update(['status' => 'failed']);

            Log::info('NotchPay Webhook: Payment failed', [
                'user_id' => $subscription->user_id,
                'reference' => $reference,
            ]);
        }
    }
}
