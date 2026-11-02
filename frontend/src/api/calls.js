import apiClient from './client'

export async function sendCallSignal({
  conversationId,
  groupId,
  callId,
  callType,
  action,
  targetUserId,
  payload = {},
}) {
  const { data } = await apiClient.post('/calls/signal', {
    conversation_id: conversationId || undefined,
    group_id: groupId || undefined,
    call_id: callId,
    call_type: callType,
    action,
    target_user_id: targetUserId || undefined,
    payload,
  })
  return data
}
