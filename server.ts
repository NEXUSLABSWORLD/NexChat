import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 3000)
const HOST = '0.0.0.0'

app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

// Initialize Gemini SDK if API key is provided
let aiClient: GoogleGenAI | null = null
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI()
  } catch (err) {
    console.warn('[Gemini] Initialization warning:', err)
  }
}

// In-Memory Data Store
interface User {
  id: number
  username: string
  email: string
  password_hash?: string
  primary_language_code: string
  avatar_url?: string
  bio?: string
  is_online: boolean
  last_seen_at?: string
  subscription_tier?: string
  ai_proactive_translation?: boolean
  ai_translation_formality?: string
}

interface Message {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  content_original?: string
  content_translated?: string
  target_language_code?: string
  file_url?: string | null
  file_name?: string | null
  file_type?: string | null
  file_size?: number | null
  is_read: boolean
  is_archived: boolean
  created_at: string
}

interface Conversation {
  id: number
  user_one_id: number
  user_two_id: number
  updated_at: string
}

interface Group {
  id: number
  name: string
  description?: string
  avatar_url?: string
  created_by: number
  created_at: string
}

interface GroupMember {
  id: number
  group_id: number
  user_id: number
  role: 'admin' | 'member'
}

interface GroupMessage {
  id: number
  group_id: number
  sender_id: number
  content_original: string
  created_at: string
  sender?: User
}

interface Post {
  id: number
  user_id: number
  content: string
  media_url?: string | null
  likes: number[]
  created_at: string
}

interface Story {
  id: number
  user_id: number
  text_content?: string
  media_url?: string | null
  created_at: string
  expires_at: string
}

interface SavedPhrase {
  id: number
  user_id: number
  phrase_fr: string
  phrase_en?: string
  phrase_es?: string
  phrase_de?: string
  category?: string
  created_at: string
}

// Seed Users
const users: User[] = [
  {
    id: 1,
    username: 'Ryan Kengne',
    email: 'kengneryan6@gmail.com',
    primary_language_code: 'fr',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Lead Developer NexChat | AI Enthusiast',
    is_online: true,
    last_seen_at: new Date().toISOString(),
    subscription_tier: 'obsidian_pro',
    ai_proactive_translation: true,
    ai_translation_formality: 'auto',
  },
  {
    id: 2,
    username: 'Alice Martin',
    email: 'alice@nexchat.io',
    primary_language_code: 'en',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Product Designer based in London 🇬🇧',
    is_online: true,
    last_seen_at: new Date().toISOString(),
    subscription_tier: 'obsidian_pro',
  },
  {
    id: 3,
    username: 'Carlos Gomez',
    email: 'carlos@nexchat.io',
    primary_language_code: 'es',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Frontend Architect from Madrid 🇪🇸',
    is_online: false,
    last_seen_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    subscription_tier: 'free',
  },
  {
    id: 4,
    username: 'NexBot AI',
    email: 'nexbot@nexchat.io',
    primary_language_code: 'fr',
    avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    bio: 'Votre assistant intelligent multilingue',
    is_online: true,
    last_seen_at: new Date().toISOString(),
    subscription_tier: 'elite_digital',
  },
]

// Seed Contacts & Blocks
let contacts: { user_id: number; contact_id: number }[] = [
  { user_id: 1, contact_id: 2 },
  { user_id: 1, contact_id: 3 },
  { user_id: 1, contact_id: 4 },
  { user_id: 2, contact_id: 1 },
]

let blockedUsers: { user_id: number; blocked_id: number }[] = []

