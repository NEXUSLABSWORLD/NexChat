import apiClient from './client';

export async function createGroup(groupData) {
  const response = await apiClient.post('/groups', groupData);
  return response.data;
}

export async function getGroups() {
  const response = await apiClient.get('/groups');
  return response.data;
}

export async function getGroupMessages(groupId) {
  const response = await apiClient.get(`/groups/${groupId}`);
  return response.data;
}

export async function sendGroupMessage(groupId, content) {
  const response = await apiClient.post(`/groups/${groupId}/messages`, {
    content_original: content
  });
  return response.data;
}

export async function addGroupMember(groupId, userId) {
  const response = await apiClient.post(`/groups/${groupId}/members`, { user_id: userId });
  return response.data;
}

export async function removeGroupMember(groupId, userId) {
  const response = await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  return response.data;
}

export async function setGroupMemberRole(groupId, userId, role) {
  const response = await apiClient.patch(`/groups/${groupId}/members/${userId}/role`, { role });
  return response.data;
}
