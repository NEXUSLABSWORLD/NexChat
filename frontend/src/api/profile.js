import apiClient from './client'

/**
 * Recuperation du profil utilisateur.
 * Backend: GET /api/profile/show?user_id=...
 */
export function getProfile(userId) {
  return apiClient
    .get('/profile/show', { params: { user_id: userId } })
    .then((response) => response.data)
}

/**
 * Mise a jour du profil (username et / ou langue principale).
 * Backend: PUT /api/profile/update
 * Champs acceptes: username?, primary_language_code? (2 lettres).
 */
export function updateProfile(userId, { username, primary_language_code } = {}) {
  const payload = { user_id: userId }
  if (username !== undefined) payload.username = username
  if (primary_language_code !== undefined) {
    payload.primary_language_code = primary_language_code
  }
  return apiClient.put('/profile/update', payload).then((response) => response.data)
}

/**
 * Recherche d utilisateurs par nom.
 * Backend: GET /api/profile/search?query=...
 * Le backend exige une requete de 2 a 50 caracteres.
 */
export function searchUsers(query) {
  return apiClient
    .get('/profile/search', { params: { query } })
    .then((response) => response.data)
}