// Seed Conversations
let conversations: Conversation[] = [
  {
    id: 1,
    user_one_id: 1,
    user_two_id: 2,
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_one_id: 1,
    user_two_id: 3,
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 3,
    user_one_id: 1,
    user_two_id: 4,
    updated_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
]

// Seed Messages
let messages: Message[] = [
  {
    id: 1,
    conversation_id: 1,
    sender_id: 2,
    content: 'Hi Ryan! How is the new multilingual chat engine performing?',
    content_original: 'Hi Ryan! How is the new multilingual chat engine performing?',
    content_translated: 'Salut Ryan ! Comment fonctionne le nouveau moteur de chat multilingue ?',
    target_language_code: 'fr',
    file_url: null,
    file_name: null,
    file_type: null,
    file_size: null,
    is_read: true,
    is_archived: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 2,
    conversation_id: 1,
    sender_id: 1,
    content: "C'est super fluide ! Les traductions instantanées et l'IA fonctionnent à merveille.",
    content_original: "C'est super fluide ! Les traductions instantanées et l'IA fonctionnent à merveille.",
    content_translated: 'It is super smooth! Instant translations and AI are working wonders.',
    target_language_code: 'en',
    file_url: null,
    file_name: null,
    file_type: null,
    file_size: null,
    is_read: true,
    is_archived: false,
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 3,
    conversation_id: 1,
    sender_id: 2,
    content: "Awesome! Let me know if you need any UI tweaks for the dark theme.",
    content_original: "Awesome! Let me know if you need any UI tweaks for the dark theme.",
    content_translated: "Génial ! Fais-moi savoir si tu as besoin d'ajustements d'interface pour le thème sombre.",
    target_language_code: 'fr',
    file_url: null,
    file_name: null,
    file_type: null,
    file_size: null,
    is_read: false,
    is_archived: false,
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 4,
    conversation_id: 2,
    sender_id: 3,
    content: '¡Hola! ¿Has revisado las publicaciones recientes del feed?',
    content_original: '¡Hola! ¿Has revisado las publicaciones recientes del feed?',
    content_translated: 'Bonjour ! As-tu vérifié les récentes publications du fil ?',
    target_language_code: 'fr',
    file_url: null,
    file_name: null,
    file_type: null,
    file_size: null,
    is_read: true,
    is_archived: false,
    created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
]

// Seed Groups
let groups: Group[] = [
  {
    id: 1,
    name: 'NexChat Core Team',
    description: 'Engineering & Product team discussions',
    avatar_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    created_by: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 2,
    name: 'AI & Translation Innovations',
    description: 'Sharing prompts, models and LLM experiments',
    avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    created_by: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
]

let groupMembers: GroupMember[] = [
  { id: 1, group_id: 1, user_id: 1, role: 'admin' },
  { id: 2, group_id: 1, user_id: 2, role: 'member' },
  { id: 3, group_id: 1, user_id: 3, role: 'member' },
  { id: 4, group_id: 2, user_id: 1, role: 'admin' },
  { id: 5, group_id: 2, user_id: 4, role: 'member' },
]

let groupMessages: GroupMessage[] = [
  {
    id: 1,
    group_id: 1,
    sender_id: 1,
    content_original: 'Bienvenue à tous sur le canal principal de NexChat !',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 2,
    group_id: 1,
    sender_id: 2,
    content_original: 'Glad to be here! The app looks gorgeous.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
  },
]

// Seed Posts
let posts: Post[] = [
  {
    id: 1,
    user_id: 1,
    content: 'NexChat v2 est officiellement en ligne ! Profitez des conversations instantanées avec traduction automatique et assistant IA.',
    media_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    likes: [1, 2, 3],
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 2,
    user_id: 2,
    content: 'Just tested the new dark obsidian UI mode. The glassmorphism and purple accents are fantastic! 🚀',
    media_url: null,
    likes: [1, 2],
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
]

// Seed Stories
let stories: Story[] = [
  {
    id: 1,
    user_id: 2,
    text_content: 'Designing the future of multilingual communication ✨',
    media_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    text_content: 'Coding with NexChat AI ⚡',
    media_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 19).toISOString(),
  },
]

// Seed Saved Phrases
let savedPhrases: SavedPhrase[] = [
  {
    id: 1,
    user_id: 1,
    phrase_fr: 'Pourrions-nous fixer une réunion demain à 14h ?',
    phrase_en: 'Could we schedule a meeting tomorrow at 2 PM?',
    phrase_es: '¿Podríamos programar una reunión mañana a las 14:00?',
    category: 'Travail',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    phrase_fr: 'Merci beaucoup pour votre aide précieuse.',
    phrase_en: 'Thank you very much for your valuable assistance.',
    phrase_es: 'Muchas gracias por su valiosa ayuda.',
    category: 'Remerciement',
    created_at: new Date().toISOString(),
  },
]

// Auth Token Store
const tokenStore = new Map<string, number>()
tokenStore.set('mock-token-user-1', 1)

// Helper: Extract current user from Authorization header
function getCurrentUser(req: Request): User {
  const auth = req.headers.authorization
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim()
    const userId = tokenStore.get(token)
    if (userId) {
      const user = users.find((u) => u.id === userId)
      if (user) return user
    }
  }
  // Default to User 1 (Ryan) for easy prototyping/testing
  return users[0]
}

// ---------------------------------------------
// AUTH ROUTES
// ---------------------------------------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, password, primary_language_code } = req.body

  if (!email || !username) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: { email: ['Email et nom utilisateur requis'] },
    })
  }

  let existing = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
  if (!existing) {
    existing = {
      id: users.length + 1,
      username: username || 'User',
      email: String(email).toLowerCase(),
      primary_language_code: primary_language_code || 'fr',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      bio: 'Membre NexChat',
      is_online: true,
      last_seen_at: new Date().toISOString(),
      subscription_tier: 'obsidian_pro',
    }
    users.push(existing)
  }

  const token = `token-${existing.id}-${Date.now()}`
  tokenStore.set(token, existing.id)

  return res.json({
    message: 'Inscription réussie',
    user: existing,
    token,
  })
})

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: { email: ['Email obligatoire'] },
    })
  }

  let user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
  if (!user) {
    // Conveniently auto-provision account if user enters an email
    const username = email.split('@')[0]
    user = {
      id: users.length + 1,
      username: username.charAt(0).toUpperCase() + username.slice(1),
      email: String(email).toLowerCase(),
      primary_language_code: 'fr',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      bio: 'Membre NexChat',
      is_online: true,
      last_seen_at: new Date().toISOString(),
      subscription_tier: 'obsidian_pro',
    }
    users.push(user)
  }

  user.is_online = true
  user.last_seen_at = new Date().toISOString()

  const token = `token-${user.id}-${Date.now()}`
  tokenStore.set(token, user.id)

  return res.json({
    message: 'Connexion réussie',
    user,
    token,
  })
})

