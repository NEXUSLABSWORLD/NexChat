# 🏗️ Architecture Technique - NexChat v2.0

Ce document détaille l'organisation technique, les flux de données et les pipelines d'intégration de **NexChat v2.0**.

---

## 1. 🛰️ Pipeline de Messagerie Temps Réel (Traduction Anticipée)

```
[Utilisateur A] --(POST /api/messages)--> [Laravel 11 Backend]
                                                │
                                                ├─► Détection Langue Source (ex: Anglais)
                                                ├─► Récupération Langue Cible Destinataire (ex: Français)
                                                ├─► Vérification Quota d'Abonnement IA ($user->canUseAiTranslation())
                                                ├─► Appel DeepL API (traduction anticipée)
                                                ├─► Persistance PostgreSQL (Supabase)
                                                │
                                                ▼
                                         [Laravel Reverb]
                                                │ (WebSocket PrivateChannel)
                                                ▼
                                         [Utilisateur B] (Reçoit le message déjà traduit !)
```

---

## 2. 💳 Pipeline de Paiement & Monétisation (NotchPay)

NexChat supporte deux parcours de souscription :

### A. Flux Invité (Direct depuis la Landing Page)
1. **Sélection du forfait** : Le visiteur clique sur un bouton de forfait sur la Landing Page (`SubscriptionModal`).
2. **Saisie Email** : Le visiteur renseigne son adresse e-mail.
3. **Appel API** : `POST /api/subscription/initialize-public`
   - Le backend crée automatiquement le compte utilisateur (`User::firstOrCreate`).
   - Le backend initialise le paiement auprès de NotchPay (`POST https://api.notchpay.co/payments`).
   - Une entrée `pending` est insérée dans la table `subscriptions` avec la référence marchande (`NEX_SUB_...`) et l'ID de transaction NotchPay (`trx.test_...`).
4. **Redirection Checkout** : L'utilisateur est redirigé vers la page sécurisée NotchPay (`authorization_url`).
5. **Paiement Mobile Money / Carte** : L'utilisateur valide son paiement sur NotchPay.
6. **Retour Callback & Auto-connexion** : NotchPay redirige vers `http://localhost:5173/payment/callback?reference=...`.
   - La page `PaymentCallback.jsx` appelle `GET /api/subscription/verify?reference=...`.
   - Le backend vérifie le statut auprès de l'API NotchPay avec la clé publique.
   - Si validé : l'abonnement passe en statut `active` pour 30 jours, `users.subscription_tier` est mis à jour, et un jeton Sanctum est généré.
   - Le client React stocke le jeton et redirige immédiatement l'utilisateur connecté vers son tableau de bord !

### B. Flux Utilisateur Connecté
- Appel direct à `POST /api/subscription/initialize` avec token Sanctum.
- Même cycle de redirection et vérification.

### C. Webhooks Asynchrones (Sécurité HMAC)
- NotchPay notifie l'URL publique `POST /api/webhooks/notchpay`.
- Le middleware/contrôleur valide l'en-tête `x-notch-signature` en recalculant `hash_hmac('sha256', $rawPayload, $webhookHash)`.
- En cas d'événement `payment.complete`, l'abonnement est activé même si l'utilisateur a fermé son navigateur pendant la redirection.

---

## 3. 🗄️ Schéma de Base de Données

### `users`
- `id`, `username`, `email`, `password_hash`, `primary_language_code`
- `subscription_tier` : `free`, `obsidian_pro`, `elite_digital`
- `ai_words_translated_count` : Compteur de mots traduits consommés.

### `subscriptions`
- `id`, `user_id` (FK users)
- `tier` (`obsidian_pro`, `elite_digital`)
- `notchpay_reference` (ex: `NEX_SUB_...`)
- `notchpay_transaction_id` (ex: `trx.test_...`)
- `amount` (ex: `5500`, `15000`)
- `currency` (`XAF`)
- `status` (`pending`, `active`, `failed`, `expired`, `cancelled`)
- `payment_method` (`cm.mtn`, `cm.orange`, `card`, etc.)
- `starts_at`, `expires_at`, `cancelled_at`

### `conversations` & `messages`
- `content_original`, `content_translated`, `source_lang`, `target_lang`, `media_url`, `media_type`

---

## 4. 🛡️ Sécurité & Row-Level Security (RLS)
- Supabase PostgreSQL avec **RLS activé** sur `subscriptions`, `stories`, `messages`.
- Bucket `nexchat-media` sécurisé avec accès public restreint aux objets autorisés.
- Chiffrement des communications HTTP client sans vérification d'échec local sous Windows grâce au fix cURL SSL 60.
