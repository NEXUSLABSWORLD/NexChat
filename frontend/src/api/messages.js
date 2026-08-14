import apiClient from './client'

/**
 * Envoie un message dans une conversation (texte + optionnellement un fichier).
 * @param {number} conversationId
 * @param {string|null} content
 * @param {{ file_url?, file_name?, file_type?, file_size? }} fileData
 * @returns {{ message: string, data: Object }}
 */
export async function sendMessage(conversationId, content, fileData = {}) {
  const { data } = await apiClient.post('/messages', {
    conversation_id: conversationId,
    content: content || undefined,
    ...fileData,
  })
  return data
}

/**
 * Récupère l'historique paginé des messages d'une conversation.
 * @param {number} conversationId
 * @param {{ limit?: number, offset?: number }} options
 * @returns {Object} Réponse paginée Laravel
 */
export async function getMessages(conversationId, { limit = 50, offset = 0 } = {}) {
  const { data } = await apiClient.get('/messages', {
    params: { conversation_id: conversationId, limit, offset },
  })
  return data
}

/**
 * Marque un message spécifique comme lu.
 * @param {number} messageId
 * @returns {{ message: string, updated: boolean }}
 */
export async function markMessageAsRead(messageId) {
  const { data } = await apiClient.patch(`/messages/${messageId}/read`)
  return data
}

/**
 * Supprimer un message pour tout le monde.
 */
export async function deleteMessage(messageId) {
  const { data } = await apiClient.delete(`/messages/${messageId}`)
  return data
}

/**
 * Archiver un message.
 */
export async function archiveMessage(messageId) {
  const { data } = await apiClient.post(`/messages/${messageId}/archive`)
  return data
}