app.post('/api/auth/login/verify', (req: Request, res: Response) => {
  const { email } = req.body
  const user = users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase()) || users[0]
  const token = `token-${user.id}-${Date.now()}`
  tokenStore.set(token, user.id)

  return res.json({
    message: 'Connexion réussie',
    user,
    token,
  })
})

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  return res.json({ message: 'Déconnexion réussie' })
})

app.get('/api/user', (req: Request, res: Response) => {
  return res.json(getCurrentUser(req))
})

// ---------------------------------------------
// PROFILE ROUTES
// ---------------------------------------------
app.get('/api/profile/show', (req: Request, res: Response) => {
  const user = getCurrentUser(req)
  return res.json({
    user,
    data: user,
  })
})

app.put('/api/profile/update', (req: Request, res: Response) => {
  const user = getCurrentUser(req)
  const { username, primary_language_code, avatar_url, bio } = req.body

  if (username !== undefined) user.username = username
  if (primary_language_code !== undefined) user.primary_language_code = primary_language_code
  if (avatar_url !== undefined) user.avatar_url = avatar_url
  if (bio !== undefined) user.bio = bio

  return res.json({
    message: 'Profil mis à jour',
    user,
    data: user,
  })
})

app.put('/api/profile/update-password', (_req: Request, res: Response) => {
  return res.json({ message: 'Mot de passe mis à jour avec succès' })
})

app.get('/api/profile/search', (req: Request, res: Response) => {
  const query = String(req.query.query || '').toLowerCase()
  const results = users.filter(
    (u) =>
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
  )
  return res.json(results)
})

// ---------------------------------------------
// CONVERSATIONS ROUTES
// ---------------------------------------------
app.get('/api/conversations', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)

  const userConversations = conversations
    .filter((c) => c.user_one_id === currentUser.id || c.user_two_id === currentUser.id)
    .map((c) => {
      const otherUserId = c.user_one_id === currentUser.id ? c.user_two_id : c.user_one_id
      const otherUser = users.find((u) => u.id === otherUserId) || {
        id: otherUserId,
        username: 'Contact',
        avatar_url: '',
        is_online: false,
      }

      const convMessages = messages.filter((m) => m.conversation_id === c.id)
      const lastMessage = convMessages[convMessages.length - 1] || null
      const unreadCount = convMessages.filter((m) => m.sender_id !== currentUser.id && !m.is_read).length

      return {
        id: c.id,
        user_one_id: c.user_one_id,
        user_two_id: c.user_two_id,
        other_user: otherUser,
        participant: otherUser,
        last_message: lastMessage,
        unread_count: unreadCount,
        updated_at: c.updated_at,
      }
    })

  return res.json({ conversations: userConversations })
})

