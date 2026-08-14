import React from 'react'
import {
  MessageSquare,
  Globe2,
  Sparkles,
  Search,
  Bell,
  Settings,
  Sun,
  Moon,
  LogOut
} from 'lucide-react'

export default function Navbar({
  currentView,
  setCurrentView,
  showCommandPalette,
  setShowCommandPalette,
  setCommandQuery,
  showNotifications,
  setShowNotifications,
  notifications,
  setShowSettings,
  theme,
  setTheme,
  handleLogout,
  showProfilePopover,
  setShowProfilePopover,
  userStatus,
  profile
}) {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <nav className="nav-sidebar">
      <div className={`nav-item ${currentView === 'chat' ? 'active' : ''}`} onClick={() => setCurrentView('chat')} title="Messages">
        <MessageSquare size={26} />
      </div>
      <div className={`nav-item ${currentView === 'feed' ? 'active' : ''}`} onClick={() => setCurrentView('feed')} title="Actualités / Publications">
        <Globe2 size={24} />
      </div>
      <div className={`nav-item ${currentView === 'ai-dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('ai-dashboard')} title="Centre IA Global">
        <Sparkles size={24} />
      </div>
      <div 
        className={`nav-item ${showCommandPalette ? 'active' : ''}`}
        onClick={() => {
          setShowCommandPalette(true)
          setCommandQuery('')
        }}
        title="Command Palette (Ctrl + K)"
      >
        <Search size={24} />
      </div>
      <div 
        className={`nav-item ${showNotifications ? 'active' : ''}`} 
        onClick={() => setShowNotifications(!showNotifications)}
        style={{ position: 'relative' }}
        title="Notifications et Activité"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="badge-dot"></span>
        )}
      </div>
      
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <div className="nav-item" onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}>
          <Settings size={22} />
        </div>
        <div className="nav-item" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
        </div>
        <div className="nav-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
          <LogOut size={22} />
        </div>
        <div 
          onClick={(e) => { e.stopPropagation(); setShowProfilePopover(!showProfilePopover); }}
          className={`avatar no-story ${userStatus === 'ai' ? 'cyber-pulse' : ''}`} 
          style={{ 
            width: '36px', height: '36px', marginRight: 0, cursor: 'pointer',
            position: 'relative',
            borderRadius: '50%',
            border: `2px solid ${
              userStatus === 'available' ? '#10b981' :
              userStatus === 'dnd' ? '#ef4444' :
              userStatus === 'ai' ? '#a855f7' : '#f59e0b'
            }`,
            boxShadow: `0 0 10px ${
              userStatus === 'available' ? 'rgba(16,185,129,0.5)' :
              userStatus === 'dnd' ? 'rgba(239,68,68,0.5)' :
              userStatus === 'ai' ? 'rgba(168,85,247,0.5)' : 'rgba(245,158,11,0.5)'
            }`,
            transition: 'all 0.3s ease'
          }}
        >
           <div className="avatar-inner" style={{ fontSize: '0.75rem' }}>
              {profile?.avatar_url
                ? <img 
                    src={profile.avatar_url} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                : profile?.username?.slice(0, 2).toUpperCase()
              }
           </div>
        </div>
      </div>
    </nav>
  )
}
