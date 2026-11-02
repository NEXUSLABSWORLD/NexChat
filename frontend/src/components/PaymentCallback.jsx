import React, { useEffect, useState } from 'react'
import { verifySubscription } from '../api/subscription'
import { getProfile } from '../api/profile'
import { getStoredUser, storeSession, getStoredToken } from '../api/client'
import './PaymentCallback.css'

export default function PaymentCallback({ onComplete }) {
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'failed'
  const [tierName, setTierName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const reference = searchParams.get('reference') || searchParams.get('trxref')

    if (!reference) {
      setStatus('failed')
      setErrorMessage('Aucune référence de transaction fournie dans l\'URL.')
      return
    }

    const checkPayment = async () => {
      try {
        const result = await verifySubscription(reference)

        if (result.status === 'active') {
          setStatus('success')
          setTierName(result.tier === 'elite_digital' ? 'Elite Digital 👑' : 'Obsidian Pro ✨')

          const token = getStoredToken()
          const currentUser = getStoredUser()
          if (token && currentUser) {
            const refreshedUser = await getProfile()
            storeSession({ token, user: { ...currentUser, ...refreshedUser, subscription_tier: result.tier } })
          } else if (currentUser) {
            storeSession({ token, user: { ...currentUser, subscription_tier: result.tier } })
          }
        } else {
          setStatus('failed')
          setErrorMessage(result.message || 'Le paiement n\'a pas encore été confirmé.')
        }
      } catch (err) {
        console.error('Verification error:', err)
        setStatus('failed')
        setErrorMessage(
          err.response?.data?.message || 'Impossible de vérifier la transaction. Veuillez contacter le support.'
        )
      }
    }

    checkPayment()
  }, [])

  const handleGoToApp = () => {
    // Clean URL query params and notify parent
    window.history.replaceState({}, document.title, window.location.pathname)
    if (onComplete) {
      onComplete()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="payment-callback-overlay">
      <div className="payment-callback-card">
        {status === 'verifying' && (
          <div className="pc-state verifying">
            <div className="pc-spinner-large"></div>
            <h2>Vérification de votre paiement...</h2>
            <p>Veuillez patienter pendant la validation de votre transaction auprès de NotchPay.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="pc-state success">
            <div className="pc-success-icon">🎉</div>
            <h2>Félicitations !</h2>
            <p className="pc-sub-msg">
              Votre abonnement <strong className="pc-tier-highlight">{tierName}</strong> est maintenant actif !
            </p>
            <div className="pc-perks">
              <div className="pc-perk-item">✓ Traductions IA illimitées activées</div>
              <div className="pc-perk-item">✓ Accès débloqué à toutes les fonctionnalités premium</div>
            </div>
            <button className="pc-btn-primary" onClick={handleGoToApp}>
              Accéder à NexChat 🚀
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="pc-state failed">
            <div className="pc-failed-icon">❌</div>
            <h2>Paiement non confirmé</h2>
            <p className="pc-error-text">{errorMessage}</p>
            <div className="pc-actions">
              <button className="pc-btn-secondary" onClick={handleGoToApp}>
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
