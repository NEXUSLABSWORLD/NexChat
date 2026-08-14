import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { getStoredToken } from './client'

window.Pusher = Pusher

let echoInstance = null

/**
 * Crée (ou retourne) l'instance Echo connectée à Reverb.
 */
export function getEcho() {
  if (echoInstance) return echoInstance

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    // Auth pour les canaux privés — envoie le Bearer token
    authEndpoint: `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${getStoredToken()}`,
        Accept: 'application/json',
      },
    },
  })

  return echoInstance
}

/**
 * Déconnecte et détruit l'instance Echo (à appeler au logout).
 */
export function disconnectEcho() {
  if (echoInstance) {
    try {
      echoInstance.disconnect()
    } catch {
      // Ignorer les erreurs de déconnexion WebSocket
    } finally {
      echoInstance = null
    }
  }
}
