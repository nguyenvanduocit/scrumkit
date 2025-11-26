import { ref, shallowRef, computed } from 'vue'
import { Client, Room, getStateCallbacks } from 'colyseus.js'
import { toRoomId } from '@/lib/roomNames'
import type { PlayerStatus, PlayerData } from '@scrumkit/models/types'

type PlayerChangeCallback = (player: PlayerData, type: 'join' | 'leave') => void
const playerChangeCallbacks = new Set<PlayerChangeCallback>()

type EmojiThrownCallback = (data: { fromId: string; toId: string; emoji: string }) => void
const emojiThrownCallbacks = new Set<EmojiThrownCallback>()

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

const serverUrl = import.meta.env.VITE_SERVER_URL || 'ws://localhost:2567'
const client = new Client(serverUrl)
const room = shallowRef<Room | null>(null)
const players = ref<Map<string, PlayerData>>(new Map())
const revealed = ref(false)
const mySessionId = ref('')
const roomName = ref('')
const connectionState = ref<ConnectionState>('disconnected')
const error = ref<string | null>(null)

// Reconnection state
let reconnectAttempts = 0
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let lastJoinParams: { playerName: string; displayName: string; avatar: number } | null = null
let lastReconnectionToken: string | null = null
let isReconnecting = false // Guard against concurrent reconnect attempts

const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY = 1000 // 1 second
const STORAGE_KEY = 'scrumkit_session'

// Session persistence for page reload recovery
interface StoredSession {
  token: string
  roomName: string
  playerName: string
  avatar: number
}

// Use sessionStorage instead of localStorage:
// - Persists across page reload (same tab) ✅
// - Isolated per tab (no multi-tab conflicts) ✅
// - Cleared when tab closes ✅
function saveSession(session: StoredSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch { /* ignore */ }
}

function loadSession(): StoredSession | null {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

// Page Visibility API - trigger reconnect when page becomes visible
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && connectionState.value === 'reconnecting') {
      // Page became visible while reconnecting - try immediately
      clearReconnectTimeout()
      attemptReconnect()
    }
  })
}

// Computed for backwards compatibility
const connected = computed(() => connectionState.value === 'connected')

function getReconnectDelay(): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  return Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), 16000)
}

function clearReconnectTimeout() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
}

function resetState() {
  room.value = null
  roomName.value = ''
  players.value = new Map()
  mySessionId.value = ''
}

async function attemptReconnect(): Promise<boolean> {
  // Guard against concurrent reconnect attempts
  if (isReconnecting) return false

  if (!lastJoinParams || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    connectionState.value = 'disconnected'
    lastReconnectionToken = null
    return false
  }

  isReconnecting = true
  connectionState.value = 'reconnecting'
  reconnectAttempts++

  try {
    const { playerName, displayName, avatar } = lastJoinParams
    let joinedRoom: Room

    // Try to reconnect with token first (keeps same sessionId + state)
    if (lastReconnectionToken) {
      try {
        joinedRoom = await client.reconnect(lastReconnectionToken)
        console.log('Reconnected with token, keeping state')
      } catch {
        // Token expired or invalid - fall back to joinOrCreate
        console.log('Token reconnect failed, joining as new')
        lastReconnectionToken = null
        const roomId = toRoomId(displayName)
        joinedRoom = await client.joinOrCreate('scrum', { name: playerName, roomName: roomId, avatar })
      }
    } else {
      const roomId = toRoomId(displayName)
      joinedRoom = await client.joinOrCreate('scrum', { name: playerName, roomName: roomId, avatar })
    }

    setupRoom(joinedRoom, displayName)
    reconnectAttempts = 0
    isReconnecting = false
    return true
  } catch (e) {
    console.error(`Reconnect attempt ${reconnectAttempts} failed:`, e)
    isReconnecting = false

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = getReconnectDelay()
      reconnectTimeout = setTimeout(attemptReconnect, delay)
    } else {
      connectionState.value = 'disconnected'
      lastReconnectionToken = null
      clearSession() // Clear stale session so next join starts fresh
      error.value = 'Connection lost. Please rejoin the room.'
    }
    return false
  }
}

