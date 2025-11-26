<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { Share2, LogOut } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useColyseus } from '@/composables/useColyseus'
import { useActivityTracker } from '@/composables/useActivityTracker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import PokerTable from '@/components/PokerTable.vue'
import PokerCardStack from '@/components/PokerCardStack.vue'
import PlayerStatusList from '@/components/PlayerStatusList.vue'

const VOTE_OPTIONS = ['1', '2', '3', '5', '8', '13', '?']

const { players, revealed, mySessionId, roomName, vote, reveal, reset, leave, sendStatus, onPlayerChange } = useColyseus()

// Fun Vietnamese message templates
const joinTemplates = [
  (name: string) => `${name} vừa xuất hiện, ai cũng im lặng...`,
  (name: string) => `Kính chào ${name} đã ghé thăm phòng họp!`,
  (name: string) => `${name} đã vào, chuẩn bị estimate thôi!`,
  (name: string) => `Welcome ${name}! Hy vọng bạn vote đúng nha~`,
  (name: string) => `${name} đã tham gia. Let's gooo!`,
  (name: string) => `${name} vừa bước vào, ai vote sai coi chừng!`,
  (name: string) => `Ơ ${name} vào rồi kìa, chào đi mọi người!`,
  (name: string) => `${name} đã online, estimation bắt đầu!`,
  (name: string) => `${name} xuất hiện như một cơn gió~`,
  (name: string) => `Chúc mừng ${name} đã tìm được phòng họp!`,
]

const leaveTemplates = [
  (name: string) => `${name} đã rời đi, tạm biệt nhé!`,
  (name: string) => `${name} vừa biến mất, chắc đi pha trà...`,
  (name: string) => `Kính thưa đồng bào, ${name} vừa leave!`,
  (name: string) => `${name} đã offline, vote không kịp rồi!`,
  (name: string) => `${name} rời phòng, ai đó làm gì sai à?`,
  (name: string) => `Bye ${name}! Hẹn gặp lại sprint sau~`,
  (name: string) => `${name} đã thoát, hy vọng không phải vì bug!`,
  (name: string) => `${name} rời đi lặng lẽ như cách họ đến...`,
  (name: string) => `${name} đã disconnect, F to pay respects`,
  (name: string) => `${name} vừa out, meeting tiếp thôi!`,
]

const reloadTemplates = [
  (name: string) => `${name} vừa reload, chắc máy yếu quá!`,
  (name: string) => `${name} F5 xong rồi, tiếp tục thôi~`,
  (name: string) => `Máy ${name} lag quá nên phải refresh!`,
  (name: string) => `${name} reconnect thành công, ez!`,
  (name: string) => `${name} vừa restart, RAM hơi ít...`,
  (name: string) => `${name} reload page, có gì đâu mà lo!`,
  (name: string) => `${name} đã quay lại sau khi F5!`,
  (name: string) => `${name} refresh xong, Chrome ngốn RAM quá!`,
]

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!

// Track recent leaves for reload detection
const recentLeaves = new Map<string, number>()
const RELOAD_THRESHOLD_MS = 5000

// Player join/leave toasts
let unsubscribe: (() => void) | undefined
onMounted(() => {
  unsubscribe = onPlayerChange((player, type) => {
    const now = Date.now()

    if (type === 'leave') {
      // Track this leave
      recentLeaves.set(player.name, now)
      // Clean up old entries
      for (const [name, time] of recentLeaves) {
        if (now - time > RELOAD_THRESHOLD_MS) recentLeaves.delete(name)
      }
      // Delay the leave toast to check for quick rejoin
      setTimeout(() => {
        // If still in recentLeaves, they didn't rejoin quickly
        if (recentLeaves.has(player.name)) {
          recentLeaves.delete(player.name)
          toast(pickRandom(leaveTemplates)(player.name))
        }
      }, 1500)
    } else {
      // Check if this is a quick rejoin (reload)
      const leaveTime = recentLeaves.get(player.name)
      if (leaveTime && now - leaveTime < RELOAD_THRESHOLD_MS) {
        recentLeaves.delete(player.name)
        toast(pickRandom(reloadTemplates)(player.name))
      } else {
        toast(pickRandom(joinTemplates)(player.name))
      }
    }
  })
})
onUnmounted(() => unsubscribe?.())

const myVote = computed(() => players.value.get(mySessionId.value)?.vote || '')

// Activity tracking
const { onCardHoverStart, onCardHoverEnd, onVoteChange } = useActivityTracker(
  sendStatus,
  () => !!myVote.value
)

function handleVote(option: string) {
  vote(option)
  onVoteChange()
}
const hasAnyVotes = computed(() => Array.from(players.value.values()).some(p => p.vote))

const roomUrl = computed(() => `${window.location.origin}/tables/${roomName.value}`)
const qrDataUrl = ref('')

watch(roomUrl, async (url) => {
  if (url) {
    qrDataUrl.value = await QRCode.toDataURL(url, { width: 400, margin: 2 })
  }
}, { immediate: true })
</script>

