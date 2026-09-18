import apiClient from './client'

export const getContacts = async () => {
  const { data } = await apiClient.get('/moderation/contacts')
  return data // array of user IDs
}

export const toggleContact = async (contactId) => {
  const { data } = await apiClient.post('/moderation/contacts/toggle', { contact_id: contactId })
  return data
}

export const addContactByEmail = async (email) => {
  const { data } = await apiClient.post('/moderation/contacts/by-email', { email })
  return data
}

export const getBlockedUsers = async () => {
  const { data } = await apiClient.get('/moderation/blocks')
  return data // array of user IDs
}

export const toggleBlock = async (blockedId) => {
  const { data } = await apiClient.post('/moderation/blocks/toggle', { blocked_id: blockedId })
  return data
}

export const reportUser = async (reportedUserId, reason, description) => {
  const { data } = await apiClient.post('/moderation/report', {
    reported_user_id: reportedUserId,
    reason,
    description
  })
  return data
}