function setupRoom(joinedRoom: Room, name: string) {
  room.value = joinedRoom
  mySessionId.value = joinedRoom.sessionId
  roomName.value = name
  connectionState.value = 'connected'
  error.value = null
  lastReconnectionToken = joinedRoom.reconnectionToken

  // Persist session for page reload recovery
  if (lastJoinParams && lastReconnectionToken) {
    saveSession({
      token: lastReconnectionToken,
      roomName: lastJoinParams.displayName,
      playerName: lastJoinParams.playerName,
      avatar: lastJoinParams.avatar,
    })
  }

  // Track which players we've already seen (to avoid duplicate join notifications on reconnect)
  const seenPlayers = new Set<string>()

  // Schema 3.x: use getStateCallbacks to get the $ function
  const $ = getStateCallbacks(joinedRoom)

  // Wait for state to be ready before setting up callbacks
  joinedRoom.onStateChange.once(() => {
    const state = joinedRoom.state as any

    // Initialize revealed from current state
    revealed.value = state.revealed

    // Setup collection callbacks (Schema 3.x style)
    $(state).players!.onAdd((player: any, sessionId: string) => {
      const playerData: PlayerData = {
        id: player.id,
        name: player.name,
        vote: player.vote,
        avatar: player.avatar,
        status: player.status || 'idle',
        disconnectedAt: player.disconnectedAt || 0,
      }

      players.value = new Map(players.value).set(sessionId, playerData)

      // Notify only for truly new players (not initial load, not self)
      if (seenPlayers.size > 0 && !seenPlayers.has(sessionId) && sessionId !== mySessionId.value) {
        playerChangeCallbacks.forEach(cb => cb(playerData, 'join'))
      }
      seenPlayers.add(sessionId)

      // Listen for individual player property changes
      $(player).onChange(() => {
        const updated: PlayerData = {
          id: player.id,
          name: player.name,
          vote: player.vote,
          avatar: player.avatar,
          status: player.status || 'idle',
          disconnectedAt: player.disconnectedAt || 0,
        }
        const newMap = new Map(players.value)
        newMap.set(sessionId, updated)
        players.value = newMap
      })
    })

    $(state).players!.onRemove((player: any, sessionId: string) => {
      const playerData = players.value.get(sessionId)
      const newMap = new Map(players.value)
      newMap.delete(sessionId)
      players.value = newMap
      seenPlayers.delete(sessionId)

      // Notify listeners (skip self)
      if (sessionId !== mySessionId.value && playerData) {
        playerChangeCallbacks.forEach(cb => cb(playerData, 'leave'))
      }
    })

    // Listen for revealed state changes
    $(state).listen('revealed', (value: boolean) => {
      revealed.value = value
    })
  })

  // Listen for emoji thrown events
  joinedRoom.onMessage('emojiThrown', (data: { fromId: string; toId: string; emoji: string }) => {
    emojiThrownCallbacks.forEach(cb => cb(data))
  })

  joinedRoom.onLeave((code: number) => {
    // Save token before reset (for reconnection)
    const savedToken = lastReconnectionToken
    resetState()

    // Code 1000 = normal closure (user left intentionally)
    // Code 4000+ = custom codes
    // Other codes = unexpected disconnect
    if (code !== 1000 && lastJoinParams) {
      // Unexpected disconnect - try to reconnect
      lastReconnectionToken = savedToken // Restore for reconnect
      const delay = getReconnectDelay()
      connectionState.value = 'reconnecting'
      reconnectTimeout = setTimeout(attemptReconnect, delay)
    } else {
      connectionState.value = 'disconnected'
      lastJoinParams = null
      lastReconnectionToken = null
    }
  })

  joinedRoom.onError((code: number, message?: string) => {
    console.error('Room error:', code, message)
    error.value = message || `Room error (code: ${code})`
  })
}

export function useColyseus() {
  async function joinOrCreateRoom(playerName: string, displayName: string, avatar?: number) {
    try {
      clearReconnectTimeout()
      error.value = null
      connectionState.value = 'connecting'

      const avatarValue = avatar ?? 0
      lastJoinParams = { playerName, displayName, avatar: avatarValue }

      // Check for stored session - try reconnect if same room
      const storedSession = loadSession()
      if (storedSession && storedSession.roomName === displayName) {
        try {
          console.log('Found stored session, attempting reconnect...')
          const joinedRoom = await client.reconnect(storedSession.token)
          console.log('Reconnected from stored session')
          setupRoom(joinedRoom, displayName)
          reconnectAttempts = 0
          return joinedRoom
        } catch (e) {
          console.log('Stored session reconnect failed, joining fresh:', e)
          clearSession()
        }
      }

      const roomId = toRoomId(displayName)
      const joinedRoom = await client.joinOrCreate('scrum', { name: playerName, roomName: roomId, avatar: avatarValue })
      setupRoom(joinedRoom, displayName)
      reconnectAttempts = 0
      return joinedRoom
    } catch (e) {
      connectionState.value = 'disconnected'
      error.value = e instanceof Error ? e.message : 'Failed to join room'
      throw e
    }
  }

  function vote(value: string) {
    room.value?.send('vote', value)
  }

  function reveal() {
    room.value?.send('reveal')
  }

  function reset() {
    room.value?.send('reset')
  }

  function sendStatus(status: PlayerStatus) {
    room.value?.send('status', status)
  }

  function throwEmoji(targetId: string, emoji: string) {
    room.value?.send('throwEmoji', { targetId, emoji })
  }

  function leave() {
    clearReconnectTimeout()
    lastJoinParams = null
    lastReconnectionToken = null
    reconnectAttempts = 0
    isReconnecting = false
    clearSession() // Clear stored session on intentional leave
    room.value?.leave()
    resetState()
    connectionState.value = 'disconnected'
  }

  function cancelReconnect() {
    clearReconnectTimeout()
    lastJoinParams = null
    lastReconnectionToken = null
    reconnectAttempts = 0
    isReconnecting = false
    clearSession() // User cancelled, clear stale session
    connectionState.value = 'disconnected'
  }

  function retryConnection() {
    if (lastJoinParams) {
      reconnectAttempts = 0
      attemptReconnect()
    }
  }

  function onPlayerChange(callback: PlayerChangeCallback) {
    playerChangeCallbacks.add(callback)
    return () => playerChangeCallbacks.delete(callback)
  }

  function onEmojiThrown(callback: EmojiThrownCallback) {
    emojiThrownCallbacks.add(callback)
    return () => emojiThrownCallbacks.delete(callback)
  }

  function getStoredSession() {
    return loadSession()
  }

  function clearStoredSession() {
    clearSession()
  }

  return {
    room,
    players,
    revealed,
    mySessionId,
    roomName,
    connected,
    connectionState,
    error,
    reconnectAttempts: computed(() => reconnectAttempts),
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    joinOrCreateRoom,
    vote,
    reveal,
    reset,
    sendStatus,
    throwEmoji,
    leave,
    cancelReconnect,
    retryConnection,
    onPlayerChange,
    onEmojiThrown,
    getStoredSession,
    clearStoredSession,
  }
}

export type { PlayerStatus }
