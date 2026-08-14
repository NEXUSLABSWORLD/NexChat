import React from 'react'
import { Bell, X } from 'lucide-react'

export default function NotificationsModal({
  showNotifications,
  setShowNotifications,
  notifications,
  setNotifications,
  setActiveConversationId
}) {
  if (!showNotifications) return null

  return (
    <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
      <div className="settings-modal" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
        <header className="settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} color="var(--primary-color)" />
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 600 }}>Centre d'Activité</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {notifications.length > 0 && (
              <button 
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}
                onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
              >
                Tout lire
              </button>
            )}
            <button className="btn-close" onClick={() => setShowNotifications(false)}>
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="settings-content" style={{ padding: '16px', gap: '12px', maxHeight: '60vh' }}>
          {notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-secondary)', textAlign: 'center', gap: '12px' }}>
              <Bell size={36} style={{ opacity: 0.3, color: 'var(--primary-color)' }} />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 600 }}>Aucune alerte</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vous serez notifié en temps réel lors de l'arrivée de nouveaux messages ou de Wizz !</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => {
                    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
                    if (notif.conversationId) setActiveConversationId(notif.conversationId)
                    setShowNotifications(false)
                  }}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                    borderRadius: '14px', background: notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(168,85,247,0.06)',
                    border: '1px solid', borderColor: notif.read ? 'var(--border-color)' : 'rgba(168,85,247,0.2)',
                    cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
                  }}
                  className="notif-item-hover"
                >
                  <div className="avatar no-story" style={{ width: '38px', height: '38px', flexShrink: 0 }}>
                    <div className="avatar-inner" style={{ fontSize: '0.8rem' }}>
                      {notif.senderAvatar ? (
                        <img src={notif.senderAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        notif.senderName?.slice(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{notif.senderName}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: notif.read ? 'var(--text-secondary)' : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: notif.read ? 400 : 500 }}>
                      {notif.text}
                    </p>
                  </div>

                  {!notif.read && (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-color)', position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <footer style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.1)' }}>
          <button 
            className="auth-btn" 
            style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            onClick={() => setNotifications([])}
          >
            Effacer tout l'historique
          </button>
        </footer>
      </div>
    </div>
  )
}