<template>
  <div class="h-screen bg-background grid grid-rows-[auto_1fr_auto] md:grid-rows-[1fr_auto] relative">
    <!-- Mobile Header -->
    <header class="mobile-header md:hidden flex items-center justify-between px-4 py-2">
      <h1 class="font-heading text-lg font-bold">ScrumKit</h1>
      <div class="flex items-center gap-2">
        <Dialog>
          <DialogTrigger as-child>
            <button class="action-btn-sm">
              <Share2 :size="16" />
            </button>
          </DialogTrigger>
          <DialogContent class="max-w-sm">
            <DialogHeader>
              <DialogTitle>Share Room</DialogTitle>
            </DialogHeader>
            <div class="flex flex-col items-center gap-4">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="Room QR Code" class="rounded-lg border border-border/30 shadow-lg" />
              <p class="font-mono text-sm break-all text-center">{{ roomUrl }}</p>
            </div>
          </DialogContent>
        </Dialog>
        <button class="action-btn-sm" title="Leave" @click="leave">
          <LogOut :size="16" />
        </button>
      </div>
    </header>

    <!-- Desktop Floating Action Buttons -->
    <div class="floating-actions hidden md:flex absolute top-4 right-4 z-50 items-center gap-2">
      <Dialog>
        <DialogTrigger as-child>
          <button class="invite-btn">
            <Share2 :size="16" />
            <span>Invite</span>
          </button>
        </DialogTrigger>
        <DialogContent class="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share Room</DialogTitle>
          </DialogHeader>
          <div class="flex flex-col items-center gap-4">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="Room QR Code" class="rounded-lg border border-border/30 shadow-lg" />
            <p class="font-mono text-sm break-all text-center">{{ roomUrl }}</p>
          </div>
        </DialogContent>
      </Dialog>
      <button class="action-btn" title="Leave" @click="leave">
        <LogOut :size="18" />
      </button>
    </div>

    <!-- Main Content -->
    <!-- Desktop: Poker Table -->
    <PokerTable
      class="hidden md:flex overflow-auto"
      :players="players"
      :my-session-id="mySessionId"
      :revealed="revealed"
      @reveal="reveal"
      @reset="reset"
    />

    <!-- Mobile: Player List + Controls -->
    <div class="flex md:hidden flex-col overflow-auto">
      <PlayerStatusList
        :players="players"
        :my-session-id="mySessionId"
        :revealed="revealed"
      />

      <!-- Mobile Controls -->
      <div v-if="hasAnyVotes || revealed" class="p-4">
        <Button
          @click="revealed ? reset() : reveal()"
          class="w-full py-3 text-base font-bold uppercase tracking-wide"
        >
          {{ revealed ? 'New Round' : 'Reveal Cards' }}
        </Button>
      </div>
    </div>

    <!-- Row 3: Card Selection -->
    <!-- Desktop: Voting Cards -->
    <div class="card-tray hidden md:flex items-center justify-center gap-3 p-4">
      <button
        v-for="option in VOTE_OPTIONS"
        :key="option"
        @click="handleVote(option)"
        @mouseenter="onCardHoverStart"
        @mouseleave="onCardHoverEnd"
        :disabled="revealed"
        class="poker-card"
        :class="{ 'poker-card-selected': myVote === option }"
      >
        <span class="poker-card-corner top-left">{{ option }}</span>
        <span class="poker-card-center">{{ option }}</span>
        <span class="poker-card-corner bottom-right">{{ option }}</span>
        <span class="poker-card-pattern" />
      </button>
    </div>

    <!-- Mobile: Card Stack -->
    <div class="card-tray md:hidden">
      <PokerCardStack
        :my-vote="myVote"
        :disabled="revealed"
        @vote="handleVote"
      />
    </div>
  </div>
</template>

<style scoped>
/* Mobile header with safe area */
.mobile-header {
  padding-top: calc(var(--safe-area-top, 0px) + 0.5rem);
  padding-left: calc(var(--safe-area-left, 0px) + 1rem);
  padding-right: calc(var(--safe-area-right, 0px) + 1rem);
  background: linear-gradient(to bottom, oklch(28% 0.02 260), oklch(25% 0.02 260));
  border-bottom: 1px solid oklch(100% 0 0 / 0.08);
}

/* Small action button for mobile header */
.action-btn-sm {
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

.action-btn-sm:active {
  transform: scale(0.95);
  box-shadow:
    0 1px 3px -1px oklch(0% 0 0 / 0.3),
    inset 0 1px 0 oklch(100% 0 0 / 0.08);
}

/* Rainbow glow invite button */
.invite-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  background: linear-gradient(145deg, oklch(35% 0.02 260), oklch(28% 0.02 260));
  border: 1px solid oklch(45% 0.02 260);
  border-top-color: oklch(55% 0.02 260);
  color: oklch(90% 0.01 260);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  box-shadow:
    0 2px 8px -2px oklch(0% 0 0 / 0.4),
    inset 0 1px 0 oklch(100% 0 0 / 0.1);
}