app.post('/api/conversations', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const otherUserId = Number(req.body.other_user_id)

  let conv = conversations.find(
    (c) =>
      (c.user_one_id === currentUser.id && c.user_two_id === otherUserId) ||
      (c.user_one_id === otherUserId && c.user_two_id === currentUser.id)
  )

  if (!conv) {
    conv = {
      id: conversations.length + 1,
      user_one_id: currentUser.id,
      user_two_id: otherUserId,
      updated_at: new Date().toISOString(),
    }
    conversations.unshift(conv)
  }

  const otherUser = users.find((u) => u.id === otherUserId)
  return res.json({
    conversation: {
      ...conv,
      other_user: otherUser,
      participant: otherUser,
      last_message: null,
      unread_count: 0,
    },
  })
})

app.get('/api/conversations/:id', (req: Request, res: Response) => {
  const convId = Number(req.params.id)
  const conv = conversations.find((c) => c.id === convId)
  if (!conv) {
    return res.status(404).json({ message: 'Conversation introuvable' })
  }

  const currentUser = getCurrentUser(req)
  const otherUserId = conv.user_one_id === currentUser.id ? conv.user_two_id : conv.user_one_id
  const otherUser = users.find((u) => u.id === otherUserId)

  const convMessages = messages.filter((m) => m.conversation_id === convId)

  return res.json({
    conversation: {
      ...conv,
      other_user: otherUser,
      participant: otherUser,
    },
    messages: convMessages,
  })
})

app.patch('/api/conversations/:id/read', (req: Request, res: Response) => {
  const convId = Number(req.params.id)
  const currentUser = getCurrentUser(req)

  let markedCount = 0
  messages.forEach((m) => {
    if (m.conversation_id === convId && m.sender_id !== currentUser.id && !m.is_read) {
      m.is_read = true
      markedCount++
    }
  })

  return res.json({
    message: 'Marqué comme lu',
    marked_count: markedCount,
  })
})

// ---------------------------------------------
// MESSAGES ROUTES
// ---------------------------------------------
app.get('/api/messages', (req: Request, res: Response) => {
  const convId = Number(req.query.conversation_id)
  const convMessages = messages.filter((m) => m.conversation_id === convId && !m.is_archived)

  return res.json({
    data: convMessages,
    messages: convMessages,
    total: convMessages.length,
  })
})

