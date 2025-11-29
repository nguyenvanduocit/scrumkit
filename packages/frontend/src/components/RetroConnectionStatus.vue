<script setup lang="ts">
import { watch } from 'vue'
import { useRetro } from '@/composables/useRetro'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'

const { connectionState, reconnectAttempts, cancelReconnect } = useRetro()

// Toast notifications for connection state changes
watch(connectionState, (state, prevState) => {
  if (state === 'reconnecting' && prevState === 'connected') {
    toast.warning('Connection lost', {
      description: 'Attempting to reconnect...',
    })
  }

  if (state === 'connected' && prevState === 'reconnecting') {
    toast.success('Reconnected', {
      description: 'Connection restored successfully.',
    })
  }

  if (state === 'disconnected' && prevState === 'reconnecting') {
    toast.error('Connection failed', {
      description: 'Could not reconnect to the server. Please rejoin the room.',
    })
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="connectionState === 'reconnecting'"
      class="reconnect-banner"
    >
      <div class="pulse-dot" />
      <span class="font-semibold">Reconnecting... ({{ reconnectAttempts + 1 }}/5)</span>
      <Button size="sm" variant="ghost" @click="cancelReconnect">
        Cancel
      </Button>
    </div>
  </Teleport>
</template>

<style scoped>
.reconnect-banner {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: linear-gradient(145deg, oklch(35% 0.08 85), oklch(28% 0.08 85));
  border: 1px solid oklch(50% 0.12 85);
  box-shadow:
    0 4px 16px -4px oklch(0% 0 0 / 0.5),
    inset 0 1px 0 oklch(100% 0 0 / 0.1);
  color: oklch(95% 0.02 85);
}

.pulse-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: oklch(80% 0.18 85);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}
</style>
