import apiClient from './client'

/**
 * Initialize a subscription payment for an authenticated user.
 * Returns the NotchPay checkout URL to redirect the user.
 *
 * @param {string} tier - 'obsidian_pro' or 'elite_digital'
 * @returns {Promise<{authorization_url: string, reference: string}>}
 */
export async function initializeSubscription(tier) {
  const callbackUrl = `${window.location.origin}/payment/callback`
  const { data } = await apiClient.post('/subscription/initialize', {
    tier,
    callback_url: callbackUrl,
  })
  return data
}

/**
 * Initialize a subscription payment for a guest / landing page visitor.
 *
 * @param {object} params - { tier, email, username }
 * @returns {Promise<{authorization_url: string, reference: string}>}
 */
export async function initializePublicSubscription({ tier, email, username }) {
  const callbackUrl = `${window.location.origin}/payment/callback`
  const { data } = await apiClient.post('/subscription/initialize-public', {
    tier,
    email,
    username,
    callback_url: callbackUrl,
  })
  return data
}

/**
 * Verify a payment after returning from NotchPay checkout.
 *
 * @param {string} reference - The payment reference from the URL
 * @returns {Promise<{status: string, tier: string, expires_at: string}>}
 */
export async function verifySubscription(reference) {
  const { data } = await apiClient.get('/subscription/verify', {
    params: { reference },
  })
  return data
}

/**
 * Get the current subscription status of the authenticated user.
 *
 * @returns {Promise<{subscription_tier: string, has_active_subscription: boolean, subscription: object|null, ai_quota: object}>}
 */
export async function getSubscriptionStatus() {
  const { data } = await apiClient.get('/subscription/status')
  return data
}
