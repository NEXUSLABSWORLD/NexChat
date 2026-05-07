# ✅ Backend TODO List - LinguChat (Laravel)

Ce document liste toutes les tâches nécessaires pour implémenter le backend de LinguChat, de l'infrastructure à l'intégration de l'IA.

---

## 🛠️ Phase 1 : Setup & Infrastructure
- [ ] Initialiser le projet Laravel 11 (`composer create-project laravel/laravel .`)
- [ ] Configurer le fichier `.env` (Base de données, App URL)
- [ ] Installer les dépendances essentielles :
    - [ ] `laravel/sanctum` ou `passport` pour l'API Auth
    - [ ] `spatie/laravel-permission` (si nécessaire pour les rôles)
    - [ ] `guzzlehttp/guzzle` pour les appels API Traduction
- [ ] Configurer la base de données (PostgreSQL recommandé pour les gros volumes de chat)

---

## 👤 Phase 2 : Authentification & Utilisateurs
- [ ] Créer la migration pour `users` (Ajouter le champ `primary_language_code`)
- [ ] Créer les contrôleurs d'authentification (Register, Login, Logout)
- [ ] Implémenter l'endpoint `GET /api/user` pour récupérer le profil
- [ ] Implémenter l'endpoint `PUT /api/user/profile` pour mettre à jour la langue principale
- [ ] Créer une recherche d'utilisateurs (`GET /api/users/search?query=...`) pour démarrer une conversation

---

## 💬 Phase 3 : Structure de Messagerie
- [ ] Créer les migrations :
    - [ ] `conversations` (id, user_one_id, user_two_id, last_message_at)
    - [ ] `messages` (id, conversation_id, sender_id, content_original, content_translated, source_lang, target_lang, is_read)
- [ ] Définir les relations Eloquent dans les modèles `User`, `Conversation`, `Message`
- [ ] Créer les contrôleurs :
    - [ ] `ConversationController` (Liste des chats, Création de chat)
    - [ ] `MessageController` (Envoi de message, Historique)

---

## ⚡ Phase 4 : Temps Réel (WebSockets)
- [ ] Installer et configurer **Laravel Reverb** (recommandé pour Laravel 11) ou Pusher
- [ ] Créer l'événement `MessageSent` pour la diffusion en temps réel
- [ ] Configurer les canaux privés (`PrivateChannel`) pour la sécurité des conversations
- [ ] Implémenter les indicateurs de présence ("Online/Offline") et de saisie ("Typing")

---

## 🤖 Phase 5 : Moteur de Traduction IA
- [ ] Créer un Service Laravel `TranslationService` :
    - [ ] Intégrer l'API (DeepL, Google Translate ou LibreTranslate)
    - [ ] Méthode `detectLanguage($text)`
    - [ ] Méthode `translate($text, $targetLang)`
- [ ] **Logique de Traduction Anticipée** :
    - [ ] Dans la méthode `store` du `MessageController` :
        1. Identifier la langue du destinataire.
        2. Appeler le `TranslationService` avant de sauvegarder.
        3. Sauvegarder les deux versions (Original + Traduit).
- [ ] Mettre en place un système de cache pour les phrases répétitives (optionnel mais recommandé)

---

## 🧪 Phase 6 : Optimisation & Tests
- [ ] Créer des tests unitaires pour le `TranslationService`
- [ ] Tester la performance des WebSockets sous charge
- [ ] Documenter l'API (Swagger ou Postman Collection)
- [ ] Optimiser les requêtes SQL (Eager loading pour éviter le problème N+1 sur les messages)

---

## 🚀 Phase 7 : Déploiement
- [ ] Configurer les Workers Laravel pour les tâches asynchrones (si nécessaire)
- [ ] Préparer les scripts de déploiement (CI/CD)
