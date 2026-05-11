import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
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
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Wifi,
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
  { code: 'fr', label: 'Francais' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ar', label: 'العربية' },
]

const conversations = [
  {
    id: 10,
    name: 'Maya Chen',
    email: 'maya.chen@example.com',
    language: 'en',
    online: true,
    unread: 2,
    lastMessage: 'See you at 14:00?',
    messages: [
      {
        id: 100,
        sender: 'them',
        time: '13:42',
        content_translated: 'Salut Sam, tu peux relire la maquette du profil ?',
        content_original: 'Hi Sam, can you review the profile mockup?',
        source_lang: 'en',
        target_lang: 'fr',
        status: 'read',
      },
      {
        id: 101,
        sender: 'me',
        time: '13:44',
        content_translated: 'Oui, je termine la vue conversation avant.',
        content_original: 'Oui, je termine la vue conversation avant.',
        source_lang: 'fr',
        target_lang: 'en',
        status: 'read',
      },
      {
        id: 102,
        sender: 'them',
        time: '13:47',
        content_translated: 'Parfait. On garde aussi l option pour afficher le texte original.',
        content_original: 'Perfect. We also keep the option to show the original text.',
        source_lang: 'en',
        target_lang: 'fr',
        status: 'delivered',
      },
    ],
  },
  {
    id: 11,
    name: 'Diego Martin',
    email: 'diego.martin@example.com',
    language: 'es',
    online: false,
    unread: 0,
    lastMessage: 'Traduction recue.',
    messages: [
      {
        id: 200,
        sender: 'them',
        time: '10:18',
        content_translated: 'J ai recu la traduction, ca marche bien.',
        content_original: 'Recibi la traduccion, funciona bien.',
        source_lang: 'es',
        target_lang: 'fr',
        status: 'read',
      },
    ],
  },
  {
    id: 12,
    name: 'Nora Becker',
    email: 'nora.becker@example.com',
    language: 'de',
    online: true,
    unread: 0,
    lastMessage: 'Je teste les indicateurs de saisie.',
    messages: [
      {
        id: 300,
        sender: 'them',
        time: '09:05',
        content_translated: 'Je teste les indicateurs de saisie.',
        content_original: 'Ich teste die Tippanzeigen.',
        source_lang: 'de',
        target_lang: 'fr',
        status: 'delivered',
      },
    ],
  },
]

