# 🏗️ Architecture Technique - LinguChat

Ce document détaille les flux de données et l'organisation technique pour assurer la "traduction anticipée" avec une latence minimale.

---

## 🛰️ Flux de Messagerie (Real-time Pipeline)

1. **Envoi** : L'expéditeur envoie un message JSON via WebSocket.
   ```json
   { "sender_id": 1, "conversation_id": 10, "content": "Hello, how are you?" }
   ```
2. **Réception & Détection** : Le serveur Laravel reçoit le message et détecte la langue source (ex: English).
3. **Traduction Proactive** :
   - Le serveur identifie la langue cible du destinataire (ex: Français) via son profil.
   - Appel asynchrone à l'API de traduction (DeepL/Google).
4. **Persistance** : Sauvegarde en base de données des deux versions.
5. **Diffusion** : Envoi du message traduit au destinataire via WebSocket.
   ```json
   { "id": 101, "sender_id": 1, "content_translated": "Bonjour, comment allez-vous ?", "content_original": "Hello, how are you?", "source_lang": "en", "target_lang": "fr" }
   ```

---

## 🗄️ Schéma de Base de Données (Détails)

### Table `users`
- `primary_language_code` : Code ISO (ex: 'fr', 'en', 'es'). Indexé pour des recherches rapides.

### Table `messages`
- `content_original` : Texte brut envoyé.
- `content_translated` : Texte traduit par l'IA.
- `source_lang` : Langue détectée.
- `target_lang` : Langue du destinataire au moment de l'envoi.

---

## ⚡ Gestion de la Latence
Pour éviter que l'utilisateur ne sente la latence de l'API de traduction :
- **Optimisation Backend** : Utilisation de **Laravel Queues** (Redis) pour traiter la traduction en arrière-plan si nécessaire, bien que pour une fluidité "temps réel", un appel bloquant très court ou un événement "message_translating" peut être envoyé.
- **Cache** : Mise en cache des traductions pour les phrases fréquentes.
- **Optimisation Frontend** : Affichage d'un indicateur de réception immédiat, puis mise à jour du contenu dès que la traduction arrive (si non instantanée).

---

## 🛠️ Outils Recommandés
- **Backend** : Laravel 11, Laravel Reverb (pour les WebSockets sans Node.js externe), Spatie Translatable (optionnel).
- **IA** : Client SDK pour DeepL ou Google Cloud Translate.
- **Frontend** : Axios, Socket.io-client, Framer Motion (pour les animations de chat).