.invite-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(
    90deg,
    oklch(70% 0.2 0) 0%,
    oklch(70% 0.2 90) 25%,
    oklch(70% 0.2 180) 50%,
    oklch(70% 0.2 270) 75%,
    oklch(70% 0.2 360) 100%
  );
  animation: rainbow-rotate 4s linear infinite;
  opacity: 0.7;
  z-index: 0;
}

.invite-btn > * {
  position: relative;
  z-index: 2;
}

.invite-btn::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 14px;
  background: linear-gradient(
    90deg,
    oklch(70% 0.2 0) 0%,
    oklch(70% 0.2 90) 25%,
    oklch(70% 0.2 180) 50%,
    oklch(70% 0.2 270) 75%,
    oklch(70% 0.2 360) 100%
  );
  animation: rainbow-rotate-blur 4s linear infinite;
  opacity: 0.9;
  z-index: -1;
}

.invite-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(145deg, oklch(40% 0.02 260), oklch(32% 0.02 260));
}

.invite-btn:active {
  transform: translateY(1px);
}

@keyframes rainbow-rotate {
  from { filter: hue-rotate(0deg); }
  to { filter: hue-rotate(360deg); }
}

@keyframes rainbow-rotate-blur {
  from { filter: hue-rotate(0deg) blur(12px); }
  to { filter: hue-rotate(360deg) blur(12px); }
}

/* Floating action buttons */
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  background: linear-gradient(145deg, oklch(35% 0.02 260), oklch(28% 0.02 260));
  border: 1px solid oklch(40% 0.02 260);
  border-top-color: oklch(50% 0.02 260);
  color: oklch(80% 0.01 260);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow:
    0 2px 8px -2px oklch(0% 0 0 / 0.4),
    inset 0 1px 0 oklch(100% 0 0 / 0.1);
}

.action-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(145deg, oklch(40% 0.02 260), oklch(32% 0.02 260));
  box-shadow:
    0 4px 12px -2px oklch(0% 0 0 / 0.5),
    inset 0 1px 0 oklch(100% 0 0 / 0.15);
}

.action-btn:active {
  transform: translateY(1px);
  box-shadow:
    0 1px 4px -1px oklch(0% 0 0 / 0.3),
    inset 0 1px 0 oklch(100% 0 0 / 0.08);
}

/* Card tray with polished style */
.card-tray {
  background: linear-gradient(
    to top,
    oklch(30% 0.02 260) 0%,
    oklch(32% 0.02 260) 100%
  );
  border-top: 1px solid oklch(100% 0 0 / 0.08);
  box-shadow:
    inset 0 1px 0 oklch(100% 0 0 / 0.05),
    0 -4px 16px -4px oklch(0% 0 0 / 0.3);
  padding-bottom: max(1.5rem, var(--safe-area-bottom, 0px));
}

.poker-card {
  position: relative;
  width: 3.5rem;
  height: 5rem;
  border: 1px solid oklch(70% 0 0 / 0.3);
  border-top-color: oklch(100% 0 0 / 0.5);
  border-radius: 10px;
  background: linear-gradient(165deg, #ffffff 0%, #f0f0f0 100%);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  overflow: hidden;
  box-shadow:
    0 2px 8px -2px oklch(0% 0 0 / 0.3),
    inset 0 1px 0 oklch(100% 0 0 / 0.8);
}

.poker-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.poker-card:hover:not(:disabled):not(.poker-card-selected) {
  transform: translateY(-6px);
  box-shadow:
    0 8px 16px -4px oklch(0% 0 0 / 0.4),
    inset 0 1px 0 oklch(100% 0 0 / 0.9);
}

.poker-card:active:not(:disabled) {
  transform: translateY(-2px) scale(0.98);
}

.poker-card-selected {
  background: linear-gradient(165deg, oklch(80% 0.18 85) 0%, oklch(72% 0.18 85) 100%);
  border-color: oklch(65% 0.15 85);
  border-top-color: oklch(90% 0.10 85);
  transform: translateY(-10px);
  box-shadow:
    0 10px 20px -4px oklch(0% 0 0 / 0.4),
    0 4px 8px -2px oklch(75% 0.18 85 / 0.3),
    inset 0 1px 0 oklch(100% 0 0 / 0.4);
}

.poker-card-corner {
  position: absolute;
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1;
  color: #c41e3a;
}

.poker-card-corner.top-left {
  top: 4px;
  left: 5px;
}

.poker-card-corner.bottom-right {
  bottom: 4px;
  right: 5px;
  transform: rotate(180deg);
}

.poker-card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  font-weight: 900;
  color: #c41e3a;
}

.poker-card-pattern {
  position: absolute;
  inset: 5px;
  border: 1px solid oklch(0% 0 0 / 0.06);
  border-radius: 6px;
  pointer-events: none;
}

.poker-card-selected .poker-card-corner,
.poker-card-selected .poker-card-center {
  color: oklch(20% 0.05 85);
}

.poker-card-selected .poker-card-pattern {
  border-color: oklch(0% 0 0 / 0.1);
}
</style>
