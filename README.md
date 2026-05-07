# LinguChat 🌍💬

LinguChat est une plateforme de messagerie instantanée intelligente conçue pour supprimer les barrières linguistiques grâce à une "traduction anticipée".

## 🚀 Le Concept : Traduction Anticipée
Contrairement aux applications classiques, LinguChat traduit les messages dans la langue préférée du destinataire **avant même** que celui-ci ne le reçoive. Cela garantit une fluidité maximale dans les échanges internationaux, sans interruption pour cliquer sur un bouton de traduction.

## ✨ Fonctionnalités Clés
- **Authentification Sécurisée** : Inscription et connexion (Email/Mot de passe).
- **Profil Personnalisé** : Choix obligatoire d'une langue principale.
- **Messagerie en Temps Réel** : Communication instantanée via WebSockets (Socket.io).
- **Traduction Automatique IA** : Détection de la langue source et traduction proactive vers la langue cible.
- **Indicateurs de Présence** : Statut en ligne/hors ligne et indicateur de saisie ("typing...").
- **Historique de Traduction** : Stockage des versions originales et traduites en base de données.

## 🛠 Stack Technologique
- **Frontend** : React.js (Vite)
- **Backend** : Node.js (Express)
- **Temps Réel** : Socket.io
- **Base de Données** : PostgreSQL / MongoDB
- **IA/Traduction** : API DeepL / Google Translate / LibreTranslate

## 📊 Modèle de Données
### Utilisateurs (Users)
- `id`, `username`, `email`, `password_hash`, `primary_language_code`
### Conversations
- `id`, `user_one_id`, `user_two_id`, `last_message_at`
### Messages
- `id`, `conversation_id`, `sender_id`, `content_original`, `content_translated`, `source_lang`, `target_lang`, `is_read`

## 🗺 Roadmap de Développement
1. **Phase 1 : Setup & Infrastructure** (Git, Environnement, Base de données).
2. **Phase 2 : Authentification & Profils** (Gestion de la langue de l'utilisateur).
3. **Phase 3 : Messagerie de Base** (Sockets, Envoi de texte simple).
4. **Phase 4 : Intégration de l'IA** (Moteur de traduction côté serveur).
5. **Phase 5 : Interface Utilisateur (UI/UX)** (Design moderne type Telegram).
6. **Phase 6 : Tests & Déploiement** (Optimisation de la latence).

## 👥 Équipe
- **Backend & DevOps** : @[Collègue]
- **Frontend & UI/UX** : @[Collègue]

---
*Projet développé dans le cadre du binôme - 7 Mai 2026*
