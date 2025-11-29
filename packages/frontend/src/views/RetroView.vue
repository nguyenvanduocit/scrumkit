<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import RetroRoom from '@/components/RetroRoom.vue'
import RetroConnectionStatus from '@/components/RetroConnectionStatus.vue'
import { useRetro } from '@/composables/useRetro'
import { isRoomFullError } from '@/lib/errors'

const router = useRouter()
const route = useRoute()
const { connected, connectionState, joinOrCreateRoom, cancelReconnect, leave } = useRetro()

onBeforeRouteLeave(() => {
  leave()
})

const storedName = useLocalStorage('scrumkit-username', '')
const storedAvatar = useLocalStorage('scrumkit-avatar', 0)
const loading = ref(true)

onMounted(async () => {
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
    router.push({ path: '/', query: { room: roomid, type: 'retro' } })
    return
  }

  try {
    await joinOrCreateRoom(storedName.value, roomid, storedAvatar.value)
    loading.value = false
  } catch (e: unknown) {
    console.error('Failed to auto-join retro room:', e)
    if (isRoomFullError(e)) {
      router.push({ path: '/', query: { room: roomid, type: 'retro', error: 'room_full' } })
    } else {
      router.push({ path: '/', query: { room: roomid, type: 'retro' } })
    }
  }
})

watch(connectionState, (state, prevState) => {
  if (state === 'disconnected' && (prevState === 'connected' || prevState === 'reconnecting')) {
    const roomid = route.params.roomid as string
    router.push({ path: '/', query: { room: roomid, type: 'retro' } })
  }
})

function handleLeaveWhileReconnecting() {
  cancelReconnect()
  const roomid = route.params.roomid as string
  router.push({ path: '/', query: { room: roomid, type: 'retro' } })
}
</script>

<template>
  <div v-if="loading" class="min-h-screen bg-background flex items-center justify-center">
    <div class="text-center">
      <div class="text-2xl font-bold">Joining retro...</div>
    </div>
  </div>

  <template v-else>
    <RetroConnectionStatus />

    <RetroRoom v-if="connected" />

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
