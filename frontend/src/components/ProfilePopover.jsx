import React from 'react'
import {
  User,
  Shield,
  Sparkles,
  Lock,
  Mic,
  Square,
  Play,
  Volume2,
  Trash2,
  Settings,
  LogOut,
  Globe2,
  Check,
  Zap,
  Activity,
  Moon,
  Sun
} from 'lucide-react'

export default function ProfilePopover({
  isOpen,
  onClose,
  profile,
  userStatus = 'available',
  setUserStatus,
  avatarFilter = 'normal',
  setAvatarFilter,
  voiceUrl,
  setVoiceUrl,
  isRecording,
  startRecording,
  stopRecording,
  isPlayingVoice,
  playVoice,
  setIsLocked,
  onOpenSettings,
  onLogout
}) {
  if (!isOpen) return null

  const statusOptions = [
    { key: 'available', label: 'Disponible', color: '#10b981', desc: 'En ligne & actif' },
    { key: 'away', label: 'Absent', color: '#f59e0b', desc: 'Momentanément indisponible' },
    { key: 'dnd', label: 'Ne pas déranger', color: '#ef4444', desc: 'Notifications silencieuses' },
    { key: 'ai', label: 'Mode IA Pilote', color: '#a855f7', desc: 'Réponses intelligentes auto' },
  ]

  const filterOptions = [
    { key: 'normal', label: 'Normal', preview: 'none' },
    { key: 'cyberpunk', label: 'Cyberpunk', preview: 'hue-rotate(90deg) saturate(1.5)' },
    { key: 'glitch', label: 'Glitch', preview: 'contrast(1.4) saturate(1.2)' },
    { key: 'carbon', label: 'Carbon', preview: 'grayscale(1) contrast(1.2)' },
  ]

  const handleStatusChange = (status) => {
    setUserStatus(status)
    localStorage.setItem('nexchat_user_status', status)
  }

  const handleFilterChange = (filter) => {
    setAvatarFilter(filter)
    localStorage.setItem('nexchat_avatar_filter', filter)
  }

  const handleDeleteVoice = () => {
    setVoiceUrl('')
    localStorage.removeItem('nexchat_voice_url')
  }

  return (
    <div
      className="profile-popover-container"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: '72px',
        bottom: '16px',
        zIndex: 2500,
        width: '320px',
        background: 'rgba(19, 19, 25, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(168, 85, 247, 0.15)',
        padding: '16px',
        color: 'var(--text-primary, #e5e2e1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        animation: 'popoverIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto'
      }}
    >
      {/* 1. IDENTITY HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div
          className={`avatar ${userStatus === 'ai' ? 'cyber-pulse' : ''}`}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            position: 'relative',
            border: `2px solid ${
              userStatus === 'available' ? '#10b981' :
              userStatus === 'dnd' ? '#ef4444' :
              userStatus === 'ai' ? '#a855f7' : '#f59e0b'
            }`,
            boxShadow: `0 0 12px ${
              userStatus === 'available' ? 'rgba(16,185,129,0.4)' :
              userStatus === 'dnd' ? 'rgba(239,68,68,0.4)' :
              userStatus === 'ai' ? 'rgba(168,85,247,0.4)' : 'rgba(245,158,11,0.4)'
            }`,
            flexShrink: 0
          }}
        >
          <div
            className="avatar-inner"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem',
              overflow: 'hidden',
              filter: avatarFilter === 'cyberpunk' ? 'hue-rotate(90deg) saturate(1.5)' :
                      avatarFilter === 'glitch' ? 'contrast(1.4) saturate(1.2)' :
                      avatarFilter === 'carbon' ? 'grayscale(1) contrast(1.2)' : 'none'
            }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (profile?.username || '?').slice(0, 2).toUpperCase()
            )}
          </div>
          {/* Status Dot */}
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: userStatus === 'available' ? '#10b981' : userStatus === 'dnd' ? '#ef4444' : userStatus === 'ai' ? '#a855f7' : '#f59e0b',
              border: '2px solid #131319'
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, fontFamily: 'Space Grotesk', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.username || 'Utilisateur'}
            </h4>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}
            >
              {(profile?.primary_language_code || 'FR').toUpperCase()}
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted, #988d9f)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {profile?.email || 'compte@nexchat.com'}
          </p>
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: profile?.subscription_tier === 'elite_digital' ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.3))' : profile?.subscription_tier === 'obsidian_pro' ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.3))' : 'rgba(255, 255, 255, 0.08)',
                color: profile?.subscription_tier === 'elite_digital' ? '#fde047' : profile?.subscription_tier === 'obsidian_pro' ? '#f472b6' : '#94a3b8',
                border: profile?.subscription_tier === 'elite_digital' ? '1px solid rgba(234, 179, 8, 0.4)' : profile?.subscription_tier === 'obsidian_pro' ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {profile?.subscription_tier === 'elite_digital' ? '👑 Elite' : profile?.subscription_tier === 'obsidian_pro' ? '✨ Pro' : '🌱 Free'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. PRESENCE STATUS SELECTOR */}
      <div>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #988d9f)', marginBottom: '6px' }}>
          Statut de présence
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {statusOptions.map((opt) => {
            const isSelected = userStatus === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleStatusChange(opt.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? `1px solid ${opt.color}` : '1px solid rgba(255, 255, 255, 0.06)',
                  color: isSelected ? 'white' : 'var(--text-secondary, #cfc2d6)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: opt.color,
                    boxShadow: isSelected ? `0 0 8px ${opt.color}` : 'none',
                    flexShrink: 0
                  }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: isSelected ? 600 : 400, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {opt.label}
                </span>
                {isSelected && <Check size={12} color={opt.color} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. CYBERPUNK AVATAR FILTERS */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #988d9f)' }}>
            Filtres Cyber Avatar
          </label>
          <Sparkles size={13} color="#a855f7" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
          {filterOptions.map((f) => {
            const active = avatarFilter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFilterChange(f.key)}
                style={{
                  padding: '5px 4px',
                  borderRadius: '6px',
                  background: active ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: active ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.06)',
                  color: active ? '#c084fc' : 'var(--text-muted, #988d9f)',
                  fontSize: '0.7rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. VOICE GREETING STATUS */}
      <div>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #988d9f)', marginBottom: '6px' }}>
          Statut Vocal
        </label>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          {isRecording ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulseBadge 1s infinite' }} />
              Enregistrement en cours...
            </div>
          ) : voiceUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={15} color="#10b981" />
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 500 }}>Statut vocal prêt</span>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #988d9f)' }}>Aucun statut vocal</span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Square size={11} fill="white" /> Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#c084fc',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Mic size={12} /> {voiceUrl ? 'Refaire' : 'Enregistrer'}
              </button>
            )}

            {voiceUrl && !isRecording && (
              <>
                <button
                  type="button"
                  onClick={playVoice}
                  disabled={isPlayingVoice}
                  style={{
                    background: isPlayingVoice ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Écouter"
                >
                  <Play size={11} fill="white" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteVoice}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted, #988d9f)',
                    padding: '4px',
                    cursor: 'pointer'
                  }}
                  title="Supprimer"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 5. QUICK COCKPIT ACTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          type="button"
          onClick={() => {
            onClose()
            setIsLocked(true)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: 'var(--text-primary, #e5e2e1)',
            cursor: 'pointer',
            fontSize: '0.83rem',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
          }}
        >
          <Lock size={15} color="#ef4444" />
          <span>Verrouiller le Cockpit (PIN)</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '10px',
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            color: 'var(--text-primary, #e5e2e1)',
            cursor: 'pointer',
            fontSize: '0.83rem',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.18)'
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)'
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)'
          }}
        >
          <Settings size={15} color="#a855f7" />
          <span>Paramètres & Identité</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose()
            onLogout()
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            cursor: 'pointer',
            fontSize: '0.83rem',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)'
          }}
        >
          <LogOut size={15} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  )
}
