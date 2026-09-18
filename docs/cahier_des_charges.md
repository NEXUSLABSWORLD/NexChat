# Cahier des Charges : Application LinguChat

**Projet** : Développement d'une application web de chat intelligente avec traduction automatique.  
**Équipe** : Binôme (2 personnes).  
**Date** : 7 Mai 2026

## 1. Présentation du Projet
LinguChat est une plateforme de messagerie instantanée conçue pour supprimer les barrières linguistiques. Contrairement aux applications classiques, LinguChat propose une "traduction anticipée". Le message est traduit dans la langue préférée du destinataire avant même que celui-ci ne le reçoive, garantissant une fluidité maximale dans les échanges internationaux.

## 2. Objectifs et Innovations
- **Accessibilité** : Permettre à deux personnes ne parlant pas la même langue de discuter naturellement.
- **Innovation** : Traduction proactive basée sur les préférences du destinataire (langue principale définie dans le profil).
- **Expérience Utilisateur** : Interface moderne inspirée de Telegram avec support du temps réel.

## 3. Spécifications Fonctionnelles
### 3.1. Gestion des Utilisateurs
| Fonctionnalité | Description |
| :--- | :--- |
| **Authentification** | Inscription et connexion sécurisée (Email/Mot de passe). |
| **Profil Utilisateur** | Gestion des informations personnelles et sélection de la Langue Principale (champ obligatoire). |
| **Recherche** | Trouver d'autres utilisateurs par nom ou email pour démarrer un chat. |

### 3.2. Système de Messagerie
- **Chat Temps Réel** : Envoi et réception de messages instantanés via WebSockets.
- **Indicateurs** : Statut de présence (En ligne/Hors ligne) et indicateur de saisie.
- **Traduction Automatique** :
    - Détection de la langue de l'expéditeur.
    - Traduction vers la langue cible du destinataire.
    - Affichage optionnel du texte original pour vérification.

## 4. Architecture Technique
### 4.1. Stack Technologique
- **Frontend** : React.js ou Vue.js.
- **Backend** : Node.js (Express) ou Laravel.
- **Communication** : Socket.io pour le temps réel.
- **Base de Données** : PostgreSQL ou MongoDB.
- **Intelligence Artificielle** : API DeepL, Google Translate ou LibreTranslate.

### 4.2. Modèle de Données
- **Users** : `id, username, email, password_hash, primary_language_code`
- **Conversations** : `id, user_one_id, user_two_id, last_message_at`
- **Messages** : `id, conversation_id, sender_id, content_original, content_translated, source_lang, target_lang, is_read`

## 5. Plan de Développement
1. **Phase 1** : Setup & Infrastructure.
2. **Phase 2** : Authentification & Profils.
3. **Phase 3** : Messagerie de Base.
4. **Phase 4** : Intégration de l'IA.
5. **Phase 5** : Interface Utilisateur (UI/UX).
6. **Phase 6** : Tests & Déploiement.

## 6. Contraintes
Le système doit gérer la latence induite par l'appel aux API de traduction. Il est recommandé de stocker les traductions en base de données pour optimiser les performances.
