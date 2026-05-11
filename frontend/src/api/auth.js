import apiClient from './client'

/**
 * Inscription d un nouvel utilisateur.
 * Backend: POST /api/auth/register
 * Validation cote backend: username, email, password (min 8, confirme), primary_language_code (2 lettres).
 */
export function register({
  username,
  email,
  password,
  password_confirmation,
  primary_language_code,
}) {
  return apiClient
    .post('/auth/register', {
      username,
      email,
      password,
      password_confirmation,
      primary_language_code,
    })
    .then((response) => response.data)
}

/**
 * Connexion.
 * Backend: POST /api/auth/login
 * Reponse: { message, user, token }
 */
export function login({ email, password }) {
  return apiClient
    .post('/auth/login', { email, password })
    .then((response) => response.data)
}

/**
 * Deconnexion.
 * Backend: POST /api/auth/logout
 * Pas encore de middleware sanctum cote routes/api.php : on transmet user_id explicitement.
 */
export function logout({ user_id }) {
  return apiClient
    .post('/auth/logout', { user_id })
    .then((response) => response.data)
}