app.post('/api/messages', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const { conversation_id, content, file_url, file_name, file_type, file_size } = req.body

  const convId = Number(conversation_id)
  const conv = conversations.find((c) => c.id === convId)
  if (conv) {
    conv.updated_at = new Date().toISOString()
  }

  // Simulated auto-translation target language detection
  const otherUserId = conv ? (conv.user_one_id === currentUser.id ? conv.user_two_id : conv.user_one_id) : 2
  const otherUser = users.find((u) => u.id === otherUserId)
  const targetLang = otherUser?.primary_language_code || 'en'

  const newMessage: Message = {
    id: messages.length + 1,
    conversation_id: convId,
    sender_id: currentUser.id,
    content: content || '',
    content_original: content || '',
    content_translated: content ? `[Traduction auto] ${content}` : undefined,
    target_language_code: targetLang,
    file_url: file_url || null,
    file_name: file_name || null,
    file_type: file_type || null,
    file_size: file_size || null,
    is_read: false,
    is_archived: false,
    created_at: new Date().toISOString(),
  }

  messages.push(newMessage)

  // If conversation is with NexBot (user 4), generate automatic response!
  if (otherUserId === 4) {
    setTimeout(async () => {
      let botReply = "Je suis NexBot, votre assistant de communication IA ! Comment puis-je vous aider ?"
      if (aiClient && content) {
        try {
          const aiResponse = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Tu es NexBot, l'assistant IA intégré de l'application de messagerie NexChat. Réponds de façon concise, amicale et naturelle en français au message suivant :\n"${content}"`,
          })
          if (aiResponse.text) {
            botReply = aiResponse.text
          }
        } catch (e) {
          console.warn('[Gemini NexBot Chat error]:', e)
        }
      }

      messages.push({
        id: messages.length + 1,
        conversation_id: convId,
        sender_id: 4,
        content: botReply,
        content_original: botReply,
        content_translated: botReply,
        target_language_code: currentUser.primary_language_code || 'fr',
        file_url: null,
        file_name: null,
        file_type: null,
        file_size: null,
        is_read: false,
        is_archived: false,
        created_at: new Date().toISOString(),
      })
    }, 600)
  }

  return res.json({
    message: 'Message envoyé',
    data: newMessage,
  })
})

app.patch('/api/messages/:id/read', (req: Request, res: Response) => {
  const msgId = Number(req.params.id)
  const msg = messages.find((m) => m.id === msgId)
  if (msg) {
    msg.is_read = true
  }
  return res.json({ message: 'Marqué comme lu', updated: true })
})

app.delete('/api/messages/:id', (req: Request, res: Response) => {
  const msgId = Number(req.params.id)
  messages = messages.filter((m) => m.id !== msgId)
  return res.json({ message: 'Message supprimé', success: true })
})

app.post('/api/messages/:id/archive', (req: Request, res: Response) => {
  const msgId = Number(req.params.id)
  const msg = messages.find((m) => m.id === msgId)
  if (msg) {
    msg.is_archived = true
  }
  return res.json({ message: 'Message archivé', success: true })
})

// ---------------------------------------------
// GROUPS ROUTES
// ---------------------------------------------
app.get('/api/groups', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const userGroupIds = groupMembers.filter((gm) => gm.user_id === currentUser.id).map((gm) => gm.group_id)

  const result = groups.map((g) => {
    const members = groupMembers
      .filter((gm) => gm.group_id === g.id)
      .map((gm) => {
        const u = users.find((user) => user.id === gm.user_id)
        return {
          id: gm.id,
          user_id: gm.user_id,
          role: gm.role,
          user: u,
        }
      })

    const groupMsgs = groupMessages.filter((m) => m.group_id === g.id)
    const lastMsg = groupMsgs[groupMsgs.length - 1] || null

    return {
      ...g,
      members_count: members.length,
      members,
      last_message: lastMsg,
      is_member: userGroupIds.includes(g.id),
    }
  })

  return res.json(result)
})

app.post('/api/groups', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const { name, description, avatar_url, member_ids } = req.body

  const newGroup: Group = {
    id: groups.length + 1,
    name: name || 'Nouveau Groupe',
    description: description || '',
    avatar_url: avatar_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    created_by: currentUser.id,
    created_at: new Date().toISOString(),
  }

  groups.push(newGroup)

  groupMembers.push({
    id: groupMembers.length + 1,
    group_id: newGroup.id,
    user_id: currentUser.id,
    role: 'admin',
  })

  if (Array.isArray(member_ids)) {
    member_ids.forEach((id) => {
      const uId = Number(id)
      if (uId !== currentUser.id && users.some((u) => u.id === uId)) {
        groupMembers.push({
          id: groupMembers.length + 1,
          group_id: newGroup.id,
          user_id: uId,
          role: 'member',
        })
      }
    })
  }

  return res.json(newGroup)
})

app.get('/api/groups/:id', (req: Request, res: Response) => {
  const groupId = Number(req.params.id)
  const group = groups.find((g) => g.id === groupId)
  if (!group) return res.status(404).json({ message: 'Groupe non trouvé' })

  const members = groupMembers
    .filter((gm) => gm.group_id === groupId)
    .map((gm) => ({
      ...gm,
      user: users.find((u) => u.id === gm.user_id),
    }))

  const msgs = groupMessages
    .filter((m) => m.group_id === groupId)
    .map((m) => ({
      ...m,
      sender: users.find((u) => u.id === m.sender_id),
    }))

  return res.json({
    group: {
      ...group,
      members,
    },
    messages: msgs,
  })
})

app.post('/api/groups/:id/members', (req: Request, res: Response) => {
  const groupId = Number(req.params.id)
  const userId = Number(req.body.user_id)

  const exists = groupMembers.some((gm) => gm.group_id === groupId && gm.user_id === userId)
  if (!exists) {
    groupMembers.push({
      id: groupMembers.length + 1,
      group_id: groupId,
      user_id: userId,
      role: 'member',
    })
  }

  return res.json({ message: 'Membre ajouté avec succès', success: true })
})

app.delete('/api/groups/:id/members/:userId', (req: Request, res: Response) => {
  const groupId = Number(req.params.id)
  const userId = Number(req.params.userId)
  groupMembers = groupMembers.filter((gm) => !(gm.group_id === groupId && gm.user_id === userId))
  return res.json({ message: 'Membre retiré avec succès', success: true })
})

app.patch('/api/groups/:id/members/:userId/role', (req: Request, res: Response) => {
  const groupId = Number(req.params.id)
  const userId = Number(req.params.userId)
  const role = req.body.role === 'admin' ? 'admin' : 'member'

  const member = groupMembers.find((gm) => gm.group_id === groupId && gm.user_id === userId)
  if (member) member.role = role

  return res.json({ message: 'Rôle mis à jour', success: true })
})

app.post('/api/groups/:id/messages', (req: Request, res: Response) => {
  const groupId = Number(req.params.id)
  const currentUser = getCurrentUser(req)
  const content = req.body.content_original || ''

  const newMsg: GroupMessage = {
    id: groupMessages.length + 1,
    group_id: groupId,
    sender_id: currentUser.id,
    content_original: content,
    created_at: new Date().toISOString(),
    sender: currentUser,
  }

  groupMessages.push(newMsg)
  return res.json(newMsg)
})

app.post('/api/groups/:id/summarize', async (req: Request, res: Response) => {
  const groupId = Number(req.params.id)
  const msgs = groupMessages.filter((m) => m.group_id === groupId)

  let summary = "Résumé du canal : Les membres ont échangé sur les dernières nouveautés de l'application et la feuille de route produit."
  if (aiClient && msgs.length > 0) {
    try {
      const prompt = `Voici une liste de messages d'un groupe NexChat :\n${msgs.map((m) => m.content_original).join('\n')}\nRésume en 2 ou 3 phrases clés l'essentiel de la discussion.`
      const aiRes = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      })
      if (aiRes.text) summary = aiRes.text
    } catch (e) {
      console.warn('[Gemini summarize error]:', e)
    }
  }

  return res.json({ summary })
})

// ---------------------------------------------
// MODERATION & CONTACTS ROUTES
// ---------------------------------------------
app.get('/api/moderation/contacts', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const userContactIds = contacts.filter((c) => c.user_id === currentUser.id).map((c) => c.contact_id)
  const contactUsers = users.filter((u) => userContactIds.includes(u.id))
  return res.json(contactUsers)
})

app.post('/api/moderation/contacts/toggle', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const contactId = Number(req.body.contact_id)

  const index = contacts.findIndex((c) => c.user_id === currentUser.id && c.contact_id === contactId)
  let isContact = false

  if (index >= 0) {
    contacts.splice(index, 1)
  } else {
    contacts.push({ user_id: currentUser.id, contact_id: contactId })
    isContact = true
  }

  return res.json({ is_contact: isContact })
})

app.post('/api/moderation/contacts/by-email', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const email = String(req.body.email || '').toLowerCase().trim()

  let targetUser = users.find((u) => u.email.toLowerCase() === email)
  if (!targetUser) {
    targetUser = {
      id: users.length + 1,
      username: email.split('@')[0],
      email,
      primary_language_code: 'en',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      bio: 'Utilisateur NexChat',
      is_online: false,
    }
    users.push(targetUser)
  }

  if (!contacts.some((c) => c.user_id === currentUser.id && c.contact_id === targetUser.id)) {
    contacts.push({ user_id: currentUser.id, contact_id: targetUser.id })
  }

  return res.json({ user: targetUser, message: 'Contact ajouté' })
})

app.get('/api/moderation/blocks', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const blockedIds = blockedUsers.filter((b) => b.user_id === currentUser.id).map((b) => b.blocked_id)
  return res.json(blockedIds)
})

app.post('/api/moderation/blocks/toggle', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const blockedId = Number(req.body.blocked_id)

  const index = blockedUsers.findIndex((b) => b.user_id === currentUser.id && b.blocked_id === blockedId)
  let isBlocked = false

  if (index >= 0) {
    blockedUsers.splice(index, 1)
  } else {
    blockedUsers.push({ user_id: currentUser.id, blocked_id: blockedId })
    isBlocked = true
  }

  return res.json({ is_blocked: isBlocked })
})

app.post('/api/moderation/report', (_req: Request, res: Response) => {
  return res.json({ message: 'Signalement transmis aux modérateurs avec succès' })
})

// ---------------------------------------------
// POSTS & FEED ROUTES
// ---------------------------------------------
app.get('/api/posts', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const feed = posts.map((p) => {
    const author = users.find((u) => u.id === p.user_id) || {
      id: p.user_id,
      username: 'NexChatter',
      avatar_url: '',
    }
    return {
      id: p.id,
      user_id: p.user_id,
      user: author,
      content: p.content,
      media_url: p.media_url,
      likes_count: p.likes.length,
      is_liked: p.likes.includes(currentUser.id),
      comments_count: 2,
      created_at: p.created_at,
    }
  })
  return res.json(feed)
})

app.post('/api/posts', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const { content, media_url } = req.body

  const newPost: Post = {
    id: posts.length + 1,
    user_id: currentUser.id,
    content: content || '',
    media_url: media_url || null,
    likes: [],
    created_at: new Date().toISOString(),
  }

  posts.unshift(newPost)

  return res.json({
    ...newPost,
    user: currentUser,
    likes_count: 0,
    is_liked: false,
    comments_count: 0,
  })
})

app.post('/api/posts/:id/like', (req: Request, res: Response) => {
  const postId = Number(req.params.id)
  const currentUser = getCurrentUser(req)
  const post = posts.find((p) => p.id === postId)

  if (!post) return res.status(404).json({ message: 'Publication non trouvée' })

  const idx = post.likes.indexOf(currentUser.id)
  let isLiked = false
  if (idx >= 0) {
    post.likes.splice(idx, 1)
  } else {
    post.likes.push(currentUser.id)
    isLiked = true
  }

  return res.json({
    is_liked: isLiked,
    likes_count: post.likes.length,
  })
})

// ---------------------------------------------
// STORIES ROUTES
// ---------------------------------------------
app.get('/api/stories', (_req: Request, res: Response) => {
  const activeStories = stories.map((s) => {
    const author = users.find((u) => u.id === s.user_id)
    return {
      id: s.id,
      user_id: s.user_id,
      user: author,
      text_content: s.text_content,
      media_url: s.media_url,
      expires_at: s.expires_at,
      created_at: s.created_at,
    }
  })
  return res.json(activeStories)
})

app.post('/api/stories', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const { text_content, media_url } = req.body

  const newStory: Story = {
    id: stories.length + 1,
    user_id: currentUser.id,
    text_content: text_content || '',
    media_url: media_url || null,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  }

  stories.unshift(newStory)
  return res.json({
    ...newStory,
    user: currentUser,
  })
})

// ---------------------------------------------
// AI FEATURES ROUTES
// ---------------------------------------------
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body

  if (aiClient && message) {
    try {
      const systemInstruction =
        "Tu es NexBot, l'assistant d'intelligence artificielle officiel de l'application de messagerie NexChat. Réponds de façon concise, utile, agréable et engageante. Tu peux aider à reformuler des phrases, traduire, expliquer des expressions culturelles, ou discuter amicalement."

      const conversationHistory = Array.isArray(history)
        ? history.slice(-6).map((h: any) => `${h.role === 'ai' ? 'NexBot' : 'Utilisateur'}: ${h.content}`).join('\n')
        : ''

      const fullPrompt = `${conversationHistory}\nUtilisateur: ${message}\nNexBot:`

      const aiRes = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          systemInstruction,
        },
      })

      if (aiRes.text) {
        return res.json({ data: aiRes.text.trim() })
      }
    } catch (e) {
      console.warn('[Gemini AI chat error]:', e)
    }
  }

  // Fallback realistic responses
  const fallbacks = [
    `NexBot à votre service ! Vous avez dit : "${message}". Que souhaitez-vous perfectionner : le ton, la grammaire, ou la traduction ?`,
    `C'est une excellente question ! Dans NexChat, vous pouvez également sauvegarder des phrases types dans votre lexique personnalisé pour y accéder en un clic.`,
    `Bien reçu ! Je peux vous suggérer des formulations professionnelles ou plus familières selon vos besoins de communication.`,
  ]
  const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)]

  return res.json({ data: randomFallback })
})

app.post('/api/ai/rephrase', async (req: Request, res: Response) => {
  const { text, tone } = req.body

  if (aiClient && text) {
    try {
      const toneDescriptions: Record<string, string> = {
        pro: 'professionnel, courtois et soigné',
        friendly: 'chaleureux, amical et enthousiaste',
        natural: 'naturel, fluide et moderne',
      }
      const toneDesc = toneDescriptions[tone] || 'fluide et naturel'
      const prompt = `Reformule le texte suivant sur un ton ${toneDesc}. Retourne uniquement le texte reformulé, sans guillemets ni explications additionnelles :\n"${text}"`

      const aiRes = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      })

      if (aiRes.text) {
        return res.json({ data: aiRes.text.trim() })
      }
    } catch (e) {
      console.warn('[Gemini rephrase error]:', e)
    }
  }

  // Smart fallback variations
  let result = text
  if (tone === 'pro') {
    result = `Permettez-moi de vous informer que ${text.toLowerCase()}`
  } else if (tone === 'friendly') {
    result = `Coucou ! Juste un petit mot pour dire : ${text} 😊`
  } else {
    result = text
  }

  return res.json({ data: result })
})

