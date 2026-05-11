import { useEffect, useRef, useState } from 'react'
import {
  Check,
  CheckCheck,
  ChevronDown,
  Globe2,
  Languages,
  Lock,
  LogOut,
  Menu,
  Moon,
  Search,
  Send,
  Sparkles,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import { login as apiLogin, logout as apiLogout, register as apiRegister } from './api/auth'
import {
  searchUsers as apiSearchUsers,
  updateProfile as apiUpdateProfile,
} from './api/profile'
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  storeSession,
} from './api/client'
import './App.css'

const languages = [
  { code: 'fr', label: 'Francais', flag: 'FR' },
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'es', label: 'Espanol', flag: 'ES' },
  { code: 'de', label: 'Deutsch', flag: 'DE' },
  { code: 'it', label: 'Italiano', flag: 'IT' },
  { code: 'ar', label: 'العربية', flag: 'AR' },
]

const languageLabel = (code) => {
  const match = languages.find((language) => language.code === code)
  return match ? match.label : (code || '').toUpperCase()
}

const heroHighlights = [
  {
    title: 'Traduction instantanee',
    description: 'Chaque message arrive dans la langue de ton contact, sans lever le doigt.',
  },
  {
    title: 'Conversations privees',
    description: 'Tes echanges restent entre vous, point. Pas de pub, pas de tracking.',
  },
  {
    title: '40+ langues',
    description: 'De l italien au japonais, on garde le naturel de ta facon de parler.',
  },
]

const initials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

const emptyAuthForm = {
  username: '',
  email: '',
  password: '',
  password_confirmation: '',
  primary_language_code: 'fr',
}

function extractErrorMessage(error, fallback) {
  const data = error?.response?.data
  if (data?.errors) {
    const firstField = Object.values(data.errors)[0]
    if (Array.isArray(firstField) && firstField.length > 0) {
      return firstField[0]
    }
  }
  return data?.message || error?.message || fallback
}

