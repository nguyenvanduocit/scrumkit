<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { Share2, LogOut } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useRetro } from '@/composables/useRetro'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import RetroColumn from '@/components/RetroColumn.vue'

const { players, columns, mySessionId, myName, roomName, leave, onPlayerChange } = useRetro()

// Fun Vietnamese message templates for retro
const joinTemplates = [
  (name: string) => `${name} vừa tham gia retro!`,
  (name: string) => `Chào mừng ${name} đến với retrospective!`,
  (name: string) => `${name} đã vào, sẵn sàng chia sẻ!`,
  (name: string) => `${name} xuất hiện, let's reflect!`,
]

const leaveTemplates = [
  (name: string) => `${name} đã rời retro!`,
  (name: string) => `Tạm biệt ${name}!`,
  (name: string) => `${name} đã offline!`,
]

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!

// Player join/leave toasts
let unsubscribe: (() => void) | undefined
onMounted(() => {
  unsubscribe = onPlayerChange((player, type) => {
    if (type === 'leave') {
      toast(pickRandom(leaveTemplates)(player.name))
    } else {
      toast(pickRandom(joinTemplates)(player.name))
    }
  })
})
onUnmounted(() => unsubscribe?.())

// Sorted columns by order
const sortedColumns = computed(() => {
  return Array.from(columns.value.values()).sort((a, b) => a.order - b.order)
})

// Player list
const playerList = computed(() => Array.from(players.value.values()))

const roomUrl = computed(() => `${window.location.origin}/retro/${roomName.value}`)
const qrDataUrl = ref('')

import { watch } from 'vue'
watch(roomUrl, async (url) => {
  if (url) {
    qrDataUrl.value = await QRCode.toDataURL(url, { width: 400, margin: 2 })
  }
}, { immediate: true })
</script>

<template>
  <div class="h-screen bg-background flex flex-col">
    <!-- Header -->
    <header class="retro-header flex items-center justify-between px-4 py-3">
      <div class="flex items-center gap-3">
        <h1 class="font-heading text-lg font-bold">Retro</h1>
      </div>
      <div class="flex items-center gap-2">
        <Dialog>
          <DialogTrigger as-child>
            <button class="action-btn">
              <Share2 :size="16" />
            </button>
          </DialogTrigger>
          <DialogContent class="max-w-sm">
            <DialogHeader>
              <DialogTitle>Share Retro</DialogTitle>
            </DialogHeader>
            <div class="flex flex-col items-center gap-4">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="Room QR Code" class="rounded-lg border border-border/30 shadow-lg" />
              <p class="font-mono text-sm break-all text-center">{{ roomUrl }}</p>
            </div>
          </DialogContent>
        </Dialog>
        <button class="action-btn" title="Leave" @click="leave">
          <LogOut :size="16" />
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Columns -->
      <div class="flex-1 flex gap-4 p-4 overflow-x-auto">
        <RetroColumn
          v-for="column in sortedColumns"
          :key="column.id"
          :column="column"
          :my-name="myName"
        />
      </div>

      <!-- Player Sidebar -->
      <aside class="player-sidebar w-48 p-3 flex flex-col gap-2 overflow-y-auto">
        <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
          Participants ({{ playerList.length }})
        </h3>
        <div
          v-for="player in playerList"
          :key="player.id"
          class="player-card"
          :class="{ 'player-self': player.id === mySessionId, 'player-disconnected': player.status === 'disconnected' }"
        >
          <img
            :src="`/avatars/${player.avatar}.webp`"
            :alt="player.name"
            class="w-8 h-8 rounded"
          />
          <span class="text-sm truncate">{{ player.name }}</span>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.retro-header {
  background: linear-gradient(to bottom, oklch(28% 0.02 260), oklch(25% 0.02 260));
  border-bottom: 1px solid oklch(100% 0 0 / 0.08);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 8px;
  background: linear-gradient(145deg, oklch(35% 0.02 260), oklch(28% 0.02 260));
  border: 1px solid oklch(40% 0.02 260);
  border-top-color: oklch(50% 0.02 260);
  color: oklch(80% 0.01 260);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow:
    0 2px 6px -2px oklch(0% 0 0 / 0.4),
    inset 0 1px 0 oklch(100% 0 0 / 0.1);
}

.action-btn:hover {
  transform: translateY(-1px);
  background: linear-gradient(145deg, oklch(40% 0.02 260), oklch(32% 0.02 260));
}

.action-btn:active {
  transform: translateY(1px);
}

.player-sidebar {
  background: linear-gradient(to left, oklch(22% 0.02 260), oklch(25% 0.02 260));
  border-left: 1px solid oklch(100% 0 0 / 0.05);
}

.player-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  background: oklch(28% 0.02 260);
  border: 1px solid oklch(35% 0.02 260);
}

.player-card.player-self {
  border-color: oklch(65% 0.14 85);
  background: linear-gradient(145deg, oklch(30% 0.03 85), oklch(25% 0.02 260));
}

.player-card.player-disconnected {
  opacity: 0.5;
}
</style>
