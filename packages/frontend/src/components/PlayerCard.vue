<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { PlayerStatus } from '@scrumkit/models/types'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

interface Props {
  name: string
  avatar: number
  hasVoted: boolean
  revealed: boolean
  vote?: string
  isMe?: boolean
  status?: PlayerStatus
  playerId?: string
  disconnectedAt?: number
}

const props = withDefaults(defineProps<Props>(), {
  isMe: false,
  vote: '',
  status: 'idle',
  playerId: '',
  disconnectedAt: 0,
})

// Countdown for disconnected users (30 seconds total)
const DISCONNECT_TIMEOUT = 30
const countdown = ref(0)
let countdownInterval: ReturnType<typeof setInterval> | null = null

function updateCountdown() {
  if (props.disconnectedAt > 0) {
    const elapsed = Math.floor((Date.now() - props.disconnectedAt) / 1000)
    countdown.value = Math.max(0, DISCONNECT_TIMEOUT - elapsed)
  } else {
    countdown.value = 0
  }
}

watch(() => props.disconnectedAt, (newVal) => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  if (newVal > 0) {
    updateCountdown()
    countdownInterval = setInterval(updateCountdown, 1000)
  } else {
    countdown.value = 0
  }
}, { immediate: true })

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})

const showCountdown = computed(() => props.status === 'disconnected' && countdown.value > 0)

const emit = defineEmits<{
  throwEmoji: [emoji: string]
}>()

const THROW_EMOJIS = ['👍', '👎', '❤️', '🔥', '💩', '🎉']

function handleEmojiClick(emoji: string) {
  emit('throwEmoji', emoji)
  // Don't close - let user spam emojis!
}

// Status display config
const statusConfig: Record<PlayerStatus, { emoji: string; class: string; show: boolean }> = {
  idle: { emoji: '', class: '', show: false },
  deciding: { emoji: '🤔', class: 'animate-bounce', show: true },
  confused: { emoji: '😵‍💫', class: 'animate-spin-slow', show: true },
  sleeping: { emoji: '😴', class: 'animate-pulse', show: true },
  ready: { emoji: '✅', class: '', show: false },
  disconnected: { emoji: '📵', class: 'animate-pulse', show: true },
  // Emoji reaction statuses (receiver)
  loved: { emoji: '🥰', class: 'animate-bounce', show: true },
  praised: { emoji: '😊', class: 'animate-bounce', show: true },
  fire: { emoji: '🔥', class: 'animate-pulse', show: true },
  celebrated: { emoji: '🥳', class: 'animate-bounce', show: true },
  pooped: { emoji: '😭', class: 'animate-wiggle', show: true },
  booed: { emoji: '😢', class: 'animate-pulse', show: true },
  // Emoji reaction statuses (sender)
  loving: { emoji: '😍', class: 'animate-bounce', show: true },
  praising: { emoji: '👏', class: 'animate-bounce', show: true },
  hyping: { emoji: '🤩', class: 'animate-pulse', show: true },
  partying: { emoji: '🎊', class: 'animate-bounce', show: true },
  mischievous: { emoji: '😈', class: 'animate-wiggle', show: true },
  judging: { emoji: '😤', class: 'animate-pulse', show: true },
}
</script>