function App() {
  const storedUser = getStoredUser()
  const storedToken = getStoredToken()
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(storedUser && storedToken))
  const [authMode, setAuthMode] = useState('login')
  const [theme, setTheme] = useState('light')
  const [authForm, setAuthForm] = useState({
    ...emptyAuthForm,
    ...(storedUser
      ? {
          username: storedUser.username || '',
          email: storedUser.email || '',
          primary_language_code: storedUser.primary_language_code || 'fr',
        }
      : {}),
  })
  const [profile, setProfile] = useState(
    storedUser || {
      id: null,
      username: '',
      email: '',
      primary_language_code: 'fr',
    },
  )
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsError, setContactsError] = useState('')
  const [messagesByContact, setMessagesByContact] = useState({})
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [showOriginal, setShowOriginal] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const [sendPulseKey, setSendPulseKey] = useState(0)
  const composerRef = useRef(null)

  const contactMessages = selectedContact
    ? messagesByContact[selectedContact.id] || []
    : []

  const showContacts = query.trim().length >= 2
  const displayedContacts = showContacts ? contacts : []

  // Recherche distante (GET /api/profile/search) — declenche apres 2 caracteres.
  useEffect(() => {
    if (!isAuthenticated) return
    const trimmed = query.trim()
    if (trimmed.length < 2) return

    const timeout = setTimeout(async () => {
      setContactsLoading(true)
      setContactsError('')
      try {
        const data = await apiSearchUsers(trimmed)
        const users = (data?.users || []).filter(
          (user) => user.id && user.id !== profile?.id,
        )
        setContacts(users)
      } catch (error) {
        setContacts([])
        setContactsError(
          extractErrorMessage(error, 'Recherche indisponible pour le moment.'),
        )
      } finally {
        setContactsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, isAuthenticated, profile?.id])

  useEffect(() => {
    if (!languageMenuOpen) return
    const handler = (event) => {
      if (!event.target.closest('[data-language-menu]')) {
        setLanguageMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [languageMenuOpen])

  const handleAuthChange = (field) => (event) => {
    setAuthForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      if (authMode === 'register') {
        await apiRegister({
          username: authForm.username,
          email: authForm.email,
          password: authForm.password,
          password_confirmation: authForm.password_confirmation,
          primary_language_code: authForm.primary_language_code,
        })
      }

      const { user, token } = await apiLogin({
        email: authForm.email,
        password: authForm.password,
      })

      storeSession({ token, user })
      setProfile(user)
      setIsAuthenticated(true)
      setAuthForm((current) => ({ ...current, password: '', password_confirmation: '' }))
    } catch (error) {
      setAuthError(
        extractErrorMessage(
          error,
          authMode === 'register'
            ? 'Impossible de creer ton compte pour l instant.'
            : 'Email ou mot de passe incorrect.',
        ),
      )
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (profile?.id) {
        await apiLogout({ user_id: profile.id })
      }
    } catch {
      // On force la deconnexion cote client meme si l API echoue.
    } finally {
      clearSession()
      setIsAuthenticated(false)
      setProfile((current) => ({ ...current, id: null }))
      setAuthForm(emptyAuthForm)
    }
  }

  const changeLanguage = async (nextLanguage) => {
    const previous = profile.primary_language_code
    if (nextLanguage === previous) {
      setLanguageMenuOpen(false)
      return
    }
    setProfile((current) => ({ ...current, primary_language_code: nextLanguage }))
    setLanguageMenuOpen(false)

    if (!profile?.id) return

    try {
      const data = await apiUpdateProfile(profile.id, {
        primary_language_code: nextLanguage,
      })
      if (data?.user) {
        setProfile(data.user)
        storeSession({ user: data.user })
      }
    } catch {
      setProfile((current) => ({ ...current, primary_language_code: previous }))
    }
  }

  const handleAuthLanguageChange = (event) => {
    setAuthForm((current) => ({ ...current, primary_language_code: event.target.value }))
  }

  const handleSendMessage = (event) => {
    event.preventDefault()

    const trimmed = draft.trim()
    if (!trimmed || !selectedContact) {
      return
    }

    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const message = {
      id: `local-${now.getTime()}`,
      sender: 'me',
      time,
      content_translated: trimmed,
      content_original: trimmed,
      source_lang: profile.primary_language_code || 'fr',
      target_lang: selectedContact.primary_language_code || 'fr',
      status: 'sent',
    }

    setMessagesByContact((current) => ({
      ...current,
      [selectedContact.id]: [...(current[selectedContact.id] || []), message],
    }))
    setSendPulseKey((key) => key + 1)
    setDraft('')
  }

  const openContact = (user) => {
    setSelectedContact(user)
    setMobileSidebarOpen(false)
  }

  const switchAuthMode = (mode) => {
    setAuthMode(mode)
    setAuthError('')
  }

  if (!isAuthenticated) {
    return (
      <main className={`auth-shell ${theme}`}>
        <div className="auth-aurora" aria-hidden="true">
          <span className="orb orb-a" />
          <span className="orb orb-b" />
          <span className="orb orb-c" />
        </div>

        <section className="auth-hero">
          <div className="auth-brand">
            <span className="brand-glyph" aria-hidden="true">
              <Languages size={22} />
            </span>
            <span className="brand-name">NexChat</span>
          </div>

          <h1 className="auth-title">
            Parle a tout le monde,
            <br />
            <span className="auth-title-accent">dans ta langue.</span>
          </h1>

          <p className="auth-lede">
            Ecris en francais, tes amis lisent en anglais, en japonais ou en arabe. La traduction
            est instantanee, fluide, et reste fidele a ton ton.
          </p>

          <ul className="auth-highlights" aria-label="Atouts">
            {heroHighlights.map((highlight) => (
              <li key={highlight.title}>
                <span className="auth-highlight-icon" aria-hidden="true">
                  <Check size={14} strokeWidth={3} />
                </span>
                <div>
                  <strong>{highlight.title}</strong>
                  <p>{highlight.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="auth-card" aria-label="Acces a ton compte">
          <header className="auth-card-header">
            <h2>
              {authMode === 'login' ? 'Bon retour parmi nous' : 'Cree ton compte'}
            </h2>
            <p>
              {authMode === 'login'
                ? 'Reprends tes conversations la ou tu les as laissees.'
                : 'En 30 secondes, tu envoies ton premier message multilingue.'}
            </p>
          </header>

          <div className="segmented" role="tablist" data-mode={authMode}>
            <span className="segmented-indicator" aria-hidden="true" />
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'login'}
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => switchAuthMode('login')}
            >
              Connexion
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'register'}
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => switchAuthMode('register')}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form" noValidate>
            {authMode === 'register' && (
              <label className="field">
                <span className="field-label">Nom d utilisateur</span>
                <span className="field-input">
                  <UserRound size={18} strokeWidth={1.7} />
                  <input
                    value={authForm.username}
                    onChange={handleAuthChange('username')}
                    placeholder="ex. sam.chen"
                    autoComplete="username"
                    required
                  />
                </span>
              </label>
            )}

            <label className="field">
              <span className="field-label">Email</span>
              <span className="field-input">
                <UserRound size={18} strokeWidth={1.7} />
                <input
                  type="email"
                  value={authForm.email}
                  onChange={handleAuthChange('email')}
                  placeholder="toi@exemple.com"
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            <label className="field">
              <span className="field-label">Mot de passe</span>
              <span className="field-input">
                <Lock size={18} strokeWidth={1.7} />
                <input
                  type="password"
                  value={authForm.password}
                  onChange={handleAuthChange('password')}
                  placeholder="8 caracteres minimum"
                  minLength={8}
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
              </span>
            </label>

            {authMode === 'register' && (
              <label className="field">
                <span className="field-label">Confirme le mot de passe</span>
                <span className="field-input">
                  <Lock size={18} strokeWidth={1.7} />
                  <input
                    type="password"
                    value={authForm.password_confirmation}
                    onChange={handleAuthChange('password_confirmation')}
                    placeholder="Encore une fois"
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                </span>
              </label>
            )}

            {authMode === 'register' && (
              <label className="field">
                <span className="field-label">Tu lis dans quelle langue ?</span>
                <span className="field-input">
                  <Globe2 size={18} strokeWidth={1.7} />
                  <select
                    value={authForm.primary_language_code}
                    onChange={handleAuthLanguageChange}
                    required
                  >
                    {languages.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </span>
              </label>
            )}

            {authError && (
              <div className="auth-error" role="alert">
                <X size={16} strokeWidth={2.2} />
                <span>{authError}</span>
              </div>
            )}

            <button
              className={`primary-action ${authLoading ? 'is-loading' : ''}`}
              type="submit"
              disabled={authLoading}
            >
              {authLoading ? (
                <span className="dot-loader" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <>
                  <Sparkles size={17} strokeWidth={2} />
                  {authMode === 'register' ? 'Creer mon compte' : 'Se connecter'}
                </>
              )}
            </button>

            <p className="auth-switch">
              {authMode === 'login' ? (
                <>
                  Premiere fois ici ?{' '}
                  <button type="button" onClick={() => switchAuthMode('register')}>
                    Cree ton compte
                  </button>
                </>
              ) : (
                <>
                  Tu as deja un compte ?{' '}
                  <button type="button" onClick={() => switchAuthMode('login')}>
                    Connecte-toi
                  </button>
                </>
              )}
            </p>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className={`app-shell ${theme}`}>
      {mobileSidebarOpen && (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label="Fermer la liste des conversations"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <header className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-glyph small" aria-hidden="true">
              <Languages size={16} />
            </span>
            <span>NexChat</span>
          </div>
          <div className="sidebar-header-actions">
            <button
              className="icon-button"
              type="button"
              aria-label={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              className="icon-button mobile-only"
              type="button"
              aria-label="Fermer"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <label className="search-field">
          <Search size={17} strokeWidth={1.8} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un ami, un message..."
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              aria-label="Effacer la recherche"
              onClick={() => setQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </label>

        <nav className="conversation-list" aria-label="Contacts">
          {!showContacts && (
            <p className="conversation-empty">
              Tape au moins 2 caracteres pour trouver un ami par nom ou email.
            </p>
          )}

          {showContacts && contactsLoading && (
            <p className="conversation-empty">Recherche en cours...</p>
          )}

          {showContacts && !contactsLoading && contactsError && (
            <p className="conversation-empty error">{contactsError}</p>
          )}

          {showContacts &&
            !contactsLoading &&
            !contactsError &&
            displayedContacts.length === 0 && (
              <p className="conversation-empty">Aucun utilisateur trouve.</p>
            )}

          {displayedContacts.map((user) => {
            const messages = messagesByContact[user.id] || []
            const lastMessage = messages[messages.length - 1]
            const isActive = selectedContact?.id === user.id

            return (
              <button
                className={`conversation-item ${isActive ? 'active' : ''}`}
                key={user.id}
                type="button"
                onClick={() => openContact(user)}
              >
                <span className="avatar" aria-hidden="true">
                  {initials(user.username || user.email || '?')}
                  {user.is_online && <span className="presence-dot" />}
                </span>
                <span className="conversation-meta">
                  <span className="conversation-line">
                    <strong>{user.username || user.email}</strong>
                    {lastMessage && <small>{lastMessage.time}</small>}
                  </span>
                  <span className="conversation-line">
                    <small>
                      {lastMessage
                        ? lastMessage.content_translated
                        : `${languageLabel(user.primary_language_code)} · ${
                            user.is_online ? 'En ligne' : 'Hors ligne'
                          }`}
                    </small>
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <section className="profile-panel" aria-label="Mon profil">
          <span className="avatar profile-avatar" aria-hidden="true">
            {initials(profile.username || profile.email || '?')}
          </span>
          <div className="profile-info">
            <strong>{profile.username || 'Toi'}</strong>
            <span>{profile.email}</span>
          </div>
          <div className="profile-actions" data-language-menu>
            <button
              type="button"
              className="language-chip"
              aria-haspopup="listbox"
              aria-expanded={languageMenuOpen}
              onClick={() => setLanguageMenuOpen((open) => !open)}
            >
              <Globe2 size={14} strokeWidth={2} />
              {(profile.primary_language_code || 'fr').toUpperCase()}
              <ChevronDown size={13} strokeWidth={2} />
            </button>
            {languageMenuOpen && (
              <ul className="language-menu" role="listbox">
                {languages.map((language) => (
                  <li key={language.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={profile.primary_language_code === language.code}
                      className={
                        profile.primary_language_code === language.code ? 'is-selected' : ''
                      }
                      onClick={() => changeLanguage(language.code)}
                    >
                      <span className="language-flag">{language.flag}</span>
                      {language.label}
                      {profile.primary_language_code === language.code && (
                        <Check size={14} strokeWidth={2.5} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              className="icon-button ghost"
              type="button"
              aria-label="Se deconnecter"
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </section>
      </aside>

      <section className="chat-panel">
        {selectedContact ? (
          <>
            <header className="chat-header">
              <button
                className="icon-button mobile-only"
                type="button"
                aria-label="Ouvrir les conversations"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <span className="avatar" aria-hidden="true">
                {initials(selectedContact.username || selectedContact.email || '?')}
                {selectedContact.is_online && <span className="presence-dot" />}
              </span>
              <div className="chat-title">
                <h2>{selectedContact.username || selectedContact.email}</h2>
                <span>
                  {selectedContact.is_online ? 'En ligne' : 'Vu recemment'}
                  {' · '}
                  <span className="chat-language">
                    {languageLabel(selectedContact.primary_language_code)}
                  </span>
                  {' → '}
                  <span className="chat-language">
                    {languageLabel(profile.primary_language_code)}
                  </span>
                </span>
              </div>
              <div className="chat-actions">
                <button
                  className={`toggle-button ${showOriginal ? 'active' : ''}`}
                  type="button"
                  onClick={() => setShowOriginal(!showOriginal)}
                  aria-pressed={showOriginal}
                >
                  <Languages size={15} strokeWidth={1.9} />
                  <span>Original</span>
                </button>
              </div>
            </header>

            <section className="message-list" aria-label="Messages">
              {contactMessages.length === 0 ? (
                <div className="chat-empty">
                  <span className="chat-empty-glyph" aria-hidden="true">
                    <Sparkles size={22} strokeWidth={1.8} />
                  </span>
                  <h3>Aucun message pour le moment.</h3>
                  <p>
                    Envoie le premier message a{' '}
                    {selectedContact.username || selectedContact.email}. La persistance
                    cote serveur arrivera quand le backend exposera l API messages.
                  </p>
                </div>
              ) : (
                <>
                  <div className="day-divider">
                    <span>Aujourd hui</span>
                  </div>

                  {contactMessages.map((message) => {
                    const showOriginalLine =
                      showOriginal &&
                      message.content_original !== message.content_translated

                    return (
                      <article
                        className={`message ${
                          message.sender === 'me' ? 'mine' : 'theirs'
                        }`}
                        key={message.id}
                      >
                        <div className="bubble">
                          <p>{message.content_translated}</p>
                          {showOriginalLine && (
                            <small>
                              <span className="message-lang">
                                {(message.source_lang || '').toUpperCase()}
                              </span>
                              {message.content_original}
                            </small>
                          )}
                          <footer>
                            <span>{message.time}</span>
                            {message.sender === 'me' && (
                              <span
                                className="message-status"
                                aria-label={message.status}
                              >
                                {message.status === 'read' ? (
                                  <CheckCheck size={13} strokeWidth={2.2} />
                                ) : (
                                  <Check size={13} strokeWidth={2.2} />
                                )}
                              </span>
                            )}
                          </footer>
                        </div>
                      </article>
                    )
                  })}
                </>
              )}
            </section>

            <form className="composer" onSubmit={handleSendMessage} ref={composerRef}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={`Ecris en ${languageLabel(profile.primary_language_code)}...`}
                aria-label="Nouveau message"
              />
              <button
                key={sendPulseKey}
                className={`primary-action compact send-button ${
                  draft.trim() ? 'has-content' : ''
                }`}
                type="submit"
                aria-label="Envoyer"
                disabled={!draft.trim()}
              >
                <Send size={17} strokeWidth={2} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <button
              className="icon-button mobile-only chat-placeholder-toggle"
              type="button"
              aria-label="Ouvrir les conversations"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="chat-placeholder-glyph" aria-hidden="true">
              <Languages size={28} strokeWidth={1.6} />
            </span>
            <h2>Selectionne une conversation</h2>
            <p>
              Cherche un ami par nom ou email dans la barre a gauche pour ouvrir
              une discussion multilingue.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
