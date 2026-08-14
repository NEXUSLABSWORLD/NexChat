import apiClient from './client'

export const getPosts = async () => {
  const { data } = await apiClient.get('/posts')
  return data
}

export const createPost = async (content, mediaUrl = null) => {
  const { data } = await apiClient.post('/posts', { content, media_url: mediaUrl })
  return data
}

export const toggleLike = async (postId) => {
  const { data } = await apiClient.post(`/posts/${postId}/like`)
  return data
}