app.post('/api/ai/smart-replies', async (req: Request, res: Response) => {
  const convId = Number(req.body.conversation_id)
  const convMsgs = messages.filter((m) => m.conversation_id === convId)
  const lastMsg = convMsgs[convMsgs.length - 1]

  if (aiClient && lastMsg?.content) {
    try {
      const prompt = `Voici le dernier message reçu dans une conversation de messagerie instantanée :\n"${lastMsg.content}"\nGénère exactement 3 suggestions de réponses courtes et pertinentes (1 ligne chacune). Format JSON : ["suggestion1", "suggestion2", "suggestion3"].`

      const aiRes = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      })

      if (aiRes.text) {
        const cleaned = aiRes.text.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(cleaned)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ data: parsed.slice(0, 3) })
        }
      }
    } catch (e) {
      console.warn('[Gemini smart-replies error]:', e)
    }
  }

  return res.json({
    data: [
      'Parfait, bien reçu ! 👍',
      'Ça me convient tout à fait.',
      'On en reparle un peu plus tard.',
    ],
  })
})

app.get('/api/ai/stats', (_req: Request, res: Response) => {
  return res.json({
    data: {
      words_translated: 4850,
      top_languages: [
        { language: 'en', count: 182 },
        { language: 'fr', count: 140 },
        { language: 'es', count: 96 },
        { language: 'de', count: 42 },
      ],
    },
  })
})

