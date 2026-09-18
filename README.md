# NexChat v2.0 🌍💬⚡

**NexChat** est une plateforme de messagerie instantanée intelligente et multilingue, propulsée par l'Intelligence Artificielle (DeepL & Google Gemini) et dotée d'un système d'abonnements et de monétisation complet via **NotchPay**.

---

## 🚀 Le Concept : Traduction Proactive & Anticipée
Contrairement aux applications classiques où l'utilisateur doit manuellement traduire chaque message, NexChat détecte la langue de l'expéditeur et traduit le message dans la langue préférée du destinataire **avant même** sa livraison en temps réel via WebSockets.

---

## ✨ Fonctionnalités Principales

### 💬 Messagerie & Réseau
- **Messagerie Instantanée Temps Réel** : Communication ultra-rapide via **Laravel Reverb (WebSockets)**.
- **Traduction Anticipée par IA** : Traduction proactive bidirectionnelle motorisée par **DeepL API** avec bascule de secours.
- **Support Média & Pièces Jointes** : Partage d'images, vidéos, notes vocales et documents stockés sur **Supabase Storage**.
- **Stories & Statuts Éphémères** : Publication et visualisation de stories avec expiration 24h.
- **Discussions de Groupe & Salons** : Gestion complète des salons avec participants et rôles.
- **Indicateurs Temps Réel** : Présence (En ligne / Hors ligne), accusés de lecture et indicateurs de frappe ("en train d'écrire...").

### 🧠 Intelligence Artificielle & Outils
- **Assistant & Suggestions IA** : Suggestions de réponses contextuelles et reformulation de ton (Gemini).
- **Tableau de Bord IA (AiDashboard)** : Suivi en direct du quota de mots traduits, historique et phrases sauvegardées.

### 💳 Monétisation & Abonnements (NotchPay)
- **Passerelle de Paiement NotchPay** : Intégration complète Mobile Money (MTN, Orange Money) et Cartes Bancaires en **FCFA (XAF)**.
- **Tunnel de Paiement Visiteur (Guest Checkout)** : Achat direct depuis la Landing Page sans inscription préalable obligatoire (création automatique du compte et token de connexion immédiat après paiement).
- **Webhooks & Sécurité HMAC** : Vérification cryptographique SHA-256 (`x-notch-signature`) pour l'activation instantanée et infalsifiable.
- **Grille Tarifaire** :
  - **Gratuit (Free)** : 5 000 mots IA/mois.
  - **Obsidian Pro** : `5 500 FCFA/mois` (~8,99 €) — Traduction illimitée, audio haute qualité.
  - **Elite Digital** : `15 000 FCFA/mois` (~24,99 €) — Tous les accès IA prioritaires, support VIP.

---

## 🛠️ Stack Technologique

### Frontend
- **Framework** : React 19 + Vite
- **Styling** : CSS Moderne personnalisé avec design Glassmorphism sombre et Tailwind CSS
- **Temps Réel** : Laravel Echo & Pusher JS (connectés au serveur Reverb)
- **Icônes** : Lucide React

### Backend & Infrastructure
- **Framework** : Laravel 13 (PHP 8.3+ ; PHP 8.4 recommandé)
- **Base de Données** : PostgreSQL via **Supabase Cloud** (avec politiques de sécurité Row-Level Security durcies)
- **Serveur WebSockets** : **Laravel Reverb** (haute performance, natif PHP)
- **Paiements** : **NotchPay API** (initialisation, vérification et webhooks)
- **APIs IA** : DeepL API + Google Gemini API

---

## 🏃 Démarrage Rapide

### Prérequis

- PHP 8.3 ou supérieur avec Composer
- Node.js 24 ou supérieur avec npm
- Une configuration Supabase et les services tiers nécessaires pour les fonctionnalités concernées

### 1. Préparer le backend
```bash
cd backend
composer install
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
php artisan key:generate
php artisan serve --port=8000
# Dans un autre terminal :
php artisan reverb:start --port=8080
```

Renseigner ensuite les variables Supabase, IA, paiement et messagerie dans `backend/.env` selon l'environnement. Pour activer les e-mails de vérification avec Gmail, utiliser une adresse Gmail avec la double authentification activée et un **mot de passe d'application** :

```env
VITE_APP_URL=http://localhost:5173
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USERNAME=votre-adresse@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-d-application
MAIL_FROM_ADDRESS=votre-adresse@gmail.com
MAIL_FROM_NAME=NexChat
```

Ne pas utiliser le mot de passe Gmail habituel et ne jamais versionner `backend/.env`.

### 2. Préparer le frontend (React + Vite)
```bash
cd frontend
npm ci
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

Le frontend utilise `frontend/.env.example` comme modèle. Copier ce fichier en `frontend/.env` et adapter `VITE_API_URL` si nécessaire. Ne jamais versionner ce fichier.

### 3. Vérifications

```bash
cd backend
php artisan route:list --path=api
php artisan test

cd ../frontend
npm run build
```

Les tests Supabase distants sont opt-in et nécessitent `TEST_SUPABASE_CONNECTION=true`.

---

## 🔒 Sécurité & Bonnes Pratiques
- Authentification par jetons sécurisés **Laravel Sanctum**.
- Row-Level Security (RLS) activé sur les tables critiques Supabase (`subscriptions`, `stories`, `messages`).
- Bucket de stockage sécurisé avec politiques de restriction.
- Validation rigoureuse des signatures HMAC SHA-256 pour tous les événements de paiement NotchPay.
