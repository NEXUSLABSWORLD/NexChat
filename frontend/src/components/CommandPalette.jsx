import React from 'react'
import {
  Search,
  Lock,
  Sun,
  Moon,
  Sparkles,
  BellOff,
  Cpu,
  EyeOff,
  MessageSquare,
  UserPlus
} from 'lucide-react'

export default function CommandPalette({
  showCommandPalette,
  setShowCommandPalette,
  commandQuery,
  setCommandQuery,
  filteredCommandItems,
  commandSelectedIndex,
  setCommandSelectedIndex
}) {
  if (!showCommandPalette) return null

  return (
    <div
      onClick={() => setShowCommandPalette(false)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10, 10, 18, 0.7)',
        backdropFilter: 'blur(20px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '120px',
        zIndex: 99998,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <style>{`
        .command-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }
        .command-item.active {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(168, 85, 247, 0.2);
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.05);
        }
        .command-badge {
          font-size: 0.7rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--text-muted);
          font-family: monospace;
        }
        .command-category-title {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--primary-color);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 8px 16px 4px 16px;
          margin-top: 12px;
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(17, 17, 27, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          width: '580px',
          maxWidth: '90%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(168,85,247,0.1)',
          overflow: 'hidden',
          animation: 'profileSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header / Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Search size={20} color="var(--primary-color)" style={{ marginRight: '12px', flexShrink: 0 }} />
          <input
            autoFocus
            type="text"
            value={commandQuery}
            onChange={(e) => setCommandQuery(e.target.value)}
            placeholder="Rechercher une action, un contact, un message..."
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 500
            }}
          />
          <span className="command-badge" style={{ marginLeft: '12px', flexShrink: 0 }}>ESC</span>
        </div>

        {/* Content List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
          {filteredCommandItems.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Aucun résultat pour "<span style={{ color: 'white' }}>{commandQuery}</span>"
            </div>
          ) : (
            (() => {
              let currentCategory = ''
              return filteredCommandItems.map((item, index) => {
                const showCategory = item.category !== currentCategory
                currentCategory = item.category

                return (
                  <div key={item.id}>
                    {showCategory && (
                      <div className="command-category-title">{item.category}</div>
                    )}
                    <div
                      className={`command-item ${index === commandSelectedIndex ? 'active' : ''}`}
                      onMouseEnter={() => setCommandSelectedIndex(index)}
                      onClick={item.action}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          color: index === commandSelectedIndex ? 'var(--primary-color)' : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center'
                        }}>
                          {item.icon === 'Lock' && <Lock size={18} />}
                          {item.icon === 'Sun' && <Sun size={18} />}
                          {item.icon === 'Moon' && <Moon size={18} />}
                          {item.icon === 'Sparkles' && <Sparkles size={18} />}
                          {item.icon === 'BellOff' && <BellOff size={18} />}
                          {item.icon === 'Cpu' && <Cpu size={18} />}
                          {item.icon === 'EyeOff' && <EyeOff size={18} />}
                          {item.icon === 'MessageSquare' && <MessageSquare size={18} />}
                          {item.icon === 'UserPlus' && <UserPlus size={18} />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{item.label}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sublabel}</span>
                        </div>
                      </div>
                      {item.shortcut ? (
                        <span className="command-badge">{item.shortcut}</span>
                      ) : (
                        index === commandSelectedIndex && <span className="command-badge">⏎ Entrée</span>
                      )}
                    </div>
                  </div>
                )
              })
            })()
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: 'var(--text-muted)'
        }} aria-hidden="true">
          <div style={{ display: 'flex', gap: '16px' }}>
            <span><b style={{ color: 'white' }}>↑↓</b> Naviguer</span>
            <span><b style={{ color: 'white' }}>⏎</b> Sélectionner</span>
            <span><b style={{ color: 'white' }}>ESC</b> Fermer</span>
          </div>
          <div>
            <span>Menu Cockpit • <kbd style={{ color: 'white', fontFamily: 'monospace' }}>Ctrl+K</kbd></span>
          </div>
        </div>
      </div>
    </div>
  )
}