app.get('/api/ai/saved-phrases', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const userPhrases = savedPhrases.filter((p) => p.user_id === currentUser.id)
  return res.json({ data: userPhrases })
})

app.post('/api/ai/saved-phrases', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  const { phrase_fr, phrase_en, phrase_es, category } = req.body

  const newPhrase: SavedPhrase = {
    id: savedPhrases.length + 1,
    user_id: currentUser.id,
    phrase_fr: phrase_fr || '',
    phrase_en: phrase_en || phrase_fr,
    phrase_es: phrase_es || phrase_fr,
    category: category || 'Général',
    created_at: new Date().toISOString(),
  }

  savedPhrases.push(newPhrase)
  return res.json({ data: newPhrase })
})

app.delete('/api/ai/saved-phrases/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  savedPhrases = savedPhrases.filter((p) => p.id !== id)
  return res.json({ success: true, message: 'Phrase supprimée' })
})

app.put('/api/ai/config', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  if (req.body.ai_proactive_translation !== undefined) {
    currentUser.ai_proactive_translation = Boolean(req.body.ai_proactive_translation)
  }
  if (req.body.ai_translation_formality !== undefined) {
    currentUser.ai_translation_formality = String(req.body.ai_translation_formality)
  }
  return res.json({ success: true })
})

