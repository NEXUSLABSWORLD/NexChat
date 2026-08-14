import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

const TOKEN_KEY = 'nexchat_token'
const USER_KEY = 'nexchat_user'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function storeSession({ token, user }) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si le backend répond 401, le token est expiré ou invalide → déconnexion forcée
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || ''
    const isAuthRoute = url.includes('/auth/logout') || url.includes('/auth/login')
    if (error?.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('nexchat_token')
      localStorage.removeItem('nexchat_user')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export default apiClient
