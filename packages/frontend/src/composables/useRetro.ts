import { ref, shallowRef, computed } from 'vue'
import { Client, Room, getStateCallbacks } from 'colyseus.js'
import { toRoomId } from '@/lib/roomNames'
import type { PlayerStatus, PlayerData, ItemData, ColumnData } from '@scrumkit/models/types'

type PlayerChangeCallback = (player: PlayerData, type: 'join' | 'leave') => void
const playerChangeCallbacks = new Set<PlayerChangeCallback>()

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

// Reconnection config
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_BASE_DELAY = 1000 // 1s, 2s, 4s, 8s, 16s

const serverUrl = import.meta.env.VITE_SERVER_URL || 'ws://localhost:2567'
const client = new Client(serverUrl)
const room = shallowRef<Room | null>(null)
const players = ref<Map<string, PlayerData>>(new Map())
const columns = ref<Map<string, ColumnData>>(new Map())
const mySessionId = ref('')
const myName = ref('')
const roomName = ref('')
const connectionState = ref<ConnectionState>('disconnected')
const error = ref<string | null>(null)
const reconnectAttempts = ref(0)

// Store join params for reconnection
let lastJoinParams: { playerName: string; displayName: string; avatar: number } | null = null
let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null

const connected = computed(() => connectionState.value === 'connected')
const isReconnecting = computed(() => connectionState.value === 'reconnecting')

function resetState() {
  room.value = null
  roomName.value = ''
  players.value = new Map()
  columns.value = new Map()
  mySessionId.value = ''
}

function setupRoom(joinedRoom: Room, displayName: string, playerName: string) {
  room.value = joinedRoom
  mySessionId.value = joinedRoom.sessionId
  myName.value = playerName
  roomName.value = displayName
  connectionState.value = 'connected'
  error.value = null
  reconnectAttempts.value = 0

  const seenPlayers = new Set<string>()
  const $ = getStateCallbacks(joinedRoom)

  joinedRoom.onStateChange.once(() => {
    const state = joinedRoom.state as any

    // Setup player callbacks
    $(state).players!.onAdd((player: any, sessionId: string) => {
      const playerData: PlayerData = {
        id: player.id,
        name: player.name,
        vote: player.vote || '',
        avatar: player.avatar,
        status: player.status || 'idle',
      }

      players.value = new Map(players.value).set(sessionId, playerData)

      if (seenPlayers.size > 0 && !seenPlayers.has(sessionId) && sessionId !== mySessionId.value) {
        playerChangeCallbacks.forEach(cb => cb(playerData, 'join'))
      }
      seenPlayers.add(sessionId)

      $(player).onChange(() => {
        const updated: PlayerData = {
          id: player.id,
          name: player.name,
          vote: player.vote || '',
          avatar: player.avatar,
          status: player.status || 'idle',
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

      // Don't show toast if:
      // 1. It's our own session, OR
      // 2. It's our old session being cleaned up (same name = reconnection)
      const isOwnSession = sessionId === mySessionId.value
      const isOwnOldSession = playerData && playerData.name === myName.value

      if (!isOwnSession && !isOwnOldSession && playerData) {
        playerChangeCallbacks.forEach(cb => cb(playerData, 'leave'))
      }
    })

    // Setup column callbacks
    $(state).columns!.onAdd((column: any, columnId: string) => {
      const columnData: ColumnData = {
        id: column.id,
        title: column.title,
        order: column.order,
        items: new Map(),
      }

      // Add column to state FIRST so item callbacks can find it
      columns.value = new Map(columns.value).set(columnId, columnData)

      // Setup item callbacks for this column (fires immediately for existing items)
      $(column).items!.onAdd((item: any, itemId: string) => {
        const itemData: ItemData = {
          id: item.id,
          content: item.content,
          authorId: item.authorId,
          authorName: item.authorName,
          createdAt: item.createdAt,
        }

        const newColumns = new Map(columns.value)
        const col = newColumns.get(columnId)
        if (col) {
          const newItems = new Map(col.items)
          newItems.set(itemId, itemData)
          newColumns.set(columnId, { ...col, items: newItems })
          columns.value = newColumns
        }

        $(item).onChange(() => {
          const updatedItem: ItemData = {
            id: item.id,
            content: item.content,
            authorId: item.authorId,
            authorName: item.authorName,
            createdAt: item.createdAt,
          }
          const newCols = new Map(columns.value)
          const c = newCols.get(columnId)
          if (c) {
            const newItems = new Map(c.items)
            newItems.set(itemId, updatedItem)
            newCols.set(columnId, { ...c, items: newItems })
            columns.value = newCols
          }
        })
      })

      $(column).items!.onRemove((_item: any, itemId: string) => {
        const newColumns = new Map(columns.value)
        const col = newColumns.get(columnId)
        if (col) {
          const newItems = new Map(col.items)
          newItems.delete(itemId)
          newColumns.set(columnId, { ...col, items: newItems })
          columns.value = newColumns
        }
      })
    })
  })

  joinedRoom.onLeave((code: number) => {
    console.log(`[Retro] Left room with code: ${code}`)
    resetState()

    // Code 1000 = normal/intentional close
    // Other codes = unexpected disconnect
    if (code !== 1000 && lastJoinParams) {
      attemptReconnect()
    } else {
      connectionState.value = 'disconnected'
    }
  })

  joinedRoom.onError((code: number, message?: string) => {
    console.error('[Retro] Room error:', code, message)
    error.value = message || `Room error (code: ${code})`
  })
}

async function attemptReconnect() {
  if (!lastJoinParams || connectionState.value === 'reconnecting') return

  connectionState.value = 'reconnecting'

  while (reconnectAttempts.value < MAX_RECONNECT_ATTEMPTS) {
    const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts.value)
    console.log(`[Retro] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.value + 1}/${MAX_RECONNECT_ATTEMPTS})`)

    await new Promise<void>((resolve) => {
      reconnectTimeoutId = setTimeout(resolve, delay)
    })

    // Check if reconnect was cancelled
    if (connectionState.value !== 'reconnecting') return

    try {
      const roomId = toRoomId(lastJoinParams.displayName)
      const joinedRoom = await client.joinOrCreate('retro', {
        name: lastJoinParams.playerName,
        roomName: roomId,
        avatar: lastJoinParams.avatar
      })

      setupRoom(joinedRoom, lastJoinParams.displayName, lastJoinParams.playerName)
      console.log('[Retro] Reconnected successfully')
      return
    } catch (e) {
      reconnectAttempts.value++
      console.error(`[Retro] Reconnect attempt ${reconnectAttempts.value} failed:`, e)
    }
  }

  // All attempts failed
  connectionState.value = 'disconnected'
  error.value = 'Connection lost. Please rejoin manually.'
  reconnectAttempts.value = 0
}

function cancelReconnect() {
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId)
    reconnectTimeoutId = null
  }
  if (connectionState.value === 'reconnecting') {
    connectionState.value = 'disconnected'
    reconnectAttempts.value = 0
  }
}

