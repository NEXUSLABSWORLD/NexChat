---
name: testing-nexchat
description: Set up and test the NexChat frontend (React/Vite) against the Laravel backend (branche `backend`). Use this when verifying any change to the frontend API layer, auth flow, profile UI, or search; or when running the backend locally to integration-test.
---

# Testing NexChat

## Architecture (important)

Le projet est split sur 2 branches : `frontend` (React/Vite + axios) et `backend` (Laravel 13). Le frontend tape `http://localhost:8000/api` via la variable d env `VITE_API_URL`.

**Inconsistance datastore connue cote backend** : `LoginController` lit/ecrit en SQLite local (Eloquent `User` model), mais `RegisterController` + `ProfileController` utilisent `SupabaseUserService` (REST Supabase). Les deux datastores ne se voient pas. Un utilisateur cree via register Supabase ne pourra pas se login en SQLite et vice-versa. Tant que ce n est pas reconciliable cote backend, tester le chemin succes complet est impossible.

## Setup local

### Backend (branche `backend`)

1. Installer PHP 8.4 (le `composer.lock` du backend requiert symfony 8.x qui exige PHP 8.4) :
   ```bash
   sudo add-apt-repository -y ppa:ondrej/php
   sudo apt-get update
   sudo apt-get install -y php8.4-cli php8.4-mbstring php8.4-xml php8.4-curl php8.4-sqlite3 php8.4-tokenizer php8.4-fileinfo php8.4-bcmath
   sudo update-alternatives --set php /usr/bin/php8.4
   ```
2. Composer (s il n est pas deja la) :
   ```bash
   curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
   ```
3. Install + .env :
   ```bash
   cd backend && composer install --no-interaction
   cp .env.example .env
   sed -i 's|^APP_URL=.*|APP_URL=http://localhost:8000|' .env
   echo 'SUPABASE_URL=...' >> .env       # voir "Devin Secrets Needed"
   echo 'SUPABASE_ANON_KEY=...' >> .env
   touch database/database.sqlite
   ```
4. **Avant de migrer** : il y a un conflit entre la migration default Laravel `0001_01_01_000000_create_users_table.php` (boilerplate, mauvaise schema) et la migration projet `2026_05_07_215055_create_users_table.php` (schema reel : `username`, `password_hash`, `primary_language_code`, `is_online`, `last_seen_at`). Supprimer (ou renommer) la boilerplate avant `migrate` :
   ```bash
   rm backend/database/migrations/0001_01_01_000000_create_users_table.php
   php artisan key:generate
   php artisan migrate
   ```
5. **Seed un user local pour pouvoir tester le login** (le register via Supabase est bloque par RLS — voir bugs connus) :
   ```bash
   php artisan tinker --execute='
   $u = new App\Models\User();
   $u->username = "sam_test";
   $u->email = "sam@test.local";
   $u->password_hash = Illuminate\Support\Facades\Hash::make("password123");
   $u->primary_language_code = "fr";
   $u->save();'
   ```
6. Lancer le serveur :
   ```bash
   php artisan serve --host=127.0.0.1 --port=8000
   ```

### Frontend (branche `frontend` ou PR derivee)

```bash
cd frontend
npm install
echo 'VITE_API_URL=http://localhost:8000/api' > .env.local
npm run dev -- --host 127.0.0.1 --port 5173
```

## Bugs backend connus (a fixer cote `backend`, pas dans la PR frontend)

Decouverts pendant les tests E2E avec Supabase configure. Tant qu ils sont la, le chemin succes des endpoints Supabase est intestable.

1. **`POST /api/auth/register` → 500 RLS** : la cle anon n a pas le droit d INSERT dans `users` Supabase (`new row violates row-level security policy`). Fix possible : utiliser `SUPABASE_SERVICE_ROLE_KEY` au lieu de la cle anon dans `SupabaseUserService`, ou ajouter une RLS policy `INSERT` autorisant `anon`.
2. **`GET /api/profile/show` → 404** : controller cherche en Supabase mais l user a ete cree en SQLite via login. Datastore split (voir Architecture).
3. **`PUT /api/profile/update` → 500 "Undefined array key 0"** : meme cause que (2), `findUserById` renvoie [] et le controller fait `$existing[0]` sans guard.
4. **`GET /api/profile/search` → 500 TypeError** : `backend/app/Http/Controllers/ProfileController.php:127` passe `$request->query` (InputBag) au service au lieu de `$request->query('query')`.

## Strategie de test recommandee

Vu les bugs ci-dessus, tester le frontend de bout en bout demande de separer 2 categories d endpoints :

- **Local-DB (login + logout)** : succes complet testable.
- **Supabase (register, profile/show, profile/update, profile/search)** : tester le chemin **erreur** seulement (le 500 backend remonte au frontend qui doit rollback ou afficher l erreur). Verifier que la requete part avec le bon endpoint + body en lisant les logs `php artisan serve` (qui logguent path + duree).

Pour les selects HTML natifs, sur Linux Chrome la popup est rendue par l OS et ne repond pas toujours aux clics par coordonnees xdotool. Workaround acceptable pour le test : dispatch l onChange via console :
```js
const s = document.querySelector('aside select');
const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
setter.call(s, 'en');
s.dispatchEvent(new Event('change', { bubbles: true }));
```
Le `onChange` React passe par tous les handlers comme un vrai clic.

## Verification rapide (smoke test sans UI)

```bash
# Login OK (local DB)
curl -X POST localhost:8000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"sam@test.local","password":"password123"}'

# Logout OK
curl -X POST localhost:8000/api/auth/logout -H 'Content-Type: application/json' \
  -d '{"user_id":1}'

# Mauvais mdp → 401 "Invalid credentials"
curl -X POST localhost:8000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"sam@test.local","password":"wrong"}'
```

CORS : Laravel 13 sert un `Access-Control-Allow-Origin: *` par defaut sur `/api/*`, donc rien a configurer si front et back sont sur la meme machine.

## Devin Secrets Needed

- `SUPABASE_URL` (non sensitive) — URL du projet Supabase utilise par le backend.
- `SUPABASE_ANON_KEY` (sensitive) — cle anon publique. Note : limite par RLS, ne permet pas l INSERT, donc bloque le register Supabase (voir bug #1).

Access attendu : ces 2 secrets sont scoped a l utilisateur (compte personnel), pas a l org, car ils appartiennent au projet Supabase du dev.

## Reference

- PR #1 (frontend wiring) : https://github.com/NEXUSLABSWORLD/NexChat/pull/1 — contient le test report avec les 5 tests UI passants et les 4 bugs backend documentes.
