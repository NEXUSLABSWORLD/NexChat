import { useEffect, useMemo, useState, useRef } from 'react'
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
  Paperclip,
  X,
  Maximize2,
  Minimize2,
  Plus,
  BellOff,
  Filter,
  Cpu,
  EyeOff,
  MessageSquare,
  Mic,
  Square,
  UserPlus,
  Shield,
  ShieldAlert,
  UserMinus,
  AlertTriangle,
  Smile,
  Users,
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { login as apiLogin, logout as apiLogout, register as apiRegister, verifyLogin as apiVerifyLogin } from './api/auth'
import { searchUsers as apiSearchUsers, updateProfile as apiUpdateProfile, getProfile as apiGetProfile, updatePassword as apiUpdatePassword } from './api/profile'
import { getConversations as apiGetConversations, startConversation as apiStartConversation, markConversationAsRead as apiMarkConversationAsRead } from './api/conversations'
import { sendMessage as apiSendMessage, getMessages as apiGetMessages, deleteMessage as apiDeleteMessage, archiveMessage as apiArchiveMessage } from './api/messages'
import { getContacts as apiGetContacts, toggleContact as apiToggleContact, addContactByEmail as apiAddContactByEmail, getBlockedUsers as apiGetBlockedUsers, toggleBlock as apiToggleBlock, reportUser as apiReportUser } from './api/moderation'
import Feed from './components/Feed'
import AiDashboard from './components/AiDashboard'
import GroupModal from './components/GroupModal'
import GroupInfoModal from './components/GroupInfoModal'
import { createGroup as apiCreateGroup, getGroups as apiGetGroups, getGroupMessages as apiGetGroupMessages, sendGroupMessage as apiSendGroupMessage, addGroupMember as apiAddGroupMember, removeGroupMember as apiRemoveGroupMember, setGroupMemberRole as apiSetGroupMemberRole } from './api/groups'
import StoriesTray from './components/StoriesTray'
import CommandPalette from './components/CommandPalette'
import NotificationsModal from './components/NotificationsModal'
import ProfileModal from './components/ProfileModal'
import ProfilePopover from './components/ProfilePopover'
import Navbar from './components/Navbar'
import ConversationList from './components/ConversationList'
import CallPanel from './components/CallPanel'
import { getEcho, disconnectEcho } from './api/echo'
import { uploadFile } from './api/storage'

import apiClient, { clearSession, getStoredToken, getStoredUser, storeSession } from './api/client'
import { initializeSubscription } from './api/subscription'
import Landing from './Landing'
import './App.css'

const languages = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ar', name: 'العربية' },
]



const emptyAuthForm = {
  username: '',
  email: '',
  password: '',
  password_confirmation: '',
  primary_language_code: 'fr',
}

function formatTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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
  const [view, setView] = useState(isAuthenticated ? 'chat' : 'landing')
  const [authMode, setAuthMode] = useState('login')
  const [themeMode, setThemeMode] = useState(localStorage.getItem('nexchat_theme') || 'dark')
  
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const applyTheme = () => {
      if (themeMode === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(isDark ? 'dark' : 'light')
      } else {
        setTheme(themeMode)
      }
    }

    applyTheme()
    localStorage.setItem('nexchat_theme', themeMode)

    if (themeMode === 'system') {
      const matcher = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = (e) => setTheme(e.matches ? 'dark' : 'light')
      matcher.addEventListener('change', onChange)
      return () => matcher.removeEventListener('change', onChange)
    }
  }, [themeMode])
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
  const [authSuccessMsg, setAuthSuccessMsg] = useState('')

  // Handle pending subscription after signup/login
  useEffect(() => {
    if (isAuthenticated) {
      const pendingPlan = localStorage.getItem('pending_subscription_plan')
      if (pendingPlan) {
        localStorage.removeItem('pending_subscription_plan')
        initializeSubscription(pendingPlan)
          .then((data) => {
            if (data.authorization_url) {
              window.location.href = data.authorization_url
            }
          })
          .catch((err) => {
            console.error('Auto subscription error:', err)
          })
      }
    }
  }, [isAuthenticated])

  // Handle URL verification automatically
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('verify_token')
    const email = params.get('email')

    if (token && email) {
      setAuthMode('verify')
      setView('auth')
      setAuthLoading(true)
      
      apiVerifyLogin({ email, token })
        .then(({ user, token: authToken }) => {
          storeSession({ token: authToken, user })
          setProfile(user)
          setIsAuthenticated(true)
          setView('chat')
          // Remove query params
          window.history.replaceState({}, document.title, window.location.pathname)
        })
        .catch((error) => {
          setAuthError(extractErrorMessage(error, 'Lien de vérification invalide ou expiré.'))
        })
        .finally(() => {
          setAuthLoading(false)
        })
    }
  }, [])

  // Conversations & messages
  const [conversationList, setConversationList] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [convLoading, setConvLoading] = useState(false)

  // UI
  const [query, setQuery] = useState('')
  const [remoteResults, setRemoteResults] = useState([])
  const [draft, setDraft] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAiMenu, setShowAiMenu] = useState(false)
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [smartReplies, setSmartReplies] = useState([])
  const [messagesFilter, setMessagesFilter] = useState('all') // 'all', 'unread', 'contacts', 'archived'
  const [showMessagesMenu, setShowMessagesMenu] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false)
  const [activeGroupId, setActiveGroupId] = useState(null)
  const [activeGroupDetails, setActiveGroupDetails] = useState(null)
  const [groups, setGroups] = useState([])
  const [convContextMenu, setConvContextMenu] = useState({ visible: false, x: 0, y: 0, conversationId: null })
  const [archivedConversationIds, setArchivedConversationIds] = useState(() => {
    const saved = localStorage.getItem('nexchat_archived_convs');
    return saved ? JSON.parse(saved) : [];
  })

  useEffect(() => {
    localStorage.setItem('nexchat_archived_convs', JSON.stringify(archivedConversationIds));
  }, [archivedConversationIds])
  
  // Safety & Moderation States (Moved up to avoid ReferenceError in useMemo)
  const [contacts, setContacts] = useState([])
  const [contactUsers, setContactUsers] = useState([])
  const [blockedUsers, setBlockedUsers] = useState([])
  const [showSecurityMenu, setShowSecurityMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('spam')
  const [reportDescription, setReportDescription] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [showOriginal, setShowOriginal] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState('chat') // 'chat' or 'feed'
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null })
  
  // Premium Hamburger & Compact View UI States
  const [sidebarMode, setSidebarMode] = useState('full') // 'full' | 'compact'
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [dndMode, setDndMode] = useState(false)
  const [filterUnread, setFilterUnread] = useState(false)
  
  // Typing indicators
  const [typingUser, setTypingUser] = useState(null)
  const typingTimeoutRef = useRef(null)

  // File upload
  const fileInputRef = useRef(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const voiceMessageRecorderRef = useRef(null)
  const voiceMessageChunksRef = useRef([])

  const activeConversation = conversationList.find((c) => c.id === activeConversationId) || null
  const activeGroup = groups.find((g) => g.id === activeGroupId) || null

  const handleAiRephrase = async (tone) => {
    if (!draft.trim()) return;
    setIsAiProcessing(true);
    setShowAiMenu(false);
    try {
      const res = await apiClient.post('/ai/rephrase', { text: draft, tone });
      if (res.data?.data) {
        setDraft(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAiSmartReplies = async () => {
    if (!activeConversation) return;
    setIsAiProcessing(true);
    setShowAiMenu(false);
    try {
      const res = await apiClient.post('/ai/smart-replies', { conversation_id: activeConversation.id });
      if (res.data?.data) {
        setSmartReplies(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAiGroupSummary = async () => {
    if (!activeGroup) return;
    setIsAiProcessing(true);
    try {
      const res = await apiClient.post(`/groups/${activeGroup.id}/summarize`);
      if (res.data?.summary || res.data?.data) {
        alert("Résumé IA : \n\n" + (res.data.summary || res.data.data));
      } else {
        alert("Erreur lors de la génération du résumé.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    } finally {
      setIsAiProcessing(false);
    }
  };


  const filteredConversations = useMemo(() => {
    let list = conversationList
    
    // Apply messages filter
    if (messagesFilter === 'archived') {
      list = list.filter((c) => archivedConversationIds.includes(c.id))
    } else {
      // For 'all', 'unread', 'contacts', exclude archived conversations unless searching
      if (!query.trim()) {
        list = list.filter((c) => !archivedConversationIds.includes(c.id))
      }
      
      if (messagesFilter === 'unread') {
        list = list.filter((c) => c.unread_count > 0)
      } else if (messagesFilter === 'contacts') {
        const contactIds = new Set(contacts.map((contact) => Number(contact)))
        list = list.filter((c) => c.other_user && contactIds.has(Number(c.other_user.id)))
      }
    }
    
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return list
    return list.filter((c) =>
      [c.other_user?.username, c.latest_message?.content_original]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [query, conversationList, messagesFilter, contacts, archivedConversationIds])

  const unifiedList = useMemo(() => {
    const convs = filteredConversations.map(c => ({
      ...c,
      isGroup: false,
      displayName: c.other_user?.username,
      displayAvatar: c.other_user?.avatar_url,
      timestamp: c.last_message_at || c.created_at
    }));

    const grps = messagesFilter === 'contacts' ? [] : groups.map(g => ({
      ...g,
      isGroup: true,
      displayName: g.name,
      displayAvatar: g.avatar_url,
      timestamp: g.created_at
    }));

    const existingConversationContactIds = new Set(conversationList.map((conversation) => Number(conversation.other_user?.id)))
    const contactOnlyUsers = messagesFilter === 'contacts'
      ? contactUsers
          .filter((contact) => !existingConversationContactIds.has(Number(contact.id)))
          .filter((contact) => {
            const normalizedQuery = query.trim().toLowerCase()
            return !normalizedQuery
              || `${contact.username} ${contact.email}`.toLowerCase().includes(normalizedQuery)
          })
          .map((contact) => ({
            id: `contact-${contact.id}`,
            contactUserId: contact.id,
            isContactOnly: true,
            isGroup: false,
            displayName: contact.username,
            displayAvatar: contact.avatar_url,
            other_user: contact,
            timestamp: contact.last_seen_at || contact.created_at || 0,
          }))
      : []

    return [...convs, ...contactOnlyUsers, ...grps].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [filteredConversations, groups, conversationList, contactUsers, messagesFilter, query])

  // Settings & Profile State (Moved to top level to follow Rules of Hooks)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsProfile, setSettingsProfile] = useState({
    username: profile.username,
    primary_language_code: profile.primary_language_code,
    bio: profile.bio || '',
    auto_translate: true,
    accent_color: '#a855f7'
  })
  const avatarInputRef = useRef(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Cyberpunk Profile States
  const [showProfilePopover, setShowProfilePopover] = useState(false)
  const [userStatus, setUserStatus] = useState(localStorage.getItem('nexchat_user_status') || 'available')
  const [avatarFilter, setAvatarFilter] = useState(localStorage.getItem('nexchat_avatar_filter') || 'normal')
  const [isLocked, setIsLocked] = useState(false)
  const [lockInput, setLockInput] = useState('')
  const [lockError, setLockError] = useState(false)
  const [voiceUrl, setVoiceUrl] = useState(localStorage.getItem('nexchat_voice_url') || '')
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)

  // Command Palette States
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [commandSelectedIndex, setCommandSelectedIndex] = useState(0)

  useEffect(() => {
    if (userStatus === 'dnd') {
      setDndMode(true)
    } else {
      setDndMode(false)
    }
    localStorage.setItem('nexchat_user_status', userStatus)
  }, [userStatus])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          const base64Audio = reader.result
          setVoiceUrl(base64Audio)
          localStorage.setItem('nexchat_voice_url', base64Audio)
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (e) {
      alert("Impossible d'accéder au microphone : " + e.message)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const playVoice = () => {
    if (!voiceUrl || isPlayingVoice) return
    setIsPlayingVoice(true)
    const audio = new Audio(voiceUrl)
    audio.play().catch(e => console.warn(e))
    audio.onended = () => {
      setIsPlayingVoice(false)
    }
  }

  // Memoized lists and keyboard event listener for Command Palette
  const allCommandItems = useMemo(() => {
    const list = [
      {
        id: 'sys-lock',
        category: 'Actions Système',
        label: 'Verrouiller le Cockpit',
        sublabel: "Bloque instantanément l'interface",
        icon: 'Lock',
        shortcut: '⌥L',
        action: () => { setIsLocked(true); setShowCommandPalette(false); }
      },
      {
        id: 'sys-theme',
        category: 'Actions Système',
        label: `Thème : ${theme === 'light' ? 'Mode Sombre' : 'Mode Clair'}`,
        sublabel: "Bascule l'apparence visuelle",
        icon: theme === 'light' ? 'Moon' : 'Sun',
        shortcut: '⌥T',
        action: () => { setTheme(theme === 'light' ? 'dark' : 'light'); setShowCommandPalette(false); }
      },
      {
        id: 'sys-status-online',
        category: 'Actions Système',
        label: 'Statut : Disponible',
        sublabel: 'Halo néon vert actif',
        icon: 'Sparkles',
        shortcut: '⌥1',
        action: () => { setUserStatus('available'); setShowCommandPalette(false); }
      },
      {
        id: 'sys-status-dnd',
        category: 'Actions Système',
        label: 'Statut : Ne Pas Déranger',
        sublabel: 'Halo rouge silencieux',
        icon: 'BellOff',
        shortcut: '⌥2',
        action: () => { setUserStatus('dnd'); setShowCommandPalette(false); }
      },
      {
        id: 'sys-status-ai',
        category: 'Actions Système',
        label: 'Statut : Assistant NexIA',
        sublabel: 'Auto-répondeur intelligent actif',
        icon: 'Cpu',
        shortcut: '⌥3',
        action: () => { setUserStatus('ai'); setShowCommandPalette(false); }
      },
      {
        id: 'sys-status-focus',
        category: 'Actions Système',
        label: 'Statut : Concentré',
        sublabel: 'Halo orange de focus actif',
        icon: 'EyeOff',
        shortcut: '⌥4',
        action: () => { setUserStatus('focus'); setShowCommandPalette(false); }
      }
    ];

    // Add active conversations
    conversationList.forEach(c => {
      list.push({
        id: `conv-${c.id}`,
        category: 'Discussions Actives',
        label: `Discussion avec ${c.other_user?.username || 'Utilisateur'}`,
        sublabel: `Langue: ${(c.other_user?.primary_language_code || 'FR').toUpperCase()}`,
        icon: 'MessageSquare',
        action: () => { setActiveConversationId(c.id); setShowCommandPalette(false); }
      });
    });

    // Add user suggestions if there are any
    remoteResults.forEach(u => {
      list.push({
        id: `user-${u.id}`,
        category: 'Contacts Suggérés (API)',
        label: `Démarrer discussion avec ${u.username}`,
        sublabel: `Nouvelle conversation • Langue: ${(u.primary_language_code || 'FR').toUpperCase()}`,
        icon: 'UserPlus',
        action: () => { handleStartConversation(u); setShowCommandPalette(false); }
      });
    });

    return list;
  }, [theme, conversationList, remoteResults, userStatus]);

  const filteredCommandItems = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) return allCommandItems;
    return allCommandItems.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.sublabel.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q)
    );
  }, [allCommandItems, commandQuery]);

  useEffect(() => {
    setCommandSelectedIndex(0);
  }, [commandQuery]);

  // Sync keyboard shortcuts and events
  useEffect(() => {
    if (showCommandPalette) {
      setQuery(commandQuery);
    }
  }, [commandQuery, showCommandPalette]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle Ctrl+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        setCommandQuery('');
        return;
      }

      if (!showCommandPalette) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandPalette(false);
        return;
      }

      const total = filteredCommandItems.length;
      if (total === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCommandSelectedIndex(prev => (prev + 1) % total);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCommandSelectedIndex(prev => (prev - 1 + total) % total);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommandItems[commandSelectedIndex];
        if (selected && selected.action) {
          selected.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, filteredCommandItems, commandSelectedIndex]);

  // Notifications, Wizz (Shake) and Audio Synthesis Engine
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const subscribedConvIds = useRef(new Set())
  const backgroundMessageIds = useRef(new Set())

  const triggerNudgeEffect = () => {
    if (dndMode) return
    // 1. Synthétiser un son Premium de Wizz en temps réel (zéro dépendance à un fichier audio externe !)
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'sine'
      // Glissement de fréquence ascendant/descendant style Wizz MSN retro-futuriste
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.15)
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.45)
      
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.45)
    } catch (e) {
      console.warn("L'AudioContext du navigateur a été bloqué ou n'est pas supporté.", e)
    }

    // 2. Vibration visuelle de l'écran (Shake)
    setIsShaking(true)
    setTimeout(() => {
      setIsShaking(false)
    }, 450)
  }


  // Synchroniser les paramètres quand le profil change
  useEffect(() => {
    if (profile) {
      setSettingsProfile(prev => ({
        ...prev,
        username: profile.username,
        primary_language_code: profile.primary_language_code,
        bio: profile.bio || ''
      }))
    }
  }, [profile])

  // Charger les conversations à la connexion
  useEffect(() => {
    if (!isAuthenticated) {
      setConversationList([])
      setActiveConversationId(null)
      setMessages([])
      return
    }
    setConvLoading(true)
    apiGetConversations()
      .then((data) => {
        const list = data?.conversations || []
        setConversationList(list)
        if (list.length > 0) {
          setActiveConversationId(list[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setConvLoading(false))

    apiGetGroups()
      .then((data) => {
        setGroups(data.groups || [])
      })
      .catch(() => {})

    // Load safety states
    apiGetContacts()
      .then((data) => {
        const users = Array.isArray(data) ? data : []
        setContactUsers(users)
        setContacts(users.map((contact) => Number(contact.id)))
      })
      .catch(() => {
        setContactUsers([])
        setContacts([])
      })
    apiGetBlockedUsers().then(data => setBlockedUsers(data || [])).catch(() => {})
  }, [isAuthenticated])

  // Charger les messages quand la conversation ou le groupe actif change
  useEffect(() => {
    if (!activeConversationId && !activeGroupId) {
      setMessages([])
      return
    }
    setMessagesLoading(true)

    if (activeConversationId) {
      apiGetMessages(activeConversationId)
        .then((data) => {
          // Laravel paginate retourne { data: [...] }
          setMessages(data?.data || [])

          // Marquer la conversation comme lue
          apiMarkConversationAsRead(activeConversationId).then(() => {
            setConversationList((prev) => 
              prev.map(c => c.id === activeConversationId ? { ...c, unread_count: 0 } : c)
            )
          }).catch(() => {})
        })
        .catch(() => setMessages([]))
        .finally(() => setMessagesLoading(false))
    } else if (activeGroupId) {
      apiGetGroupMessages(activeGroupId)
        .then((data) => {
          // Le backend retourne { group, messages }
          setMessages(data?.messages || [])
          setActiveGroupDetails(data?.group || null)
        })
        .catch(() => {
          setMessages([])
          setActiveGroupDetails(null)
        })
        .finally(() => setMessagesLoading(false))
    }
  }, [activeConversationId, activeGroupId])

  // Écoute les messages en temps réel via Reverb WebSocket
  useEffect(() => {
    if ((!activeConversationId && !activeGroupId) || !isAuthenticated) return

    const echo = getEcho()

    if (activeConversationId) {
      const channel = echo.private(`conversation.${activeConversationId}`)

      channel.listen('.message.sent', (event) => {
        const incomingMsg = event.message
        if (!incomingMsg?.id) {
          apiGetMessages(activeConversationId)
            .then((data) => setMessages(data?.data || []))
            .catch(() => {})
          return
        }
        
        // Si c'est un nudge/wizz, déclencher l'effet premium !
        if (incomingMsg.content_original === '🔔 NUDGE' && incomingMsg.sender_id !== profile.id) {
          triggerNudgeEffect()
        }

        setMessages((prev) => {
          const index = prev.findIndex((m) => m.id === incomingMsg.id)
          if (index !== -1) {
            // Mise à jour d'un message existant (traduction ou suppression)
            const newMessages = [...prev]
            newMessages[index] = incomingMsg
            return newMessages
          }
          // Ajout d'un nouveau message s'il ne vient pas de nous
          if (incomingMsg.sender_id !== profile.id) {
            // Puisqu'on est sur la conversation active, on marque comme lu
            apiMarkConversationAsRead(activeConversationId).catch(() => {})
            return [...prev, incomingMsg]
          }
          return prev
        })

        // Mettre à jour le dernier message dans la liste des conversations
        setConversationList((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, latest_message: incomingMsg, last_message_at: incomingMsg.created_at }
              : c,
          ),
        )
      })

      channel.listen('.messages.read', (event) => {
        if (event.read_by_user_id !== profile.id) {
          setMessages((prev) => 
            prev.map((m) => 
              (m.sender_id === profile.id && !m.is_read) ? { ...m, is_read: true } : m
            )
          )
        }
      })

      channel.listenForWhisper('typing', (e) => {
        if (e.userId !== profile.id) {
          setTypingUser(e.username)
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null)
          }, 3000)
        }
      })
    } else if (activeGroupId) {
      const channel = echo.private(`group.${activeGroupId}`)

      channel.listen('.group.message.sent', (event) => {
        const incomingMsg = event.groupMessage
        const userLanguage = profile.primary_language_code || 'fr'
        const cachedTranslation = incomingMsg.translations?.find(
          (translation) => translation.language_code === userLanguage,
        )
        const localizedMsg = incomingMsg.source_lang === userLanguage
          ? { ...incomingMsg, content_translated: null }
          : cachedTranslation
            ? {
                ...incomingMsg,
                content_translated: cachedTranslation.translated_content,
                target_lang: userLanguage,
              }
            : incomingMsg
        
        setMessages((prev) => {
          const index = prev.findIndex((m) => m.id === localizedMsg.id)
          if (index !== -1) return prev
          return [...prev, localizedMsg]
        })
      })
    }

    return () => {
      if (activeConversationId) {
        subscribedConvIds.current.delete(activeConversationId)
        echo.leave(`conversation.${activeConversationId}`)
      }
      if (activeGroupId) echo.leave(`group.${activeGroupId}`)
    }
  }, [activeConversationId, activeGroupId, isAuthenticated, profile.id, profile.primary_language_code])

  // Écouter TOUTES les conversations en arrière-plan pour les notifications globales et les Wizz
  useEffect(() => {
    if (!isAuthenticated || conversationList.length === 0) return

    const echo = getEcho()

    conversationList.forEach((c) => {
      if (subscribedConvIds.current.has(c.id)) return

      const channel = echo.private(`conversation.${c.id}`)

      channel.listen('.message.sent', (event) => {
        const incomingMsg = event.message

        // Ignorer nos propres messages
        if (incomingMsg.sender_id === profile.id) return

        // Si le message arrive dans la conversation active, le listener principal s'en occupe
        if (c.id === activeConversationId) return

        const isTranslationUpdate = backgroundMessageIds.current.has(incomingMsg.id)
        backgroundMessageIds.current.add(incomingMsg.id)

        // 1. Incrémenter le badge non-lu dans la barre latérale
        setConversationList((prev) =>
          prev.map((item) =>
            item.id === c.id
              ? {
                  ...item,
                  unread_count: isTranslationUpdate
                    ? item.unread_count || 0
                    : (item.unread_count || 0) + 1,
                  latest_message: incomingMsg,
                  last_message_at: incomingMsg.created_at,
                }
              : item
          )
        )

        // 2. Détecter le type de message pour la notification
        let notifText = incomingMsg.content_original
        if (incomingMsg.content_original === '🔔 NUDGE') {
          notifText = '🔔 vous a envoyé un Wizz !'
          triggerNudgeEffect() // Effet sonore et vibration en arrière-plan (Super Premium !)
        } else if (incomingMsg.file_url) {
          notifText = `📎 Fichier : ${incomingMsg.file_name}`
        }

        // 3. Ajouter au centre de notifications global
        if (!isTranslationUpdate) {
          setNotifications((prev) => [
            {
              id: incomingMsg.id,
              conversationId: c.id,
              senderName: c.other_user?.username || 'Quelqu’un',
              senderAvatar: c.other_user?.avatar_url,
              text: notifText,
              time: new Date(incomingMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false,
            },
            ...prev,
          ])
        }
      })

      subscribedConvIds.current.add(c.id)
    })
  }, [conversationList, isAuthenticated, activeConversationId, profile.id])


  // Fermer le menu contextuel et le popover au clic ailleurs
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(prev => ({ ...prev, visible: false }))
      setConvContextMenu(prev => ({ ...prev, visible: false }))
      setShowQuickActions(false)
      setShowProfilePopover(false)
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  // Déconnecter Echo au logout
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
    setAuthSuccessMsg('')
    setAuthLoading(true)
    try {
      if (authMode === 'register') {
        const response = await apiRegister({
          username: authForm.username,
          email: authForm.email,
          password: authForm.password,
          password_confirmation: authForm.password_confirmation,
          primary_language_code: authForm.primary_language_code,
        })
        
        setAuthMode('verify')
        setAuthSuccessMsg('Un e-mail de validation a été envoyé. Veuillez vérifier votre boîte de réception.')
        setAuthForm((current) => ({ ...current, password: '', password_confirmation: '' }))
      } else if (authMode === 'login') {
        const response = await apiLogin({
          email: authForm.email,
          password: authForm.password,
        })
        
        if (response.message === 'verification_required') {
          setAuthMode('verify')
          setAuthSuccessMsg('Un e-mail de validation a été envoyé. Veuillez vérifier votre boîte de réception.')
          setAuthForm((current) => ({ ...current, password: '', password_confirmation: '' }))
        } else {
          storeSession({ token: response.token, user: response.user })
          setProfile(response.user)
          setIsAuthenticated(true)
          setView('chat')
          setAuthForm((current) => ({ ...current, password: '', password_confirmation: '' }))
        }
      }
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
    // 1. Déconnexion locale immédiate (toujours exécutée)
    try { disconnectEcho() } catch { /* ignore */ }
    clearSession()
    setIsAuthenticated(false)
    setView('landing')
    setProfile((current) => ({ ...current, id: null }))
    setAuthForm(emptyAuthForm)
    setConversationList([])
    setMessages([])
    setActiveConversationId(null)

    // 2. Informer le backend (best-effort — on ne bloque pas si ça échoue)
    if (profile?.id) {
      apiLogout({ user_id: profile.id }).catch(() => {})
    }
  }

  const handleLanguageChange = async (event) => {
    const nextLanguage = event.target.value
    const previous = profile.primary_language_code
    setProfile((current) => ({ ...current, primary_language_code: nextLanguage }))
    if (!profile?.id) return
    try {
      const data = await apiUpdateProfile(profile.id, { primary_language_code: nextLanguage })
      if (data?.user) {
        setProfile(data.user)
        storeSession({ user: data.user })
      }
    } catch {
      setProfile((current) => ({ ...current, primary_language_code: previous }))
    }
  }

  const handleDraftChange = (event) => {
    setDraft(event.target.value)
    
    if (activeConversationId && isAuthenticated) {
      const echo = getEcho()
      const channel = echo.private(`conversation.${activeConversationId}`)
      channel.whisper('typing', {
        userId: profile.id,
        username: profile.username
      })
    }
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if ((!content) || (!activeConversationId && !activeGroupId) || sendingMessage) return

    setSendingMessage(true)
    setDraft('')
    setShowEmojiPicker(false)

    // Mise à jour optimiste
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId,
      sender_id: profile.id,
      content_original: content,
      content_translated: null,
      source_lang: profile.primary_language_code,
      target_lang: null,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: profile
    }
    if (activeGroupId) {
      optimisticMsg.group_id = activeGroupId
      delete optimisticMsg.conversation_id
    }
    setMessages((prev) => [...prev, optimisticMsg])

    try {
      let data;
      if (activeConversationId) {
        const response = await apiSendMessage(activeConversationId, content)
        data = response.data
      } else if (activeGroupId) {
        const response = await apiSendGroupMessage(activeGroupId, content)
        data = response.group_message
      }

      if (!data?.id) {
        throw new Error('Le serveur n’a pas renvoyé le message créé.')
      }

      setMessages((prev) => {
        const hasOptimisticMessage = prev.some((m) => m.id === optimisticMsg.id)
        if (hasOptimisticMessage) {
          return prev.map((m) => (m.id === optimisticMsg.id ? data : m))
        }
        if (prev.some((m) => m.id === data.id)) return prev
        return [...prev, data]
      })
      
      if (activeConversationId) {
        setConversationList((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, latest_message: data, last_message_at: data.created_at }
              : c,
          ),
        )
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setDraft(content)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSendNudge = async () => {
    if (!activeConversationId || sendingMessage) return
    setSendingMessage(true)

    const nudgeText = "🔔 NUDGE"
    
    // Ajout optimiste du Nudge dans le chat
    const optimisticMsg = {
      id: `temp-nudge-${Date.now()}`,
      conversation_id: activeConversationId,
      sender_id: profile.id,
      content_original: nudgeText,
      content_translated: null,
      source_lang: profile.primary_language_code,
      target_lang: null,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])

    try {
      const data = await apiSendMessage(activeConversationId, nudgeText)
      setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? data.data : m)))
      setConversationList((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, latest_message: data.data, last_message_at: data.data.created_at }
            : c,
        ),
      )
      
      // Déclencher le son et la secousse localement pour le feedback immédiat !
      triggerNudgeEffect()
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
    } finally {
      setSendingMessage(false)
    }
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !activeConversationId) return
    event.target.value = ''

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const fileData = await uploadFile(file, profile.id, (pct) => setUploadProgress(pct))

      // Optimistic file message
      const optimisticMsg = {
        id: `temp-file-${Date.now()}`,
        conversation_id: activeConversationId,
        sender_id: profile.id,
        content_original: '',
        is_read: false,
        created_at: new Date().toISOString(),
        ...fileData,
      }

      const handleVoiceRecording = async () => {
        if (isRecordingVoice) {
          voiceMessageRecorderRef.current?.stop()
          return
        }

        if (!activeConversationId || isUploading || sendingMessage) return
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
          alert('Les messages vocaux ne sont pas pris en charge par ce navigateur.')
          return
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm'
          const recorder = new MediaRecorder(stream, { mimeType })
          voiceMessageChunksRef.current = []
          voiceMessageRecorderRef.current = recorder
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) voiceMessageChunksRef.current.push(event.data)
          }
          recorder.onstop = async () => {
            stream.getTracks().forEach((track) => track.stop())
            setIsRecordingVoice(false)
            const blob = new Blob(voiceMessageChunksRef.current, { type: mimeType })
            if (!blob.size) return

            setIsUploading(true)
            setUploadProgress(0)
            try {
              const file = new File([blob], `voice-${Date.now()}.webm`, { type: mimeType })
              const fileData = await uploadFile(file, profile.id, (pct) => setUploadProgress(pct))
              const response = await apiSendMessage(activeConversationId, null, fileData)
              const data = response.data
              setMessages((prev) => prev.some((message) => message.id === data.id) ? prev : [...prev, data])
              setConversationList((prev) => prev.map((conversation) =>
                conversation.id === activeConversationId
                  ? { ...conversation, latest_message: data, last_message_at: data.created_at }
                  : conversation,
              ))
            } catch (error) {
              alert(`Erreur lors de l'envoi vocal : ${error.message}`)
            } finally {
              setIsUploading(false)
              setUploadProgress(0)
            }
          }
          recorder.start()
          setIsRecordingVoice(true)
        } catch (error) {
          alert(`Accès au microphone refusé : ${error.message}`)
        }
      }
      setMessages((prev) => [...prev, optimisticMsg])

      const data = await apiSendMessage(activeConversationId, null, fileData)
      setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? data.data : m)))
      setConversationList((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, latest_message: data.data, last_message_at: data.data.created_at }
            : c,
        ),
      )
    } catch (err) {
      alert('Erreur lors de l’upload : ' + err.message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleStartConversation = async (user) => {
    try {
      const data = await apiStartConversation(user.id)
      const newConv = data.conversation
      setConversationList((prev) => {
        if (prev.find((c) => c.id === newConv.id)) return prev
        return [newConv, ...prev]
      })
      setActiveConversationId(newConv.id)
      setQuery('')
      setRemoteResults([])
      setMobileSidebarOpen(false)
    } catch {}
  }

  const handleAddContactByEmail = async (email) => {
    const normalizedEmail = email.trim()
    if (!normalizedEmail) return

    const result = await apiAddContactByEmail(normalizedEmail)
    const contactId = result.contact?.id
    if (contactId && !contacts.includes(Number(contactId))) {
      setContacts((current) => [...current, Number(contactId)])
      if (result.contact) {
        setContactUsers((current) => [...current.filter((contact) => Number(contact.id) !== Number(contactId)), result.contact])
      }
    }
  }

  const handleMessageContextMenu = (e, messageId) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      messageId
    })
  }

  const handleDeleteMessage = async () => {
    if (!contextMenu.messageId) return
    try {
      await apiDeleteMessage(contextMenu.messageId)
      // La mise à jour sera reçue via Echo (broadcasting)
    } catch (err) {
      alert('Erreur lors de la suppression : ' + (err.response?.data?.message || err.message))
    }
  }

  const handleArchiveMessage = async () => {
    if (!contextMenu.messageId) return
    try {
      await apiArchiveMessage(contextMenu.messageId)
      setMessages(prev => prev.filter(m => m.id !== contextMenu.messageId))
    } catch (err) {
      alert('Erreur lors de l\'archivage')
    }
  }

  const handleCreateGroup = async (groupData) => {
    try {
      const data = await apiCreateGroup(groupData)
      if (data.group) {
        alert('Groupe créé avec succès !')
        setGroups(prev => [...prev, data.group])
      } else {
        alert('Erreur : ' + (data.message || 'Impossible de créer le groupe'))
      }
    } catch (err) {
      alert('Erreur lors de la création du groupe')
    }
  }

  const handleAddGroupMember = async (groupId, userId) => {
    try {
      const data = await apiAddGroupMember(groupId, userId)
      if (data.message === 'Member added successfully') {
        setActiveGroupDetails(prev => ({ ...prev, members: [...prev.members, data.member] }))
      }
    } catch (err) {
      alert("Erreur lors de l'ajout du membre")
    }
  }

  const handleRemoveGroupMember = async (groupId, userId) => {
    try {
      await apiRemoveGroupMember(groupId, userId)
      setActiveGroupDetails(prev => ({ ...prev, members: prev.members.filter(m => m.user_id !== userId) }))
    } catch (err) {
      alert('Erreur lors de la suppression du membre')
    }
  }

  const handleSetGroupMemberRole = async (groupId, userId, role) => {
    try {
      await apiSetGroupMemberRole(groupId, userId, role)
      setActiveGroupDetails(prev => ({ 
        ...prev, 
        members: prev.members.map(m => m.user_id === userId ? { ...m, role } : m) 
      }))
    } catch (err) {
      alert('Erreur lors du changement de rôle')
    }
  }

  if (!isAuthenticated && view === 'landing') {
    return (
      <Landing 
        onGetStarted={() => { setAuthMode('register'); setView('auth'); }} 
        onLogin={() => { setAuthMode('login'); setView('auth'); }} 
      />
    )
  }

  if (!isAuthenticated && view === 'auth') {
    return (
      <div className={`auth-container ${theme}`}>
        <div className="auth-card">
          <div style={{ textAlign: 'left', marginBottom: '10px' }}>
            <button 
              onClick={() => setView('landing')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ← Retour à l'accueil
            </button>
          </div>
          <h1 className="auth-title">
            <Languages size={28} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            NexChat
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
            La messagerie instantanée réinventée avec traduction IA.
          </p>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authMode === 'register' && (
              <input
                className="auth-input"
                value={authForm.username}
                onChange={handleAuthChange('username')}
                placeholder="Votre nom d'utilisateur"
                required
              />
            )}

            {authMode === 'verify' && (
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <p style={{ color: 'var(--primary-color)' }}>Consultez vos e-mails !</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '10px' }}>
                  Nous avons envoyé un lien de connexion à l'adresse <strong>{authForm.email}</strong>. Cliquez sur ce lien pour valider votre connexion.
                </p>
                {authLoading && <p style={{ marginTop: '15px' }}>Vérification en cours...</p>}
              </div>
            )}

            {authMode !== 'verify' && (
              <>
                <input
                  className="auth-input"
                  type="email"
                  value={authForm.email}
                  onChange={handleAuthChange('email')}
                  placeholder="Votre adresse email"
                  required
                />

                <input
                  className="auth-input"
                  type="password"
                  value={authForm.password}
                  onChange={handleAuthChange('password')}
                  placeholder="Mot de passe"
                  minLength={8}
                  required
                />
              </>
            )}

            {authMode === 'register' && (
              <>
                <input
                  className="auth-input"
                  type="password"
                  value={authForm.password_confirmation}
                  onChange={handleAuthChange('password_confirmation')}
                  placeholder="Confirmez le mot de passe"
                  minLength={8}
                  required
                />
                <select
                  className="auth-input"
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
              </>
            )}

            {authSuccessMsg && <p className="success-msg" style={{ color: '#10b981', textAlign: 'center', marginBottom: '15px' }}>{authSuccessMsg}</p>}
            {authError && <p className="error-msg">{authError}</p>}

            {authMode !== 'verify' && (
              <button className="auth-btn" type="submit" disabled={authLoading}>
                {authLoading
                  ? 'Chargement...'
                  : authMode === 'register'
                    ? 'Créer mon compte'
                    : 'Se connecter'}
              </button>
            )}
          </form>

          <p className="auth-switch">
            {authMode === 'login' ? "Pas encore de compte ? " : (authMode === 'register' ? "Déjà un compte ? " : "")}
            {authMode !== 'verify' && (
              <span onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); setAuthSuccessMsg('') }}>
                {authMode === 'login' ? "S'inscrire" : "Se connecter"}
              </span>
            )}
            {authMode === 'verify' && (
              <span onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccessMsg('') }}>
                ← Retour à la connexion
              </span>
            )}
          </p>
        </div>
      </div>
    )
  }


  const handleToggleContact = async (otherUserId) => {
    if (!otherUserId) return
    try {
      const result = await apiToggleContact(otherUserId)
      const isContact = result.status === 'removed' // If it was removed, it WAS a contact
      
      let updated
      if (isContact) {
        updated = contacts.filter(id => Number(id) !== Number(otherUserId))
      } else {
        updated = [...contacts, Number(otherUserId)]
      }
      setContacts(updated)
      if (isContact) {
        setContactUsers((current) => current.filter((contact) => Number(contact.id) !== Number(otherUserId)))
      } else if (activeConversation?.other_user) {
        setContactUsers((current) => [
          ...current.filter((contact) => Number(contact.id) !== Number(otherUserId)),
          activeConversation.other_user,
        ])
      }

      // Add activity notification
      const recipientName = activeConversation?.other_user?.username || 'Utilisateur'
      const newNotif = {
        id: Date.now().toString(),
        type: 'security',
        title: isContact ? 'Contact Retiré' : 'Contact Ajouté',
        text: isContact 
          ? `${recipientName} a été retiré de votre liste de contacts.` 
          : `${recipientName} a été ajouté à vos contacts avec succès.`,
        time: 'À l\'instant',
        read: false
      }
      setNotifications(prev => [newNotif, ...prev])
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleBlock = async (otherUserId) => {
    if (!otherUserId) return
    try {
      const result = await apiToggleBlock(otherUserId)
      const isBlocked = result.status === 'unblocked' // If it was unblocked, it WAS blocked

      let updated
      if (isBlocked) {
        updated = blockedUsers.filter(id => id !== otherUserId)
      } else {
        updated = [...blockedUsers, otherUserId]
      }
      setBlockedUsers(updated)

      // Add activity notification
      const recipientName = activeConversation?.other_user?.username || 'Utilisateur'
      const newNotif = {
        id: Date.now().toString(),
        type: 'security',
        title: isBlocked ? 'Utilisateur Débloqué' : 'Utilisateur Bloqué',
        text: isBlocked 
          ? `Vous avez débloqué ${recipientName}. Vous pouvez à présent échanger.` 
          : `Vous avez bloqué ${recipientName}. Ses messages et notifications sont suspendus.`,
        time: 'À l\'instant',
        read: false
      }
      setNotifications(prev => [newNotif, ...prev])
      setShowSecurityMenu(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendReport = async () => {
    if (!activeConversation?.other_user?.id) return
    setReportSubmitting(true)

    const reasonLabels = {
      spam: 'Spam / Publicité indésirable',
      harassment: 'Harcèlement / Discours haineux',
      suspicious: 'Activité suspecte (Phishing, Arnaque)',
      non_compliant: 'Contenu non conforme (Spam, violence, nudité)'
    }

    const recipientName = activeConversation.other_user.username

    try {
      await apiReportUser(
        activeConversation.other_user.id,
        reportReason,
        reportDescription
      )
      
      // Add moderation status notice to the notifications activity center!
      const newNotif = {
        id: Date.now().toString(),
        type: 'security',
        title: 'Signalement Transmis',
        text: `Votre signalement à l'encontre de ${recipientName} pour "${reasonLabels[reportReason]}" a été enregistré. Notre équipe de modération étudie la situation. Merci de veiller à la sécurité du Cockpit.`,
        time: 'À l\'instant',
        read: false
      }

      setNotifications(prev => [newNotif, ...prev])
      setReportSubmitting(false)
      setShowReportModal(false)
      setReportDescription('')
      alert(`Signalement envoyé avec succès. Merci d'avoir signalé ce comportement !`)
    } catch (e) {
      console.error(e)
      setReportSubmitting(false)
      alert("Erreur lors de l'envoi du signalement.")
    }
  }

  const handleUpdateProfile = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const updatedUser = await apiUpdateProfile({
        username: settingsProfile.username,
        primary_language_code: settingsProfile.primary_language_code,
        bio: settingsProfile.bio
      })
      
      setProfile(updatedUser)
      localStorage.setItem('nexchat_user', JSON.stringify(updatedUser))
      
      setShowSettings(false)
    } catch (err) {
      console.error('Failed to update profile:', err)
      const errorMsg = extractErrorMessage(err, 'Erreur lors de la mise à jour du profil')
      alert(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    setAvatarUploading(true)
    try {
      const fileData = await uploadFile(file, `avatars/${profile.id}`, () => {})
      const updatedUser = await apiUpdateProfile({ avatar_url: fileData.file_url })
      setProfile(updatedUser)
      localStorage.setItem('nexchat_user', JSON.stringify(updatedUser))
    } catch (err) {
      alert('Erreur lors de l\'upload de l\'avatar: ' + err.message)
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (isSaving) return
    setIsSaving(true)
    try {
      await apiUpdatePassword(passwordForm)
      alert('Mot de passe mis à jour avec succès')
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' })
    } catch (err) {
      console.error('Failed to update password:', err)
      const errorMsg = extractErrorMessage(err, 'Erreur lors de la mise à jour du mot de passe')
      alert(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLocked && isAuthenticated) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 18, 0.85)',
          backdropFilter: 'blur(30px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(30px) saturate(1.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          color: 'white',
          animation: 'fadeIn 0.5s ease-out'
        }}
      >
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }
        `}</style>
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '40px',
            width: '360px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 50px rgba(168,85,247,0.1)'
          }}
        >
          {/* Avatar and Aberration Glow in center */}
          <div style={{ position: 'relative' }}>
            <div 
              className="cyber-pulse"
              style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : 'linear-gradient(135deg, var(--primary-color), #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '3px solid var(--primary-color)',
                boxShadow: '0 0 20px rgba(168,85,247,0.5)',
                filter: avatarFilter === 'cyberpunk' ? 'hue-rotate(90deg) saturate(1.5)' :
                        avatarFilter === 'glitch' ? 'contrast(1.4) saturate(1.2)' :
                        avatarFilter === 'carbon' ? 'grayscale(1) contrast(1.2)' : 'none'
              }}
            >
              {!profile.avatar_url && (
                <span style={{ fontSize: '2rem', color: 'white', fontWeight: 700 }}>
                  {profile.username?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            {/* Status dot */}
            <div style={{
              position: 'absolute', bottom: '2px', right: '2px',
              width: '16px', height: '16px', borderRadius: '50%',
              background: '#ef4444',
              border: '3px solid #11111d'
            }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0' }}>Cockpit Verrouillé</h2>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Saisissez votre code PIN de déverrouillage</p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (lockInput === '123') {
                setIsLocked(false);
                setLockInput('');
                setLockError(false);
              } else {
                setLockError(true);
                setLockInput('');
                // Shaker effect
                setTimeout(() => setLockError(false), 500);
              }
            }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <input
              type="password"
              value={lockInput}
              onChange={(e) => setLockInput(e.target.value)}
              placeholder="Code PIN (par défaut : 1234)"
              maxLength={6}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: lockError ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '12px 16px',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center',
                letterSpacing: '6px',
                fontSize: '1.1rem',
                outline: 'none',
                boxShadow: lockError ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none',
                transition: 'all 0.2s ease',
                animation: lockError ? 'shake 0.3s ease' : 'none'
              }}
            />
            {lockError && (
              <span style={{ fontSize: '0.75rem', color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>Code PIN incorrect</span>
            )}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Déverrouiller
            </button>
          </form>

          <button 
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', color: '#ef4444',
              fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`app-container ${theme}`}>
      <CommandPalette

        showCommandPalette={showCommandPalette}
        setShowCommandPalette={setShowCommandPalette}
        commandQuery={commandQuery}
        setCommandQuery={setCommandQuery}
        filteredCommandItems={filteredCommandItems}
        commandSelectedIndex={commandSelectedIndex}
        setCommandSelectedIndex={setCommandSelectedIndex}
      />

      <NotificationsModal
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notifications={notifications}
        setNotifications={setNotifications}
        setActiveConversationId={setActiveConversationId}
      />
      <ProfileModal
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        profile={profile}
        settingsProfile={settingsProfile}
        setSettingsProfile={setSettingsProfile}
        avatarInputRef={avatarInputRef}
        avatarUploading={avatarUploading}
        handleAvatarUpload={handleAvatarUpload}
        languages={languages}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
        handleUpdatePassword={handleUpdatePassword}
        handleUpdateProfile={handleUpdateProfile}
        isSaving={isSaving}
      />

      <ProfilePopover
        isOpen={showProfilePopover}
        onClose={() => setShowProfilePopover(false)}
        profile={profile}
        userStatus={userStatus}
        setUserStatus={setUserStatus}
        avatarFilter={avatarFilter}
        setAvatarFilter={setAvatarFilter}
        voiceUrl={voiceUrl}
        setVoiceUrl={setVoiceUrl}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        isPlayingVoice={isPlayingVoice}
        playVoice={playVoice}
        setIsLocked={setIsLocked}
        onOpenSettings={() => {
          setShowProfilePopover(false)
          setShowSettings(true)
        }}
        onLogout={handleLogout}
      />

      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        showCommandPalette={showCommandPalette}
        setShowCommandPalette={setShowCommandPalette}
        setCommandQuery={setCommandQuery}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notifications={notifications}
        setShowSettings={setShowSettings}
        theme={theme}
        setTheme={setTheme}
        handleLogout={handleLogout}
        showProfilePopover={showProfilePopover}
        setShowProfilePopover={setShowProfilePopover}
        userStatus={userStatus}
        profile={profile}
        avatarFilter={avatarFilter}
      />

      <ConversationList
        sidebarMode={sidebarMode}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setShowGroupModal={setShowGroupModal}
        showMessagesMenu={showMessagesMenu}
        setShowMessagesMenu={setShowMessagesMenu}
        messagesFilter={messagesFilter}
        setMessagesFilter={setMessagesFilter}
        conversationList={conversationList}
        setConversationList={setConversationList}
        apiMarkConversationAsRead={apiMarkConversationAsRead}
        settingsProfile={settingsProfile}
        query={query}
        setQuery={setQuery}
        convLoading={convLoading}
        unifiedList={unifiedList}
        activeGroupId={activeGroupId}
        setActiveGroupId={setActiveGroupId}
        activeConversationId={activeConversationId}
        setActiveConversationId={setActiveConversationId}
        setCurrentView={setCurrentView}
        setConvContextMenu={setConvContextMenu}
        formatTime={formatTime}
        remoteResults={remoteResults}
        handleStartConversation={handleStartConversation}
        onAddContactByEmail={handleAddContactByEmail}
        contacts={contacts}
      />


      {/* 3. MAIN AREA */}
      {currentView === 'feed' && <Feed currentUser={settingsProfile} />}
      {currentView === 'ai-dashboard' && <AiDashboard />}
      <section className="chat-area" style={{ display: currentView === 'chat' ? 'flex' : 'none' }}>
        <header className="chat-header">
          <div style={{ position: 'relative' }}>
            <button
              className="sidebar-toggle-btn"
              type="button"
              aria-label="Menu Actions Globaux"
              onClick={(e) => { e.stopPropagation(); setShowQuickActions(!showQuickActions); }}
              style={{ 
                marginRight: '12px', 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-primary)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '8px',
                transition: 'background 0.2s ease'
              }}
              title="Menu des Actions"
            >
              <Menu size={20} />
            </button>

            {showQuickActions && (
              <div 
                className="quick-actions-popover"
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '40px',
                  left: '0',
                  zIndex: 1000,
                  background: 'var(--bg-panel)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
                  padding: '8px',
                  width: '260px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                {/* Mode Compact / Complet Toggle */}
                <button 
                  className="menu-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => {
                    setSidebarMode(sidebarMode === 'compact' ? 'full' : 'compact')
                    setShowQuickActions(false)
                  }}
                >
                  {sidebarMode === 'compact' ? <Maximize2 size={16} color="var(--primary-color)" /> : <Minimize2 size={16} color="var(--primary-color)" />}
                  <span>{sidebarMode === 'compact' ? "Mode Complet (350px)" : "Mode Compact (72px)"}</span>
                </button>

                {/* Nouvelle Conversation */}
                <button 
                  className="menu-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => {
                    setSidebarMode('full') // Force full mode to search
                    setShowQuickActions(false)
                    setTimeout(() => {
                      const searchInput = document.querySelector('.search-input')
                      if (searchInput) {
                        searchInput.focus()
                      }
                    }, 100)
                  }}
                >
                  <Plus size={16} color="var(--primary-color)" />
                  <span>Nouvelle conversation</span>
                </button>

                {/* Tout marquer comme lu */}
                <button 
                  className="menu-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                    setConversationList(prev => prev.map(c => ({ ...c, unread_count: 0 })))
                    setShowQuickActions(false)
                  }}
                >
                  <CheckCheck size={16} color="var(--primary-color)" />
                  <span>Tout marquer comme lu</span>
                </button>

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

                {/* DND Toggle (Ne pas déranger) */}
                <div 
                  className="menu-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => setDndMode(!dndMode)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {dndMode ? <Moon size={16} color="var(--primary-color)" /> : <BellOff size={16} color="var(--text-secondary)" />}
                    <span>Ne pas déranger</span>
                  </div>
                  <div 
                    style={{
                      width: '32px', height: '18px', borderRadius: '9px',
                      background: dndMode ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                      position: 'relative', transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{
                      width: '12px', height: '12px', borderRadius: '50%',
                      background: 'white', position: 'absolute', top: '3px',
                      left: dndMode ? '17px' : '3px', transition: 'all 0.3s ease'
                    }}></div>
                  </div>
                </div>

                {/* Filtrer non-lus */}
                <div 
                  className="menu-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => setFilterUnread(!filterUnread)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Filter size={16} color={filterUnread ? 'var(--primary-color)' : 'var(--text-secondary)'} />
                    <span>Filtrer les non-lus</span>
                  </div>
                  <div 
                    style={{
                      width: '32px', height: '18px', borderRadius: '9px',
                      background: filterUnread ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                      position: 'relative', transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{
                      width: '12px', height: '12px', borderRadius: '50%',
                      background: 'white', position: 'absolute', top: '3px',
                      left: filterUnread ? '17px' : '3px', transition: 'all 0.3s ease'
                    }}></div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {activeConversation || activeGroup ? (
            <div 
              style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '12px', cursor: activeGroup ? 'pointer' : 'default' }}
              onClick={() => { if (activeGroup) setShowGroupInfoModal(true) }}
            >
              <div className="avatar no-story" aria-hidden="true" style={{ width: '44px', height: '44px' }}>
                <div className="avatar-inner" style={{ fontSize: '1rem' }}>
                  {activeConversation 
                    ? (activeConversation.other_user?.avatar_url
                        ? <img src={activeConversation.other_user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : (activeConversation.other_user?.username || '?').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2))
                    : (activeGroup.avatar_url
                        ? <img src={activeGroup.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : activeGroup.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2))
                  }
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                  {activeConversation ? activeConversation.other_user?.username : activeGroup.name}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {activeConversation ? (
                    <>
                      <i style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeConversation.other_user?.is_online ? '#22c55e' : 'var(--text-muted)' }} />
                      {activeConversation.other_user?.is_online ? 'En ligne' : 'Hors ligne'}
                    </>
                  ) : (
                    <>
                      <Users size={12} />
                      {activeGroup.members_count} membres
                    </>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 500, opacity: 0.5 }}>Sélectionnez un contact</h2>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {activeConversation && (
              <div style={{ position: 'relative' }}>
                <button
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowSecurityMenu(!showSecurityMenu); }}
                  title="Sécurité & Contacts"
                >
                  {blockedUsers.includes(activeConversation.other_user?.id) ? (
                    <ShieldAlert size={22} color="#ef4444" />
                  ) : (
                    <Shield size={22} />
                  )}
                </button>
                {showSecurityMenu && (
                  <div 
                    className="quick-actions-popover"
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: '40px',
                      right: '0',
                      zIndex: 1000,
                      background: 'var(--bg-panel)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
                      padding: '8px',
                      width: '260px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <button 
                      className="menu-item"
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left' }}
                      onClick={() => { handleToggleContact(activeConversation.other_user.id); setShowSecurityMenu(false); }}
                    >
                      {contacts.includes(activeConversation.other_user?.id) ? (
                        <><UserMinus size={16} color="var(--primary-color)" /><span>Retirer des contacts</span></>
                      ) : (
                        <><UserPlus size={16} color="var(--primary-color)" /><span>Ajouter aux contacts</span></>
                      )}
                    </button>
                    
                    <button 
                      className="menu-item"
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: '8px', color: blockedUsers.includes(activeConversation.other_user?.id) ? '#22c55e' : '#ef4444', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left' }}
                      onClick={() => handleToggleBlock(activeConversation.other_user.id)}
                    >
                      {blockedUsers.includes(activeConversation.other_user?.id) ? (
                        <><ShieldCheck size={16} /><span>Débloquer l'utilisateur</span></>
                      ) : (
                        <><ShieldAlert size={16} /><span>Bloquer l'utilisateur</span></>
                      )}
                    </button>

                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

                    <button 
                      className="menu-item"
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: '8px', color: '#f59e0b', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left' }}
                      onClick={() => { setShowReportModal(true); setShowSecurityMenu(false); }}
                    >
                      <AlertTriangle size={16} />
                      <span>Signaler l'utilisateur</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            {activeConversation && (
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: showOriginal ? 'var(--primary-color)' : 'var(--text-secondary)' }}
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                title="Afficher le texte original"
              >
                <Languages size={22} />
              </button>
            )}
            {activeGroup && (
              <button
                style={{ background: 'var(--bg-message-out)', border: '1px solid var(--primary-color)', cursor: 'pointer', color: 'var(--primary-color)', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}
                type="button"
                onClick={handleAiGroupSummary}
                title="Générer un résumé du groupe"
              >
                <Sparkles size={16} /> Résumer (IA)
              </button>
            )}
            {(activeConversation || activeGroup) && (
              <CallPanel
                profile={profile}
                conversationId={activeConversationId}
                groupId={activeGroupId}
                participantIds={activeConversation
                  ? [activeConversation.other_user?.id]
                  : (activeGroupDetails?.members || []).map((member) => member.user_id)}
              />
            )}
            <button 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} 
              type="button" 
              onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
            >
              <Settings size={22} />
            </button>
          </div>
        </header>

        {(!activeConversation || messagesLoading) ? (
          <div className="welcome-screen">
            <div className="avatar" style={{ width: '100px', height: '100px', padding: '4px', marginBottom: '24px' }}>
               <div className="avatar-inner" style={{ background: 'var(--bg-app)' }}>
                  <Languages size={48} color="var(--primary-color)" />
               </div>
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem' }}>{messagesLoading ? 'Synchronisation...' : 'Vos messages'}</h2>
            <p style={{ marginTop: '8px', color: 'var(--text-secondary)', maxWidth: '280px', textAlign: 'center' }}>
              {messagesLoading ? 'Chargement de vos échanges sécurisés.' : 'Envoyez des messages privés à un ami ou un groupe.'}
            </p>
            {!messagesLoading && (
               <button className="auth-btn" style={{ marginTop: '24px', padding: '10px 24px', borderRadius: '8px', fontSize: '0.9rem' }} onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}>
                  Paramètres du profil
               </button>
            )}
          </div>
        ) : (
          <>
            <section className={`chat-messages ${isShaking ? 'wizz-shake' : ''}`} aria-label="Messages">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
                  <p>Aucun message. Envoyez le premier !</p>
                </div>
              )}

              {messages.map((message) => {
                const isMe = message.sender_id === profile.id
                const isDeleted = message.is_deleted
                const displayContent = isDeleted 
                  ? '🚫 Ce message a été supprimé' 
                  : (isMe ? message.content_original : (message.content_translated || message.content_original))
                const originalContent = message.content_original
                const sourceLang = message.source_lang || ''

                // Rendu spécial d'un Wizz / Nudge Premium
                if (message.content_original === '🔔 NUDGE' && !isDeleted) {
                  return (
                    <div 
                      className="message-bubble nudge-system" 
                      key={message.id}
                      style={{ alignSelf: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span>🔔</span>
                        <span>{isMe ? "Vous avez envoyé un Wizz !" : `${activeConversation?.other_user?.username || 'Votre contact'} vous a envoyé un Wizz !`}</span>
                      </div>
                      <div className="message-time" style={{ opacity: 0.5, marginTop: '4px', textAlign: 'right', fontSize: '0.65rem' }}>
                        <span>{formatTime(message.created_at)}</span>
                      </div>
                    </div>
                  )
                }

                return (
                  <div 
                    className={`message-bubble ${isMe ? 'message-out' : 'message-in'} ${isDeleted ? 'deleted' : ''}`} 
                    key={message.id}
                    onContextMenu={(e) => isMe && !isDeleted && handleMessageContextMenu(e, message.id)}
                  >
                    {activeGroup && !isMe && (
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF6B6B', marginBottom: '4px' }}>
                        {message.sender?.username || 'Inconnu'}
                      </div>
                    )}
                    {/* Media rendering */}
                    {message.file_url && !isDeleted && (
                     <div style={{ marginBottom: message.content_original ? '8px' : '0' }}>
                        {message.file_type?.startsWith('audio/') ? (
                          <div style={{ minWidth: '220px' }}>
                            <audio src={message.file_url} controls style={{ width: '100%', maxWidth: '280px' }} />
                            {!message.content_original && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                                Transcription en cours...
                              </div>
                            )}
                          </div>
                        ) : isImage(message.file_type) ? (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                              src={message.file_url}
                              alt={message.file_name}
                              style={{ maxWidth: '240px', maxHeight: '240px', borderRadius: '10px', display: 'block', cursor: 'pointer', objectFit: 'cover' }}
                              onClick={() => window.open(message.file_url, '_blank')}
                            />
                            <a
                              href={message.file_url}
                              download={message.file_name}
                              style={{
                                position: 'absolute', bottom: '6px', right: '6px',
                                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                                border: 'none', borderRadius: '6px', padding: '4px 8px',
                                color: 'white', cursor: 'pointer', fontSize: '0.7rem',
                                display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none',
                              }}
                              title="Télécharger"
                            >
                              ⬇ Télécharger
                            </a>
                          </div>
                        ) : isVideo(message.file_type) ? (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <video
                              src={message.file_url}
                              controls
                              style={{ maxWidth: '240px', borderRadius: '10px', display: 'block' }}
                            />
                            <a
                              href={message.file_url}
                              download={message.file_name}
                              style={{
                                position: 'absolute', top: '6px', right: '6px',
                                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                                borderRadius: '6px', padding: '4px 8px',
                                color: 'white', fontSize: '0.7rem',
                                display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none',
                              }}
                              title="Télécharger"
                            >
                              ⬇ Télécharger
                            </a>
                          </div>
                        ) : (
                          <a
                            href={message.file_url}
                            download={message.file_name}
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 12px', textDecoration: 'none', color: 'white', fontSize: '0.85rem' }}
                          >
                            <Paperclip size={16} />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message.file_name}</span>
                            <span style={{ opacity: 0.5, fontSize: '0.75rem', flexShrink: 0 }}>{formatFileSize(message.file_size)}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.8, flexShrink: 0 }}>⬇</span>
                          </a>
                        )}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      {(displayContent || isDeleted) && (
                        <p style={{ margin: 0, color: isDeleted ? 'var(--text-muted)' : 'white', fontStyle: isDeleted ? 'italic' : 'normal' }}>
                          {displayContent}
                        </p>
                      )}
                      {!isMe && !isDeleted && message.content_translated && message.content_translated !== originalContent && (
                        <button
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px 6px', fontSize: '0.65rem', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}
                          onClick={() => setShowOriginal(!showOriginal)}
                        >
                          {showOriginal ? 'TR' : 'OR'}
                        </button>
                      )}
                    </div>
                    {showOriginal && !isMe && message.content_translated && message.content_translated !== originalContent && (
                      <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600 }}>{sourceLang.toUpperCase()} :</span> {originalContent}
                      </div>
                    )}
                    <div className="message-time" style={{ opacity: 0.5 }}>
                      <span>{formatTime(message.created_at)}</span>
                      {isMe && (
                        <span style={{ marginLeft: '4px' }}>
                          {message.is_read ? <CheckCheck size={12} color="var(--primary-color)" /> : <CheckCheck size={12} />}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              {typingUser && (
                <div style={{ padding: '0 20px 10px', color: 'var(--primary-color)', fontSize: '0.85rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <span style={{ width: '4px', height: '4px', background: 'currentColor', borderRadius: '50%' }}></span>
                    <span style={{ width: '4px', height: '4px', background: 'currentColor', borderRadius: '50%' }}></span>
                    <span style={{ width: '4px', height: '4px', background: 'currentColor', borderRadius: '50%' }}></span>
                  </div>
                  {typingUser} est en train d'écrire...
                </div>
              )}
            </section>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              {isUploading && (
                <div style={{ padding: '4px 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '3px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary-color)', transition: 'width 0.2s', borderRadius: '4px' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{uploadProgress}%</span>
                </div>
              )}
              {blockedUsers.includes(activeConversation?.other_user?.id) ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', fontSize: '0.9rem', width: '100%' }}>
                  <ShieldAlert size={18} style={{ marginRight: '8px' }} />
                  Vous avez bloqué cet utilisateur. Débloquez-le pour lui envoyer un message.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  {smartReplies.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', padding: '0 0 10px 0', overflowX: 'auto', width: '100%', scrollbarWidth: 'none' }}>
                      {smartReplies.map((reply, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => { setDraft(reply); setSmartReplies([]); }}
                          style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {reply}
                        </button>
                      ))}
                      <button type="button" onClick={() => setSmartReplies([])} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 8px' }}>✕</button>
                    </div>
                  )}
                  <div className="chat-input-wrapper" style={{ position: 'relative' }}>
                  {showEmojiPicker && (
                    <>
                      <div onClick={() => setShowEmojiPicker(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 49 }} />
                      <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '10px', zIndex: 50, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden' }}>
                        <EmojiPicker 
                          theme="dark"
                          searchPlaceholder="Rechercher un emoji..."
                          width={350}
                          height={400}
                          previewConfig={{ showPreview: false }}
                          onEmojiClick={(emojiData) => {
                            setDraft(prev => prev + emojiData.emoji)
                          }}
                        />
                      </div>
                    </>
                  )}
                  <button 
                    type="button" 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', marginRight: '10px', display: 'flex', alignItems: 'center' }}
                  >
                    <Smile size={22} />
                  </button>
                  <div style={{ position: 'relative' }}>
                    {showAiMenu && (
                      <div className="ai-menu-popover" style={{
                        position: 'absolute', bottom: '100%', left: '-50px', 
                        marginBottom: '15px', background: 'var(--bg-panel)',
                        border: '1px solid var(--border-glass)', borderRadius: '12px',
                        padding: '12px', boxShadow: 'var(--shadow-md)', zIndex: 50,
                        width: '240px', display: 'flex', flexDirection: 'column', gap: '8px'
                      }}>
                        <div style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: 'bold', padding: '0 8px 6px', borderBottom: '1px solid var(--border-glass)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sparkles size={14} /> Assistant IA
                        </div>
                        <button type="button" className="ai-action-item" style={{ padding: '10px', background: 'transparent', border: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }} onClick={() => handleAiRephrase('pro')}>
                          <ShieldCheck size={16} color="var(--primary-color)" /> Reformuler (Pro)
                        </button>
                        <button type="button" className="ai-action-item" style={{ padding: '10px', background: 'transparent', border: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }} onClick={() => handleAiRephrase('friendly')}>
                          <MessageSquare size={16} color="var(--tertiary-color)" /> Reformuler (Décontracté)
                        </button>
                        <button type="button" className="ai-action-item" style={{ padding: '10px', background: 'transparent', border: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }} onClick={handleAiSmartReplies}>
                          <CheckCheck size={16} color="var(--secondary-color)" /> Suggérer réponse
                        </button>
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={() => setShowAiMenu(!showAiMenu)}
                      style={{ 
                        background: 'transparent', border: 'none', 
                        color: showAiMenu || isAiProcessing ? 'var(--primary-color)' : 'var(--text-primary)', 
                        cursor: 'pointer', marginRight: '10px', display: 'flex', alignItems: 'center',
                        animation: isAiProcessing ? 'pulse 1.5s infinite' : 'none'
                      }}>
                      <Sparkles size={22} />
                    </button>
                  </div>
                  <input
                    className="chat-input"
                    value={draft}
                    onChange={handleDraftChange}
                    placeholder="Écrivez un message..."
                    disabled={sendingMessage || isUploading}
                  />
                  </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    accept="image/*,video/mp4,application/pdf,audio/*"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{ background: 'transparent', border: 'none', color: isUploading ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: isUploading ? 'not-allowed' : 'pointer', padding: 0, display: 'flex' }}
                    title="Envoyer un fichier"
                  >
                    <Paperclip size={20} />
                  </button>
                  {activeConversationId && (
                    <button
                      type="button"
                      onClick={handleVoiceRecording}
                      disabled={isUploading || sendingMessage}
                      style={{
                        background: isRecordingVoice ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        border: 'none',
                        color: isRecordingVoice ? '#ef4444' : 'var(--text-secondary)',
                        cursor: isUploading || sendingMessage ? 'not-allowed' : 'pointer',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={isRecordingVoice ? 'Arrêter l’enregistrement' : 'Enregistrer un message vocal'}
                    >
                      {isRecordingVoice ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
                    </button>
                  )}
                  {draft.trim() ? (
                    <button
                      type="submit"
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer' }}
                      disabled={sendingMessage}
                    >
                      Envoyer
                    </button>
                  ) : (
                    <Bell 
                      size={20} 
                      color="var(--primary-color)" 
                      style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }} 
                      className="nudge-btn-hover"
                      onClick={handleSendNudge}
                      title="Envoyer un Wizz !"
                    />
                  )}
                </div>
              </div>
              )}
            </form>
          </>
        )}
      </section>
      {/* CONVERSATION CONTEXT MENU */}
      {convContextMenu.visible && (
        <div 
          className="context-menu"
          style={{ 
            position: 'fixed', top: convContextMenu.y, left: convContextMenu.x, zIndex: 2000,
            background: 'var(--bg-panel)', border: '1px solid var(--border-glass)', borderRadius: '12px',
            padding: '6px', minWidth: '160px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)', animation: 'scaleIn 0.15s ease-out'
          }}
        >
          <button 
            className="menu-item" 
            onClick={() => {
              const isArchived = archivedConversationIds.includes(convContextMenu.conversationId);
              if (isArchived) {
                setArchivedConversationIds(prev => prev.filter(id => id !== convContextMenu.conversationId));
              } else {
                setArchivedConversationIds(prev => [...prev, convContextMenu.conversationId]);
              }
              setConvContextMenu({ visible: false, x: 0, y: 0, conversationId: null });
            }}
            style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            {archivedConversationIds.includes(convContextMenu.conversationId) ? 'Désarchiver' : 'Archiver la conversation'}
          </button>
        </div>
      )}

      {/* CONTEXT MENU */}
      {contextMenu.visible && (
        <div 
          className="context-menu"
          style={{ 
            position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 2000,
            background: 'var(--bg-panel)', border: '1px solid var(--border-glass)', borderRadius: '12px',
            padding: '6px', minWidth: '160px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)', animation: 'scaleIn 0.15s ease-out'
          }}
        >
          <button 
            className="menu-item" 
            onClick={handleArchiveMessage}
            style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            <Paperclip size={16} /> Archiver le message
          </button>
          <button 
            className="menu-item delete" 
            onClick={() => {
              if (window.confirm('Supprimer pour tout le monde ?')) {
                handleDeleteMessage()
              }
            }}
            style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            <X size={16} /> Supprimer pour tous
          </button>
        </div>
      )}

      {/* GROUP MODAL */}
      <GroupInfoModal
        isOpen={showGroupInfoModal}
        onClose={() => setShowGroupInfoModal(false)}
        group={activeGroupDetails}
        currentUser={profile}
        contacts={contacts}
        onAddMember={handleAddGroupMember}
        onRemoveMember={handleRemoveGroupMember}
        onSetRole={handleSetGroupMemberRole}
      />

      <GroupModal 
        isOpen={showGroupModal} 
        onClose={() => setShowGroupModal(false)} 
        contacts={contacts} 
        onCreate={handleCreateGroup}
      />

      {/* REPORT USER MODAL */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
            <header className="settings-header" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <AlertTriangle size={24} />
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 600 }}>Signaler l'utilisateur</h2>
              </div>
              <button className="btn-close" onClick={() => setShowReportModal(false)}>
                <X size={20} />
              </button>
            </header>
            
            <div className="settings-content" style={{ padding: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
                Vous êtes sur le point de signaler <strong>{activeConversation?.other_user?.username}</strong>. 
                Ce signalement sera transmis à notre équipe de modération.
              </p>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>Motif du signalement</label>
                <select 
                  className="auth-input" 
                  value={reportReason} 
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                >
                  <option value="spam">Spam / Publicité indésirable</option>
                  <option value="harassment">Harcèlement / Discours haineux</option>
                  <option value="suspicious">Activité suspecte (Phishing, Arnaque)</option>
                  <option value="non_compliant">Contenu non conforme (Spam, violence, nudité)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>Description détaillée (optionnel)</label>
                <textarea 
                  className="auth-input" 
                  value={reportDescription} 
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Fournissez plus de détails sur le comportement signalé..."
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
                >
                  Annuler
                </button>
                <button 
                  type="button"
                  onClick={handleSendReport}
                  disabled={reportSubmitting}
                  style={{ padding: '10px 20px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', cursor: reportSubmitting ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: 600, opacity: reportSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {reportSubmitting ? 'Envoi...' : 'Envoyer le signalement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
