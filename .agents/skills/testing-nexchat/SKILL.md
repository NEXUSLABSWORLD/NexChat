---
name: testing-nexchat
description: Test NexChat end-to-end (frontend Vite + backend Laravel + Supabase). Use when verifying auth, profile, search, or UI/UX changes on this repo.
---

# Testing NexChat

NexChat = monorepo avec 2 branches separees :
- `frontend` (React 19 + Vite, dossier `frontend/`)
- `backend` (Laravel 13.7, dossier `backend/` sur la branche backend uniquement)

Le frontend et le backend sont sur 2 branches differentes du meme repo (pas une mono-arbo). Pour tester end-to-end il faut clone et checkout des deux.

## Setup local

```bash
# Backend Laravel
git clone https://github.com/NEXUSLABSWORLD/NexChat.git NexChat-backend
cd NexChat-backend && git checkout backend && cd backend
composer install
cp .env.example .env  # ajoute SUPABASE_URL et SUPABASE_ANON_KEY si test cote succes
php artisan key:generate
touch database/database.sqlite
php artisan migrate --force
# Seed un user pour pouvoir login direct :
php artisan tinker --execute="App\\Models\\User::create(['username'=>'sam_test','email'=>'sam@test.local','password'=>bcrypt('password123'),'primary_language_code'=>'fr']);"
php artisan serve --host=127.0.0.1 --port=8000 &

# Frontend Vite
cd /path/to/NexChat/frontend
npm ci
echo 'VITE_API_URL=http://localhost:8000/api' > .env.local
npm run dev -- --host 127.0.0.1 --port 5173 &
```

User seed : `sam@test.local` / `password123` (en SQLite). C est suffisant pour tester le flow auth complet sans Supabase.

## Bugs backend connus (sur la branche backend, pas la PR frontend)

A garder en tete quand un test cote front semble echouer — la cause peut etre cote backend :

1. **Supabase RLS** : la cle anon ne peut pas INSERT dans `users`. `register` retourne 500 « new row violates row-level security policy ». Fix backend : utiliser `SUPABASE_SERVICE_ROLE_KEY` ou ajouter une RLS policy INSERT.
2. **Datastore split** : `LoginController` lit/ecrit SQLite, `ProfileController` lit/ecrit Supabase. Donc apres login SQLite, `GET /profile/show` ou `PUT /profile/update` ne trouve pas le bon user → 404 ou swap d identite silencieux (le frontend affiche le mauvais user). Symptome cote front : changer la langue change aussi le nom/email affiche. Fix backend : choisir un seul datastore et l utiliser partout.
3. **Guard manquant** : `$existing[0]` sans verif que `$existing` n est pas vide → 500 « Undefined array key 0 » dans `ProfileController::update`.
4. **TypeError** : `backend/app/Http/Controllers/ProfileController.php` passe `$request->query` (InputBag object) au service au lieu de `$request->query('query')`.

Quand tu testes la PR frontend, **teste le rollback/erreur cote front** plutot que le succes complet pour ces 4 chemins. C est ce qui prouve que le frontend envoie le bon endpoint avec le bon payload, et qu il sait reagir aux erreurs.

## Strategie de test UI (frontend)

Le frontend a une UI Telegram-inspired (refonte de PR #3) avec des animations subtiles. Pour tester sans regression visuelle, viser des assertions qui **echouent visiblement si la CSS regresse** :

- **Segmented control Connexion/Inscription** : l indicator (pill blanc) doit glisser avec `translateX` (data-mode sur le parent). Broken state = indicator statique.
- **Bandeau d erreur** : doit shake horizontalement a l apparition (`@keyframes shake`). Broken state = bandeau statique.
- **Bulles message** : doivent avoir des **tails asymetriques** (`::before` avec `clip-path: path(...)`). Broken state = rectangles arrondis symetriques.
- **Send button** : disabled+grise quand input vide, gradient+glow quand texte, **anime pulse au clic** (key change qui re-monte le composant → `@keyframes sendPop`).
- **Popover langue** : custom (pas le `<select>` natif systeme), avec check icon sur l item selectionne.
- **Dark mode** : tokens dedies, pas un simple `filter: invert()`. Bulles `mine` gardent leur gradient + glow.
- **Presence dot** : doit pulser (`::after` + `@keyframes pulse`).
- **Indicateur de saisie** : bulle separee (pas une ligne de texte plate).

## Flow de test recommande

1. Lancer backend + frontend.
2. Auth :
   - Cliquer Inscription → l indicator du segmented doit glisser visiblement.
   - Revenir a Connexion.
   - Login avec `sam@test.local` / `wrongpass` → bandeau `Invalid credentials` + shake.
   - Login avec `sam@test.local` / `password123` → bascule sur le chat.
3. Chat :
   - Verifier les tails des bulles (zoom sur la zone).
   - Verifier la typing bubble.
   - Verifier le send button disabled, puis active apres texte, puis pulse a l envoi.
4. Profile :
   - Cliquer le chip langue → popover custom doit s ouvrir avec 6 langues + check sur FR.
   - Cliquer EN → chip met a jour. (Cote backend, attention au swap d identite — bug #2.)
5. Dark mode :
   - Toggle sun/moon en haut a droite de la sidebar.
   - Verifier que les bulles `mine` gardent leur gradient.

Recording recommande pour les anims (segmented slide, send pulse, presence dot pulse, error shake) — ces transitions ne sont pas capturables en screenshot statique.

## Devin Secrets Needed

- `SUPABASE_URL` (user scope) : pour le `backend/.env`, necessaire si on veut tester register / search / update cote succes complet.
- `SUPABASE_ANON_KEY` (user scope) : meme chose.

Sans ces deux, on peut quand meme tester :
- Login (SQLite, suffit)
- Logout (SQLite)
- Recherche cote payload (le request part avec le bon endpoint et le bon body)
- Update langue cote payload + rollback

Mais pas le succes complet de register / search / update.

## Commandes utiles

```bash
# Login direct en curl (bypass UI, utile pour debug)
curl -X POST http://127.0.0.1:8000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"sam@test.local","password":"password123"}'

# Verifier que les deux serveurs sont up
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5173
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/api/auth/login -X POST

# Lint + build frontend
cd frontend && npm run lint && npm run build
```

## Reminders

- Le frontend stocke `nexchat_token` et `nexchat_user` en localStorage. Pour reset l etat, vider localStorage dans Chrome DevTools.
- Le backend SQLite est dans `backend/database/database.sqlite`. Supprimer + re-migrer pour reset.
- Ne PAS commit `backend/.env` (contient les cles Supabase).