// ---------------------------------------------
// SUBSCRIPTIONS & PAYMENTS
// ---------------------------------------------
app.post('/api/subscription/initialize', (req: Request, res: Response) => {
  const { tier } = req.body
  const ref = `NEX_SUB_${Date.now()}`
  return res.json({
    authorization_url: `/payment/callback?reference=${ref}&status=success&tier=${tier || 'obsidian_pro'}`,
    reference: ref,
  })
})

app.post('/api/subscription/initialize-public', (req: Request, res: Response) => {
  const { tier } = req.body
  const ref = `NEX_SUB_${Date.now()}`
  return res.json({
    authorization_url: `/payment/callback?reference=${ref}&status=success&tier=${tier || 'obsidian_pro'}`,
    reference: ref,
  })
})

app.get('/api/subscription/verify', (req: Request, res: Response) => {
  const ref = String(req.query.reference || '')
  return res.json({
    status: 'success',
    tier: 'obsidian_pro',
    reference: ref,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
  })
})

app.get('/api/subscription/status', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req)
  return res.json({
    subscription_tier: currentUser.subscription_tier || 'obsidian_pro',
    has_active_subscription: true,
    subscription: {
      tier: currentUser.subscription_tier || 'obsidian_pro',
      status: 'active',
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    },
    ai_quota: {
      used: 34,
      limit: 10000,
    },
  })
})

// ---------------------------------------------
// CALLS & BROADCASTING
// ---------------------------------------------
app.post('/api/calls/signal', (_req: Request, res: Response) => {
  return res.json({ success: true, message: 'Signal transmis' })
})

app.post('/api/broadcasting/auth', (_req: Request, res: Response) => {
  return res.json({ auth: 'mock_auth_signature_ok' })
})

// ---------------------------------------------
// VITE / STATIC SERVING
// ---------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production'

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    app.use(express.static(path.resolve('dist')))
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'))
    })
  }

  app.listen(PORT, HOST, () => {
    console.log(`[NexChat Server] Running on http://${HOST}:${PORT}`)
  })
}

startServer().catch((err) => {
  console.error('[NexChat Server Error]:', err)
  process.exit(1)
})
