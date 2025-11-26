<script setup lang="ts">
import { watch } from 'vue'
import { useColyseus } from '@/composables/useColyseus'
import { toast } from '@/components/ui/toast/use-toast'
import { Button } from '@/components/ui/button'

const { connectionState, cancelReconnect, retryConnection } = useColyseus()

// Toast notifications for connection state changes
let reconnectingToastId: string | null = null

watch(connectionState, (state, prevState) => {
  if (state === 'reconnecting' && prevState === 'connected') {
    const { id } = toast({
      title: 'Connection lost',
      description: 'Attempting to reconnect...',
      duration: 0, // Don't auto-dismiss
    })
    reconnectingToastId = id
  }

  if (state === 'connected' && prevState === 'reconnecting') {
    toast({
      title: 'Reconnected',
      description: 'Connection restored successfully.',
      duration: 3000,
    })
  }

  if (state === 'disconnected' && prevState === 'reconnecting') {
    toast({
      title: 'Connection failed',
      description: 'Could not reconnect to the server.',
      variant: 'destructive',
      duration: 5000,
    })
  }
})
</script>

<template>
  <div
    v-if="connectionState === 'reconnecting'"
    class="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-card border-3 border-border shadow-shadow px-4 py-3 flex items-center gap-3"
  >
    <div class="size-3 bg-yellow-500 rounded-full animate-pulse" />
    <span class="font-bold">Reconnecting...</span>
    <Button size="sm" variant="ghost" @click="cancelReconnect">
      Cancel
    </Button>
  </div>

  <div
    v-else-if="connectionState === 'disconnected'"
    class="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-card border-3 border-border shadow-shadow px-4 py-3 flex items-center gap-3"
  >
    <div class="size-3 bg-red-500 rounded-full" />
    <span class="font-bold">Disconnected</span>
    <Button size="sm" variant="default" @click="retryConnection">
      Retry
    </Button>
  </div>
</template>
