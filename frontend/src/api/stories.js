import apiClient from './client'

export const getStories = async () => {
  const { data } = await apiClient.get('/stories')
  return data
}

export const createStory = async (textContent, mediaUrl = null) => {
  const { data } = await apiClient.post('/stories', { text_content: textContent, media_url: mediaUrl })
  return data
}