<template>
  <HoverCard v-if="!isMe" :open-delay="0" :close-delay="100">
    <HoverCardTrigger as-child>
      <div class="flex flex-col items-center gap-1 group relative cursor-pointer">
        <!-- Avatar + Card Stack -->
        <div class="relative">
          <!-- Avatar Container - Polished card style -->
          <div
            class="avatar-container relative w-16 h-16 rounded-xl overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg"
            :class="[
              status === 'sleeping' || status === 'disconnected' ? 'grayscale opacity-60' : '',
              status === 'confused' ? 'animate-wiggle' : '',
            ]"
          >
            <img
              :src="`/avatars/${avatar}.webp`"
              :alt="name"
              class="w-full h-full object-cover"
            />
            <!-- Disconnect countdown overlay -->
            <div
              v-if="showCountdown"
              class="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl"
            >
              <span class="text-white text-lg font-bold">{{ countdown }}</span>
            </div>
          </div>

          <!-- Emotion Badge - Shows status emoji only -->
          <div
            v-if="statusConfig[status].show"
            class="absolute -bottom-1 -right-1 w-6 h-6 rounded-md flex items-center justify-center text-sm status-badge transition-all duration-300"
          >
            <span :class="statusConfig[status].class">{{ statusConfig[status].emoji }}</span>
          </div>
        </div>

        <!-- Name Badge - Polished style -->
        <div class="name-badge px-2.5 py-1 rounded-md text-xs font-semibold truncate max-w-20 name-badge-other">
          {{ name }}
        </div>
      </div>
    </HoverCardTrigger>
    <HoverCardContent side="top" :side-offset="8" class="w-auto p-2 emoji-picker-content">
      <div class="flex gap-1">
        <button
          v-for="emoji in THROW_EMOJIS"
          :key="emoji"
          class="emoji-btn w-9 h-9 flex items-center justify-center text-xl rounded-md transition-all duration-150 hover:scale-125 hover:bg-black/10 active:scale-90"
          @click="handleEmojiClick(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </HoverCardContent>
  </HoverCard>

  <!-- Self player (no popover) -->
  <div
    v-else
    class="flex flex-col items-center gap-1 group relative scale-110"
  >
    <!-- Avatar + Card Stack -->
    <div class="relative">
      <!-- Avatar Container - Polished card style -->
      <div
        class="avatar-container relative w-16 h-16 rounded-xl overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg ring-2 ring-main ring-offset-2 ring-offset-background"
        :class="[
          status === 'sleeping' || status === 'disconnected' ? 'grayscale opacity-60' : '',
          status === 'confused' ? 'animate-wiggle' : '',
        ]"
      >
        <img
          :src="`/avatars/${avatar}.webp`"
          :alt="name"
          class="w-full h-full object-cover"
        />
        <!-- Disconnect countdown overlay -->
        <div
          v-if="showCountdown"
          class="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl"
        >
          <span class="text-white text-lg font-bold">{{ countdown }}</span>
        </div>
      </div>

      <!-- Emotion Badge - Shows status emoji only -->
      <div
        v-if="statusConfig[status].show"
        class="absolute -bottom-1 -right-1 w-6 h-6 rounded-md flex items-center justify-center text-sm status-badge transition-all duration-300"
      >
        <span :class="statusConfig[status].class">{{ statusConfig[status].emoji }}</span>
      </div>
    </div>

    <!-- Name Badge - Polished style -->
    <div class="name-badge px-2.5 py-1 rounded-md text-xs font-semibold truncate max-w-20 name-badge-me">
      {{ name }}
    </div>
  </div>
</template>

<style scoped>
@keyframes wiggle {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-wiggle {
  animation: wiggle 0.3s ease-in-out infinite;
}

.animate-spin-slow {
  animation: spin-slow 2s linear infinite;
}

/* Avatar container with light effect */
.avatar-container {
  background: linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%);
  border: 1px solid oklch(50% 0.02 260);
  border-top-color: oklch(100% 0 0 / 0.3);
  box-shadow:
    0 2px 8px -2px oklch(10% 0.01 260),
    inset 0 1px 0 oklch(100% 0 0 / 0.2);
}

/* Vote badge - revealed vote */
.vote-badge-voted {
  background: linear-gradient(145deg, oklch(78% 0.18 85) 0%, oklch(72% 0.18 85) 100%);
  border: 1px solid oklch(65% 0.15 85);
  border-top-color: oklch(85% 0.12 85);
  box-shadow:
    0 2px 4px -1px oklch(10% 0.01 260),
    inset 0 1px 0 oklch(100% 0 0 / 0.25);
}

/* Status badge - emoji */
.status-badge {
  background: linear-gradient(145deg, oklch(35% 0.02 260) 0%, oklch(30% 0.02 260) 100%);
  border: 1px solid oklch(40% 0.02 260);
  border-top-color: oklch(100% 0 0 / 0.1);
  box-shadow:
    0 2px 4px -1px oklch(10% 0.01 260),
    inset 0 1px 0 oklch(100% 0 0 / 0.1);
}

/* Name badge - current user */
.name-badge-me {
  background: linear-gradient(145deg, oklch(78% 0.18 85) 0%, oklch(72% 0.18 85) 100%);
  color: oklch(15% 0.02 85);
  border: 1px solid oklch(65% 0.15 85);
  border-top-color: oklch(85% 0.12 85);
  box-shadow:
    0 2px 4px -1px oklch(10% 0.01 260),
    inset 0 1px 0 oklch(100% 0 0 / 0.2);
}

/* Name badge - other users */
.name-badge-other {
  background: linear-gradient(145deg, oklch(35% 0.02 260) 0%, oklch(30% 0.02 260) 100%);
  color: oklch(90% 0 0);
  border: 1px solid oklch(40% 0.02 260);
  border-top-color: oklch(100% 0 0 / 0.1);
  box-shadow:
    0 2px 4px -1px oklch(10% 0.01 260),
    inset 0 1px 0 oklch(100% 0 0 / 0.1);
}
</style>

<style>
/* Global style for HoverCard portal */
.emoji-picker-content[data-slot="hover-card-content"] {
  background: linear-gradient(145deg, oklch(28% 0.02 260) 0%, oklch(22% 0.02 260) 100%) !important;
  border-color: oklch(40% 0.02 260) !important;
  box-shadow:
    0 4px 16px -4px oklch(0% 0 0 / 0.5),
    inset 0 1px 0 oklch(100% 0 0 / 0.1) !important;
}
</style>
