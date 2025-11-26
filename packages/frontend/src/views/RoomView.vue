<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import ScrumRoom from '@/components/ScrumRoom.vue'
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import { useColyseus } from '@/composables/useColyseus'
import { isRoomFullError } from '@/lib/errors'

const router = useRouter()
const route = useRoute()
const { connected, connectionState, joinOrCreateRoom, cancelReconnect } = useColyseus()

const storedName = useLocalStorage('scrumkit-username', '')
const storedAvatar = useLocalStorage('scrumkit-avatar', 0)
const loading = ref(true)

onMounted(async () => {
  // If already connected, we're good
  if (connected.value) {
    loading.value = false
    return
  }

  const roomid = route.params.roomid as string
  if (!roomid) {
    router.push('/')
    return
  }

  if (!storedName.value) {
    // No name in localStorage, redirect to login with room prefilled
    router.push({ path: '/', query: { room: roomid } })
    return
  }

  // Has name and avatar, auto-join the room
  try {
    await joinOrCreateRoom(storedName.value, roomid, storedAvatar.value)
    loading.value = false
  } catch (e: unknown) {
    console.error('Failed to auto-join room:', e)
    if (isRoomFullError(e)) {
      router.push({ path: '/', query: { room: roomid, error: 'room_full' } })
    } else {
      router.push({ path: '/', query: { room: roomid } })
    }
  }
})

// If fully disconnected (not reconnecting), redirect to login
watch(connectionState, (state, prevState) => {
  // Only redirect if we were connected/reconnecting and are now fully disconnected
  if (state === 'disconnected' && (prevState === 'connected' || prevState === 'reconnecting')) {
    const roomid = route.params.roomid as string
    router.push({ path: '/', query: { room: roomid } })
  }
})

// Handle leaving page while reconnecting
function handleLeaveWhileReconnecting() {
  cancelReconnect()
  const roomid = route.params.roomid as string
  router.push({ path: '/', query: { room: roomid } })
}
</script>

<template>
  <div v-if="loading" class="min-h-screen bg-background flex items-center justify-center">
    <div class="text-center">
      <div class="text-2xl font-bold">Joining room...</div>
    </div>
  </div>

  <template v-else>
    <ConnectionStatus />

    <ScrumRoom v-if="connected" />

    <!-- Show reconnecting overlay -->
    <div
      v-else-if="connectionState === 'reconnecting'"
      class="min-h-screen bg-background flex items-center justify-center"
    >
      <div class="text-center space-y-4">
        <div class="text-2xl font-bold">Reconnecting...</div>
        <p class="text-muted-foreground">Trying to restore your connection</p>
      </div>
    </div>
  </template>
</template>
