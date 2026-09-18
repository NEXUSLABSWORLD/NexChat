import React from 'react'
import { Users, ChevronDown, Search, MailPlus } from 'lucide-react'
import StoriesTray from './StoriesTray'

export default function ConversationList({
  sidebarMode,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  sidebarCollapsed,
  setShowGroupModal,
  showMessagesMenu,
  setShowMessagesMenu,
  messagesFilter,
  setMessagesFilter,
  conversationList = [],
  setConversationList,
  apiMarkConversationAsRead,
  settingsProfile,
  query,
  setQuery,
  convLoading,
  unifiedList = [],
  activeGroupId,
  setActiveGroupId,
  activeConversationId,
  setActiveConversationId,
  setCurrentView,
  setConvContextMenu,
  formatTime,
  remoteResults = [],
  handleStartConversation,
  onAddContactByEmail
}) {
  const [contactEmail, setContactEmail] = React.useState('')
  const [contactError, setContactError] = React.useState('')
  const [contactSubmitting, setContactSubmitting] = React.useState(false)
  const safeFormatTime = typeof formatTime === 'function' ? formatTime : (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
  return (
    <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarMode === 'compact' ? 'compact' : ''}`}>
      <header className="sidebar-header" style={{ position: 'relative' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Space Grotesk' }}>Messages</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setShowGroupModal(true)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Créer un groupe"
          >
            <Users size={20} />
          </button>
          <button 
            onClick={() => setShowMessagesMenu(!showMessagesMenu)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {showMessagesMenu && (
          <>
            <div onClick={() => setShowMessagesMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 49 }} />
            <div style={{ position: 'absolute', top: '100%', right: '10px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px', width: '200px', zIndex: 50, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px', padding: '0 10px' }}>Filtrer par</div>
              <button 
                onClick={() => { setMessagesFilter('all'); setShowMessagesMenu(false); }}
                style={{ background: messagesFilter === 'all' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: 'white', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Tous les messages
              </button>
              <button 
                onClick={() => { setMessagesFilter('unread'); setShowMessagesMenu(false); }}
                style={{ background: messagesFilter === 'unread' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: 'white', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Messages non lus
              </button>
              <button 
                onClick={() => { setMessagesFilter('contacts'); setShowMessagesMenu(false); }}
                style={{ background: messagesFilter === 'contacts' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: 'white', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Contacts
              </button>
              <button 
                onClick={() => { setMessagesFilter('archived'); setShowMessagesMenu(false); }}
                style={{ background: messagesFilter === 'archived' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: 'white', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Messages archivés
              </button>
              
              <div style={{ borderTop: '1px solid var(--border-color)', margin: '5px 0' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px', padding: '0 10px' }}>Actions</div>
              <button 
                onClick={async () => {
                  setConversationList(prev => prev.map(c => ({...c, unread_count: 0})));
                  setShowMessagesMenu(false);
                  const unreadConvs = conversationList.filter(c => c.unread_count > 0);
                  for (const conv of unreadConvs) {
                    try { await apiMarkConversationAsRead(conv.id); } catch(e) {}
                  }
                }}
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Tout marquer comme lu
              </button>
              <button 
                onClick={() => { setShowGroupModal(true); setShowMessagesMenu(false); }}
                style={{ background: 'transparent', border: 'none', color: '#FF6B6B', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Users size={16} /> Créer un groupe
              </button>
            </div>
          </>
        )}
      </header>

      {sidebarMode !== 'compact' && <StoriesTray currentUser={settingsProfile} />}

      <div className="search-container">
        <div className="chat-input-wrapper" style={{ borderRadius: '10px', padding: '0 12px' }}>
          <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input
            className="chat-input"
            style={{ fontSize: '0.85rem', padding: '8px 0' }}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher..."
          />
        </div>
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            setContactError('')
            setContactSubmitting(true)
            try {
              await onAddContactByEmail(contactEmail)
              setContactEmail('')
            } catch (error) {
              setContactError(error?.response?.data?.message || 'Impossible d’ajouter ce contact.')
            } finally {
              setContactSubmitting(false)
            }
          }}
          style={{ display: 'flex', gap: '6px', marginTop: '8px' }}
        >
          <input
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            placeholder="E-mail du contact"
            aria-label="Adresse e-mail du contact"
            style={{ minWidth: 0, flex: 1, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8rem' }}
          />
          <button
            type="submit"
            disabled={contactSubmitting || !contactEmail.trim()}
            title="Ajouter ce contact"
            aria-label="Ajouter ce contact"
            style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', padding: '0 10px', cursor: contactSubmitting ? 'wait' : 'pointer', opacity: contactSubmitting || !contactEmail.trim() ? 0.5 : 1 }}
          >
            <MailPlus size={16} />
          </button>
        </form>
        {contactError && <p style={{ color: '#ff8a8a', fontSize: '0.75rem', margin: '6px 2px 0' }}>{contactError}</p>}
      </div>

      <div className="conversations-list" aria-label="Conversations">
        {convLoading && (
          <p style={{ padding: '1rem', opacity: 0.5, fontSize: '0.85rem' }}>Chargement...</p>
        )}

        {!convLoading && unifiedList.length === 0 && !query && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>Aucune conversation.</p>
          </div>
        )}

        {unifiedList.map((item) => {
          const isGroup = item.isGroup;
          const isActive = isGroup ? activeGroupId === item.id : activeConversationId === item.id;
          const unreadCount = item.unread_count || 0;

          return (
            <div
              className={`conversation-item ${isActive ? 'active' : ''}`}
              key={isGroup ? `group-${item.id}` : `conv-${item.id}`}
              onClick={() => {
                if (isGroup) {
                  setActiveGroupId(item.id)
                  setActiveConversationId(null)
                } else {
                  setActiveConversationId(item.id)
                  setActiveGroupId(null)
                }
                setCurrentView('chat')
                setMobileSidebarOpen(false)
              }}
              onContextMenu={(e) => {
                if (!isGroup) {
                  e.preventDefault();
                  setConvContextMenu({ visible: true, x: e.clientX, y: e.clientY, conversationId: item.id });
                }
              }}
            >
              <div className={`avatar ${unreadCount > 0 ? '' : 'no-story'}`} aria-hidden="true" style={{ position: 'relative' }}>
                <div className="avatar-inner">
                  {item.displayAvatar
                    ? <img src={item.displayAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : item.displayName
                      ? item.displayName.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
                      : '?'
                  }
                </div>
                {sidebarMode === 'compact' && unreadCount > 0 && (
                  <div className="compact-unread-badge">
                    {unreadCount}
                  </div>
                )}
              </div>
              <div className="conversation-info">
                <div className="conversation-name" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: unreadCount > 0 ? 700 : 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {isGroup && <Users size={14} color="var(--text-muted)" />}
                    {item.displayName}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {isGroup ? safeFormatTime(item.created_at) : (item.latest_message ? safeFormatTime(item.latest_message.created_at) : '')}
                  </span>
                </div>
                <div className="conversation-preview" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: unreadCount > 0 ? 600 : 400, color: unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {isGroup ? (item.description || 'Groupe') : (item.latest_message?.content_original || 'Nouvelle conversation')}
                  </span>
                  {unreadCount > 0 && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', boxShadow: '0 0 10px var(--primary-color)' }} />}
                </div>
              </div>
            </div>
          );
        })}
        {remoteResults && remoteResults.length > 0 && (
          <div style={{ marginTop: '16px' }} aria-label="Résultats de recherche API">
            <p style={{ padding: '0 20px 8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggestions</p>
            {remoteResults.map((user) => (
              <div
                key={user.id}
                className="conversation-item"
                onClick={() => handleStartConversation && handleStartConversation(user)}
              >
                <div className="avatar no-story" aria-hidden="true">
                  <div className="avatar-inner">
                    {(user.username || '?').slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    <span>{user.username}</span>
                  </div>
                  <div className="conversation-preview">
                    <span>{(user.primary_language_code || '').toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
