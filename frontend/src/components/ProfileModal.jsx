import React from 'react'
import { X, Sun, Moon, Sparkles, Wifi } from 'lucide-react'

export default function ProfileModal({
  showSettings,
  setShowSettings,
  profile,
  settingsProfile,
  setSettingsProfile,
  avatarInputRef,
  avatarUploading,
  handleAvatarUpload,
  languages,
  themeMode,
  setThemeMode,
  passwordForm,
  setPasswordForm,
  handleUpdatePassword,
  handleUpdateProfile,
  isSaving
}) {
  if (!showSettings) return null

  return (
    <div className="modal-overlay" onClick={() => setShowSettings(false)}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <header className="settings-header">
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem' }}>Paramètres du Cockpit</h2>
          <button className="btn-close" onClick={() => setShowSettings(false)}>
            <X size={24} />
          </button>
        </header>

        <div className="settings-content">
          {/* SECTION PROFIL */}
          <section className="settings-section">
            <h3>Profil & Identité</h3>

            {/* Avatar upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: profile?.avatar_url ? `url(${profile.avatar_url}) center/cover` : 'linear-gradient(135deg, var(--primary-color), #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', border: '2px solid var(--border-color)',
                  position: 'relative', flexShrink: 0, overflow: 'hidden',
                }}
                title="Changer l'avatar"
              >
                {!profile?.avatar_url && (
                  <span style={{ fontSize: '1.5rem', color: 'white', fontWeight: 700 }}>
                    {profile?.username?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.55)', padding: '2px 0',
                  fontSize: '0.55rem', color: 'white', textAlign: 'center'
                }}>
                  {avatarUploading ? '...' : '📷'}
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{profile?.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profile?.email}</div>
              </div>
            </div>

            <div className="settings-item">
              <div className="settings-item-label">
                <span>Nom d'utilisateur</span>
                <small>Comment les autres vous voient</small>
              </div>
              <input 
                className="chat-input" 
                style={{ width: '180px', background: 'var(--bg-app)', padding: '8px 12px', borderRadius: '8px' }}
                value={settingsProfile.username}
                onChange={e => setSettingsProfile({...settingsProfile, username: e.target.value})}
              />
            </div>

            {/* Bio */}
            <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div className="settings-item-label">
                <span>Bio</span>
                <small>Quelques mots sur vous (max 500 car.)</small>
              </div>
              <textarea
                className="chat-input"
                style={{ width: '100%', background: 'var(--bg-app)', padding: '10px 12px', borderRadius: '8px', resize: 'vertical', minHeight: '60px', fontFamily: 'inherit', border: '1px solid var(--border-color)' }}
                maxLength={500}
                placeholder="Écrivez quelque chose sur vous..."
                value={settingsProfile.bio}
                onChange={e => setSettingsProfile({...settingsProfile, bio: e.target.value})}
              />
            </div>

            <div className="settings-item">
              <div className="settings-item-label">
                <span>Langue Native</span>
                <small>Langue par défaut pour la traduction</small>
              </div>
              <select 
                className="chat-input"
                style={{ width: '180px', background: 'var(--bg-app)', padding: '8px 12px', borderRadius: '8px' }}
                value={settingsProfile.primary_language_code}
                onChange={e => setSettingsProfile({...settingsProfile, primary_language_code: e.target.value})}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </section>

          {/* SECTION IA */}
          <section className="settings-section">
            <h3>Intelligence Artificielle</h3>
            <div className="settings-item">
              <div className="settings-item-label">
                <span>Traduction Automatique</span>
                <small>Traduire les messages dès réception</small>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={settingsProfile.auto_translate}
                  onChange={e => setSettingsProfile({...settingsProfile, auto_translate: e.target.checked})}
                />
                <span className="slider"></span>
              </label>
            </div>
          </section>

          {/* SECTION APPARENCE */}
          <section className="settings-section">
            <h3>Apparence & Cockpit</h3>
            <div className="settings-item">
              <div className="settings-item-label">
                <span>Thème Visuel</span>
                <small>Basculez entre le néon et le clean</small>
              </div>
              <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-app)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setThemeMode('light')}
                  style={{ 
                    flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: themeMode === 'light' ? 'var(--bg-panel)' : 'transparent',
                    color: themeMode === 'light' ? 'var(--primary-color)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem'
                  }}
                >
                  <Sun size={16} /> Clair
                </button>
                <button 
                  onClick={() => setThemeMode('dark')}
                  style={{ 
                    flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: themeMode === 'dark' ? 'var(--bg-panel)' : 'transparent',
                    color: themeMode === 'dark' ? 'var(--primary-color)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem'
                  }}
                >
                  <Moon size={16} /> Sombre
                </button>
                <button 
                  onClick={() => setThemeMode('system')}
                  style={{ 
                    flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: themeMode === 'system' ? 'var(--bg-panel)' : 'transparent',
                    color: themeMode === 'system' ? 'var(--primary-color)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem'
                  }}
                >
                  <Sparkles size={16} /> Système
                </button>
              </div>
            </div>
            <div className="settings-item">
              <div className="settings-item-label">
                <span>Couleur d'accentuation</span>
                <small>Personnalisez vos néons</small>
              </div>
              <div className="color-options">
                {['#a855f7', '#06b6d4', '#10b981', '#f59e0b'].map(color => (
                  <div 
                    key={color}
                    className={`color-chip ${settingsProfile.accent_color === color ? 'active' : ''}`}
                    style={{ background: color }}
                    onClick={() => {
                      setSettingsProfile({...settingsProfile, accent_color: color})
                      document.documentElement.style.setProperty('--primary-color', color)
                    }}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* SECTION STATISTIQUES */}
          <section className="settings-section">
            <h3>Statistiques NexIA</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>1,428</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mots traduits</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>4.2h</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Temps gagné</div>
              </div>
            </div>
          </section>

          {/* SECTION SECURITE */}
          <section className="settings-section">
            <h3>Sécurité & Verrouillage</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="settings-item-label" style={{ marginBottom: '5px' }}>
                <span>Changer le mot de passe</span>
                <small>Renforcez la protection de votre Cockpit</small>
              </div>
              <input 
                type="password"
                className="chat-input" 
                placeholder="Mot de passe actuel"
                style={{ background: 'var(--bg-app)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                value={passwordForm.current_password}
                onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})}
              />
              <input 
                type="password"
                className="chat-input" 
                placeholder="Nouveau mot de passe"
                style={{ background: 'var(--bg-app)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                value={passwordForm.new_password}
                onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})}
              />
              <input 
                type="password"
                className="chat-input" 
                placeholder="Confirmer le nouveau mot de passe"
                style={{ background: 'var(--bg-app)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                value={passwordForm.new_password_confirmation}
                onChange={e => setPasswordForm({...passwordForm, new_password_confirmation: e.target.value})}
              />
              <button 
                className="auth-btn" 
                style={{ padding: '10px 20px', fontSize: '0.85rem', width: 'fit-content', marginTop: '5px' }}
                onClick={handleUpdatePassword}
                disabled={isSaving}
              >
                Mettre à jour le mot de passe
              </button>
            </div>
          </section>

          {/* SECTION SESSIONS */}
          <section className="settings-section">
            <h3>Appareils Connectés</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <div style={{ padding: '8px', background: 'var(--bg-app)', borderRadius: '8px', color: 'var(--primary-color)' }}>
                <Wifi size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Windows PC • Chrome</div>
                <div style={{ fontSize: '0.7rem', color: '#22c55e' }}>Session actuelle • En ligne</div>
              </div>
            </div>
          </section>
        </div>

        <footer style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn-save" 
            onClick={handleUpdateProfile}
            disabled={isSaving}
            style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
          >
            {isSaving ? 'Synchronisation...' : 'Enregistrer les modifications'}
          </button>
        </footer>
      </div>
    </div>
  )
}