export function useRetro() {
  async function joinOrCreateRoom(playerName: string, displayName: string, avatar?: number) {
    try {
      // Cancel any ongoing reconnect
      cancelReconnect()

      error.value = null
      connectionState.value = 'connecting'

      const roomId = toRoomId(displayName)
      const avatarValue = avatar ?? 0

      // Store params for reconnection
      lastJoinParams = { playerName, displayName, avatar: avatarValue }

      const joinedRoom = await client.joinOrCreate('retro', {
        name: playerName,
        roomName: roomId,
        avatar: avatarValue
      })

      setupRoom(joinedRoom, displayName, playerName)
      return joinedRoom
    } catch (e) {
      connectionState.value = 'disconnected'
      error.value = e instanceof Error ? e.message : 'Failed to join room'
      throw e
    }
  }

  function addItem(columnId: string, content: string) {
    room.value?.send('addItem', { columnId, content })
  }

  function editItem(columnId: string, itemId: string, content: string) {
    room.value?.send('editItem', { columnId, itemId, content })
  }

  function deleteItem(columnId: string, itemId: string) {
    room.value?.send('deleteItem', { columnId, itemId })
  }

  function sendStatus(status: PlayerStatus) {
    room.value?.send('status', status)
  }

  function leave() {
    // Clear reconnect params so we don't auto-reconnect
    lastJoinParams = null
    cancelReconnect()
    room.value?.leave()
    resetState()
    connectionState.value = 'disconnected'
  }

  function onPlayerChange(callback: PlayerChangeCallback) {
    playerChangeCallbacks.add(callback)
    return () => playerChangeCallbacks.delete(callback)
  }

  return {
    room,
    players,
    columns,
    mySessionId,
    myName,
    roomName,
    connected,
    connectionState,
    isReconnecting,
    reconnectAttempts,
    error,
    joinOrCreateRoom,
    addItem,
    editItem,
    deleteItem,
    sendStatus,
    leave,
    cancelReconnect,
    onPlayerChange,
  }
}
