import apiClient from './client'

/**
 * Récupère toutes les conversations de l'utilisateur connecté.
 * @returns {{ conversations: Array }}
 */
export async function getConversations() {
  const { data } = await apiClient.get('/conversations')
  return data
}

/**
 * Crée ou récupère une conversation existante avec un autre utilisateur.
 * @param {number} otherUserId
 * @returns {{ conversation: Object }}
 */
export async function startConversation(otherUserId) {
  const { data } = await apiClient.post('/conversations', { other_user_id: otherUserId })
  return data
}

/**
 * Récupère les détails d'une conversation et son historique de messages.
 * @param {number} conversationId
 * @returns {{ conversation: Object, messages: Array }}
 */
export async function getConversation(conversationId) {
  const { data } = await apiClient.get(`/conversations/${conversationId}`)
  return data
}

/**
 * Marque tous les messages d'une conversation comme lus.
 * @param {number} conversationId
 * @returns {{ message: string, marked_count: number }}
 */
export async function markConversationAsRead(conversationId) {
  const { data } = await apiClient.patch(`/conversations/${conversationId}/read`)
  return data
}