const checklist = [
  'Formulaire inscription / connexion',
  'Choix obligatoire de langue principale',
  'Liste de conversations et recherche',
  'Affichage messages traduits + original',
  'Presence, typing et etats de lecture',
]

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
      username: 'Sam Frontend',
      email: 'sam.frontend@example.com',
      primary_language_code: 'fr',
    },
  )
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState(conversations[0].id)
  const [query, setQuery] = useState('')
  const [remoteResults, setRemoteResults] = useState([])
  const [draft, setDraft] = useState('')
  const [showOriginal, setShowOriginal] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  )

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return conversations
    }

    return conversations.filter((conversation) =>
      [conversation.name, conversation.email, conversation.lastMessage]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [query])

  // Recherche distante (GET /api/profile/search) — declenche apres 2 caracteres.
  useEffect(() => {
    if (!isAuthenticated) return

    const trimmed = query.trim()
    const timeout = setTimeout(async () => {
      if (trimmed.length < 2) {
        setRemoteResults([])
        return
      }
      try {
        const data = await apiSearchUsers(trimmed)
        setRemoteResults(data?.users || [])
      } catch {
        setRemoteResults([])
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, isAuthenticated])

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
          authMode === 'register' ? 'Inscription impossible.' : 'Connexion impossible.',
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

  const handleLanguageChange = async (event) => {
    const nextLanguage = event.target.value
    const previous = profile.primary_language_code
    setProfile((current) => ({ ...current, primary_language_code: nextLanguage }))

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

  const handleSendMessage = (event) => {
    event.preventDefault()

    if (!draft.trim()) {
      return
    }

    setDraft('')
  }

  if (!isAuthenticated) {
    return (
      <main className={`auth-shell ${theme}`}>
        <section className="auth-panel">
          <div className="brand-mark" aria-hidden="true">
            <Languages size={28} />
          </div>
          <p className="eyebrow">LinguChat</p>
          <h1>Messagerie instantanee avec traduction anticipee</h1>
          <p className="auth-copy">
            Cree ton acces frontend, choisis ta langue principale et prepare les ecrans qui
            consommeront l API Laravel.
          </p>

          <div className="feature-strip" aria-label="Fonctionnalites">
            <span>
              <ShieldCheck size={16} /> Auth securisee
            </span>
            <span>
              <Wifi size={16} /> Temps reel
            </span>
            <span>
              <Globe2 size={16} /> Traduction IA
            </span>
          </div>
        </section>

        <section className="auth-card" aria-label="Connexion">
          <div className="auth-tabs">
            <button
              className={authMode === 'login' ? 'active' : ''}
              type="button"
              onClick={() => {
                setAuthMode('login')
                setAuthError('')
              }}
            >
              Connexion
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              type="button"
              onClick={() => {
                setAuthMode('register')
                setAuthError('')
              }}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authMode === 'register' && (
              <label>
                Nom utilisateur
                <span>
                  <UserRound size={18} />
                  <input
                    value={authForm.username}
                    onChange={handleAuthChange('username')}
                    placeholder="sam.frontend"
                    required
                  />
                </span>
              </label>
            )}

            <label>
              Email
              <span>
                <UserRound size={18} />
                <input
                  type="email"
                  value={authForm.email}
                  onChange={handleAuthChange('email')}
                  placeholder="toi@example.com"
                  required
                />
              </span>
            </label>

            <label>
              Mot de passe
              <span>
                <Lock size={18} />
                <input
                  type="password"
                  value={authForm.password}
                  onChange={handleAuthChange('password')}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </span>
            </label>

            {authMode === 'register' && (
              <label>
                Confirmer le mot de passe
                <span>
                  <Lock size={18} />
                  <input
                    type="password"
                    value={authForm.password_confirmation}
                    onChange={handleAuthChange('password_confirmation')}
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                </span>
              </label>
            )}

            {authMode === 'register' && (
              <label>
                Langue principale
                <span>
                  <Globe2 size={18} />
                  <select
                    value={authForm.primary_language_code}
                    onChange={handleAuthChange('primary_language_code')}
                    required
                  >
                    {languages.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} aria-hidden="true" />
                </span>
              </label>
            )}

            {authError && (
              <p className="auth-error" role="alert">
                {authError}
              </p>
            )}

            <button className="primary-action" type="submit" disabled={authLoading}>
              <Sparkles size={18} />
              {authLoading
                ? 'Patiente...'
                : authMode === 'register'
                  ? 'Creer mon compte'
                  : 'Se connecter'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className={`app-shell ${theme}`}>
      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <header className="sidebar-header">
          <div>
            <p className="eyebrow">LinguChat</p>
            <h1>Conversations</h1>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Basculer le theme"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </header>

        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un contact"
          />
        </label>

        <nav className="conversation-list" aria-label="Conversations">
          {filteredConversations.map((conversation) => (
            <button
              className={`conversation-item ${
                conversation.id === activeConversationId ? 'active' : ''
              }`}
              key={conversation.id}
              type="button"
              onClick={() => {
                setActiveConversationId(conversation.id)
                setMobileSidebarOpen(false)
              }}
            >
              <span className="avatar" aria-hidden="true">
                {conversation.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')}
              </span>
              <span className="conversation-meta">
                <strong>{conversation.name}</strong>
                <small>{conversation.lastMessage}</small>
              </span>
              <span className="conversation-state">
                <i className={conversation.online ? 'online' : ''} />
                {conversation.unread > 0 && <b>{conversation.unread}</b>}
              </span>
            </button>
          ))}

          {remoteResults.length > 0 && (
            <div className="remote-results" aria-label="Resultats de recherche API">
              <p className="eyebrow">Utilisateurs LinguChat</p>
              {remoteResults.map((user) => (
                <button
                  key={user.id}
                  className="conversation-item"
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <span className="avatar" aria-hidden="true">
                    {(user.username || '?').slice(0, 2).toUpperCase()}
                  </span>
                  <span className="conversation-meta">
                    <strong>{user.username}</strong>
                    <small>
                      {(user.primary_language_code || '').toUpperCase()} ·{' '}
                      {user.is_online ? 'En ligne' : 'Hors ligne'}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </nav>

        <section className="profile-panel" aria-label="Profil">
          <div>
            <strong>{profile.username}</strong>
            <span>{profile.email}</span>
          </div>
          <label>
            <Globe2 size={16} />
            <select value={profile.primary_language_code} onChange={handleLanguageChange}>
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.code.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </section>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <button
            className="icon-button mobile-only"
            type="button"
            aria-label="Ouvrir les conversations"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <span className="avatar large" aria-hidden="true">
            {activeConversation.name
              .split(' ')
              .map((part) => part[0])
              .join('')}
          </span>
          <div className="chat-title">
            <h2>{activeConversation.name}</h2>
            <span>
              {activeConversation.online ? 'En ligne' : 'Hors ligne'} · cible{' '}
              {profile.primary_language_code.toUpperCase()}
            </span>
          </div>
          <div className="chat-actions">
            <button
              className={`toggle-button ${showOriginal ? 'active' : ''}`}
              type="button"
              onClick={() => setShowOriginal(!showOriginal)}
            >
              <Languages size={17} />
              Original
            </button>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Bell size={19} />
            </button>
            <button className="icon-button" type="button" aria-label="Parametres">
              <Settings size={19} />
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label="Se deconnecter"
              onClick={handleLogout}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <section className="status-grid" aria-label="Avancement frontend">
          {checklist.map((item) => (
            <span key={item}>
              <CheckCheck size={16} /> {item}
            </span>
          ))}
        </section>

        <section className="message-list" aria-label="Messages">
          {activeConversation.messages.map((message) => (
            <article className={`message ${message.sender === 'me' ? 'mine' : ''}`} key={message.id}>
              <p>{message.content_translated}</p>
              {showOriginal && message.content_original !== message.content_translated && (
                <small>
                  Original {message.source_lang.toUpperCase()} : {message.content_original}
                </small>
              )}
              <footer>
                <span>{message.time}</span>
                <span>{message.status === 'read' ? 'Lu' : 'Recu'}</span>
              </footer>
            </article>
          ))}

          {activeConversation.online && (
            <div className="typing-indicator">
              <span />
              <span />
              <span />
              {activeConversation.name.split(' ')[0]} ecrit
            </div>
          )}
        </section>

        <form className="composer" onSubmit={handleSendMessage}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ecrire un message a traduire..."
          />
          <button className="primary-action compact" type="submit" aria-label="Envoyer">
            <Send size={18} />
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
