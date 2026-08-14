import apiClient from './client'

/**
 * Recuperation du profil utilisateur.
 * Backend: GET /api/profile/show?user_id=...
 */
export function getProfile() {
  return apiClient
    .get('/profile/show')
    .then((response) => response.data.user)
}

/**
 * Mise a jour du profil (username, langue, avatar, bio).
 * Backend: PUT /api/profile/update
 */
export function updateProfile({ username, primary_language_code, avatar_url, bio } = {}) {
  const payload = {}
  if (username !== undefined) payload.username = username
  if (primary_language_code !== undefined) {
    payload.primary_language_code = primary_language_code
  }
  if (avatar_url !== undefined) payload.avatar_url = avatar_url
  if (bio !== undefined) payload.bio = bio
  return apiClient.put('/profile/update', payload).then((response) => response.data.user)
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
/**
 * Mise a jour du mot de passe.
 * Backend: PUT /api/profile/update-password
 * Champs acceptes: current_password, new_password, new_password_confirmation.
 */
export function updatePassword({ current_password, new_password, new_password_confirmation }) {
  return apiClient
    .put('/profile/update-password', {
      current_password,
      new_password,
      new_password_confirmation,
    })
    .then((response) => response.data)
}
