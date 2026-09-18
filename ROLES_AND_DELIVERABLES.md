# 📋 Planification du Projet LinguChat

Ce document définit les rôles, les actions et les livrables pour chaque phase du projet, afin de faciliter la collaboration entre les deux développeurs.

---

## 👥 Rôles et Responsabilités

### 🏗️ Développeur Backend (Laravel)
- **Responsable** : [Nom du Collègue 1]
- **Technologies** : Laravel 11+, PostgreSQL/MySQL, Socket.io (via Laravel Echo/Reverb), API de Traduction (DeepL/Google).
- **Focus** : Architecture API, Sécurité, Gestion de la base de données, Intégration IA.

### 🎨 Développeur Frontend (React)
- **Responsable** : [Nom du Collègue 2]
- **Technologies** : React.js, Vite, Tailwind CSS (ou CSS pur), Socket.io-client.
- **Focus** : Interface Utilisateur (UI), Expérience Utilisateur (UX), Consommation d'API, Temps réel.

---

## 📅 Phases de Développement

### Phase 1 : Setup & Infrastructure
| Rôle | Actions | Livrables |
| :--- | :--- | :--- |
| **Backend** | Configuration Laravel, Setup de la DB, Création des migrations. | Dépôt Laravel prêt, Schéma de base de données validé. |
| **Frontend** | Initialisation React, Configuration de Tailwind/Design System. | Squelette de l'application, Page d'accueil statique. |

### Phase 2 : Authentification & Profils
| Rôle | Actions | Livrables |
| :--- | :--- | :--- |
| **Backend** | API Auth (Sanctum/JWT), CRUD Profil, Gestion du champ `primary_language_code`. | Endpoints Login/Register/Profile. |
| **Frontend** | Formulaires d'inscription/connexion, Page de gestion du profil. | UI de connexion fonctionnelle avec stockage du token. |

### Phase 3 : Messagerie de Base
| Rôle | Actions | Livrables |
| :--- | :--- | :--- |
| **Backend** | Setup de Laravel Echo ou Socket.io, Création des routes de messagerie. | Serveur de messages fonctionnel (envoi/recepetion simple). |
| **Frontend** | Intégration de Socket.io-client, Interface de chat (liste des conversations). | Chat temps réel basique (sans traduction). |

### Phase 4 : Intégration de l'IA (Traduction Anticipée)
| Rôle | Actions | Livrables |
| :--- | :--- | :--- |
| **Backend** | Liaison avec l'API de traduction, Logique de traduction proactive avant sauvegarde. | Messages stockés avec versions originale et traduite. |
| **Frontend** | Affichage des messages traduits, Option pour voir l'original au survol/clic. | UI de chat avec support multi-langues. |

### Phase 5 : Interface Utilisateur (UI/UX Premium)
| Rôle | Actions | Livrables |
| :--- | :--- | :--- |
| **Backend** | Optimisation des réponses API, Indicateurs de saisie ("typing..."). | WebSocket events pour les statuts de présence. |
| **Frontend** | Design moderne (Style Telegram), Micro-animations, Dark Mode. | Application fluide, esthétique et responsive. |

### Phase 6 : Tests & Déploiement
| Rôle | Actions | Livrables |
| :--- | :--- | :--- |
| **Backend** | Tests unitaires des traductions, Optimisation de la latence DB. | API robuste et rapide. |
| **Frontend** | Tests de compatibilité navigateurs, Optimisation du bundle. | Application déployée (Vercel/Netlify/Heroku). |

---

## 🛠️ Flux de Travail (Workflow Git)
1. **Branche `backend`** : Toutes les modifications Laravel sont poussées ici.
2. **Branche `frontend`** : Toutes les modifications React sont poussées ici.
3. **Réunions** : Synchronisation hebdomadaire pour valider les contrats d'interface (JSON formats).
