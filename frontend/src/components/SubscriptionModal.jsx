import React, { useState } from 'react'
import { initializeSubscription, initializePublicSubscription } from '../api/subscription'
import { getStoredToken } from '../api/client'
import './SubscriptionModal.css'

export default function SubscriptionModal({ isOpen, onClose, currentTier = 'free', onSubscriptionSuccess, onRequireAuth }) {
  const [selectedTier, setSelectedTier] = useState('obsidian_pro')
  const [guestEmail, setGuestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const token = getStoredToken()

  if (!isOpen) return null

  const plans = [
    {
      id: 'free',
      name: 'Gratuit',
      badge: 'Découverte',
      price: '0 FCFA',
      subPrice: '0 € / mois',
      description: 'Pour discuter et découvrir la puissance de la traduction IA.',
      features: [
        '5 000 mots traduits par mois',
        'Traduction instantanée DeepL & MyMemory',
        'Messagerie texte, vocaux et médias',
        'Groupes jusqu\'à 50 membres',
        'Stories 24h standard',
      ],
      current: currentTier === 'free',
      disabled: true,
    },
    {
      id: 'obsidian_pro',
      name: 'Obsidian Pro',
      badge: 'Le Plus Populaire',
      popular: true,
      price: '5 500 FCFA',
      subPrice: '~8,99 € / mois',
      description: 'La traduction IA illimitée et les fonctionnalités avancées pour communiquer sans aucune barrière.',
      features: [
        '✨ Traductions IA illimitées',
        '🚀 Moteur Gemini Flash ultra-rapide',
        '📸 Stories HD haute résolution',
        '🎙️ Synthèse intelligente de messages',
        '🏷️ Badge exclusif Obsidian Pro',
        '👥 Groupes jusqu\'à 200 membres',
      ],
      current: currentTier === 'obsidian_pro',
    },
    {
      id: 'elite_digital',
      name: 'Elite Digital',
      badge: 'Expérience Ultime',
      price: '15 000 FCFA',
      subPrice: '~24,99 € / mois',
      description: 'La quintessence technologique de NexChat avec le modèle Gemini 1.5 Pro et le support VIP.',
      features: [
        '👑 Tout ce qui est inclus dans Pro',
        '🧠 Moteur IA Gemini 1.5 Pro (raisonnement complexe)',
        '🔊 Synthèse vocale de groupe automatique',
        '📁 Envoi de fichiers jusqu\'à 100 Mo',
        '⚡ Priorité maximale sur le réseau de traduction',
        '👑 Badge doré Elite Digital',
        '💬 Support VIP dédié 24/7',
      ],
      current: currentTier === 'elite_digital',
    },
  ]

  const handleSubscribe = async (tierId) => {
    if (tierId === 'free' || tierId === currentTier) return

    setLoading(true)
    setError(null)

    try {
      let data
      if (token) {
        // Authenticated user checkout
        data = await initializeSubscription(tierId)
      } else {
        // Guest checkout from landing page
        if (!guestEmail.trim() || !guestEmail.includes('@')) {
          setError('Veuillez saisir une adresse email valide ci-dessous pour recevoir votre reçu et lier votre accès.')
          setLoading(false)
          return
        }
        data = await initializePublicSubscription({ tier: tierId, email: guestEmail.trim() })
      }

      if (data.authorization_url) {
        // Redirection immédiate vers la page de paiement sécurisée NotchPay
        window.location.href = data.authorization_url
      } else {
        setError('Impossible d\'obtenir le lien de paiement NotchPay. Veuillez réessayer.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Subscription error:', err)
      const message = err.response?.data?.message || 'Une erreur est survenue lors de l\'initialisation du paiement.'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="sub-modal-backdrop" onClick={onClose}>
      <div className="sub-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sub-modal-header">
          <div className="sub-header-title">
            <span className="sub-header-icon">💎</span>
            <div>
              <h2>Débloquez la puissance de NexChat</h2>
              <p>Paiement sécurisé par <strong>Mobile Money (MTN / Orange)</strong> ou <strong>Carte Bancaire</strong> via NotchPay</p>
            </div>
          </div>
          <button className="sub-modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className="sub-modal-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Guest Email Field (if not logged in) */}
        {!token && (
          <div className="sub-guest-email-box">
            <label htmlFor="guest-sub-email">
              ✉️ <strong>Votre adresse email</strong> (pour recevoir votre confirmation & activer votre compte) :
            </label>
            <input
              id="guest-sub-email"
              type="email"
              placeholder="ex: fotsingbrayan@gmail.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="sub-guest-email-input"
              autoFocus
            />
          </div>
        )}

        {/* Plans Grid */}
        <div className="sub-plans-grid">
          {plans.map((plan) => {
            const isSelected = selectedTier === plan.id
            const isCurrent = plan.current

            return (
              <div
                key={plan.id}
                className={`sub-plan-card ${plan.popular ? 'popular' : ''} ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
                onClick={() => !plan.disabled && setSelectedTier(plan.id)}
              >
                {plan.badge && (
                  <div className={`sub-plan-badge ${plan.popular ? 'popular-badge' : ''}`}>
                    {plan.badge}
                  </div>
                )}

                <div className="sub-plan-name">{plan.name}</div>
                
                <div className="sub-plan-pricing">
                  <span className="sub-plan-price">{plan.price}</span>
                  <span className="sub-plan-subprice">{plan.subPrice}</span>
                </div>

                <p className="sub-plan-desc">{plan.description}</p>

                <ul className="sub-plan-features">
                  {plan.features.map((feat, idx) => (
                    <li key={idx}>
                      <span className="sub-feat-check">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="sub-plan-action">
                  {isCurrent ? (
                    <button className="sub-btn sub-btn-current" disabled>
                      Plan Actuel
                    </button>
                  ) : plan.id === 'free' ? (
                    <button className="sub-btn sub-btn-free" disabled>
                      Inclus
                    </button>
                  ) : (
                    <button
                      className={`sub-btn ${plan.popular ? 'sub-btn-popular' : 'sub-btn-primary'}`}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading}
                    >
                      {loading && selectedTier === plan.id ? (
                        <span className="sub-spinner"></span>
                      ) : (
                        `Choisir ${plan.name}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Payment Methods Footer */}
        <div className="sub-modal-footer">
          <div className="sub-payment-methods">
            <span className="sub-pm-label">Paiement 100% sécurisé via NotchPay :</span>
            <div className="sub-pm-badges">
              <span className="pm-tag mtn">🟡 MTN Mobile Money</span>
              <span className="pm-tag orange">🟠 Orange Money</span>
              <span className="pm-tag wave">🌊 Wave / Moov</span>
              <span className="pm-tag card">💳 Visa / Mastercard</span>
            </div>
          </div>
          <p className="sub-guarantee">
            🔒 Vos transactions sont cryptées et protégées. Vous pouvez annuler votre abonnement à tout moment.
          </p>
        </div>
      </div>
    </div>
  )
}
