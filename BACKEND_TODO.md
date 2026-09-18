# ✅ Backend Roadmap & Suivi d'Avancement - NexChat (Laravel 11)

Ce document récapitule l'ensemble des modules du backend NexChat, de l'infrastructure initiale à la passerelle de paiement et la sécurité.

---

## 🛠️ Phase 1 : Setup & Infrastructure
- [X] Initialiser le projet Laravel 11 (`composer create-project laravel/laravel .`)
- [X] Configurer l'environnement `.env` (PostgreSQL Supabase, App Key, Mailer)
- [X] Installer les dépendances clés : `laravel/sanctum`, `laravel/reverb`, `guzzlehttp/guzzle`
- [X] Configuration de l'environnement d'exécution PHP 8.4 avec extensions (`pdo_pgsql`, `openssl`, `curl`, `mbstring`)

---

## 👤 Phase 2 : Authentification, Profils & Sécurité
- [X] Migration `users` avec `primary_language_code`, `subscription_tier`, `ai_words_translated_count`
- [X] Contrôleurs d'authentification (`LoginController`, `RegisterController`) avec tokens Sanctum
- [X] Validation d'email & réinitialisation de mot de passe
- [X] Recherche d'utilisateurs (`GET /api/users/search`)
- [X] Durcissement des politiques de sécurité Supabase RLS (Row-Level Security) sur `subscriptions`, `stories`, `nexchat-media` bucket

---

## 💬 Phase 3 : Messagerie & Médias
- [X] Migrations et modèles : `conversations`, `messages`, `groups`, `group_messages`
- [X] Upload de médias (images, vidéos, audio, fichiers) vers Supabase Storage
- [X] Gestion des stories éphémères (24h) avec `StoryController`
- [X] Accusés de lecture et historique paginé

---

## ⚡ Phase 4 : Temps Réel (Laravel Reverb WebSockets)
- [X] Installation et configuration de **Laravel Reverb** sur le port 8080
- [X] Événements de diffusion : `MessageSent`, `GroupMessageSent`, `MessagesRead`
- [X] Canaux privés sécurisés (`PrivateChannel`) pour conversations 1-à-1 et salons
- [X] Indicateurs de présence en ligne et de saisie ("typing...")

---

## 🤖 Phase 5 : Moteur IA & Traduction Proactive
- [X] Service `TranslationService` avec moteur **DeepL API** et fallback robuste
- [X] Traduction anticipée avant persistance et diffusion WebSocket
- [X] Quotas de mots traduits selon le plan d'abonnement (`canUseAiTranslation()`)
- [X] Intégration Google Gemini pour suggestions de réponses et reformulation de ton
- [X] Historique et phrases favorites (`AiSavedPhrase`)

---

## 💳 Phase 6 : Monétisation & Passerelle NotchPay
- [X] Migration de la table `subscriptions` (user_id, tier, notchpay_reference, notchpay_transaction_id, amount, currency, status, starts_at, expires_at)
- [X] Modèle Eloquent `Subscription` avec méthodes `activate()`, `isActive()`, `isExpired()`, scopes `active()`, `forTier()`
- [X] Service `NotchPayService` :
  - [X] Initialisation de paiement (`POST /payments` en XAF)
  - [X] Vérification de transaction (`GET /payments/{reference}` avec clé publique)
  - [X] Validation des signatures de Webhooks HMAC SHA-256 (`x-notch-signature`)
  - [X] Résolution du problème de certificat racine SSL cURL 60 sous Windows
- [X] Contrôleur `SubscriptionController` :
  - [X] `POST /api/subscription/initialize-public` (Paiement direct invité depuis la Landing Page)
  - [X] `POST /api/subscription/initialize` (Paiement pour utilisateur connecté)
  - [X] `GET /api/subscription/verify` (Vérification et activation avec auto-connexion)
  - [X] `GET /api/subscription/status` (Statut de l'abonnement et quota de mots en direct)
  - [X] `POST /api/webhooks/notchpay` (Écouteur asynchrone sécurisé des événements NotchPay)

---

## 🧪 Phase 7 : Tests & Déploiement
- [X] Tests unitaires et d'intégration de la connectivité Supabase
- [X] Validation des requêtes API NotchPay en environnement sandbox avec clés réelles
- [ ] Préparation du déploiement en production (Cloud Run / VPS / Forge)
- [ ] Configuration des queues en production (Redis / Database workers)
